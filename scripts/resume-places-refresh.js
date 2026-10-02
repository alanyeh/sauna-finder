// Finite catch-up batch. Dry-run reads the queue without spending Places quota.
import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fetchPlacesJSON, PlacesQuotaError } from './lib/places.js';
import { isPublicSauna } from '../src/lib/saunaQuality.js';

export function refreshPatch(row, place, marker, checkedAt) {
  if (place.id !== row.place_id) throw new Error('Place identity mismatch');
  const patch = {};
  if (Number.isFinite(place.rating)) patch.rating = place.rating;
  if (Number.isInteger(place.userRatingCount)) patch.rating_count = place.userRatingCount;
  if (place.regularOpeningHours?.weekdayDescriptions?.length) {
    patch.hours = place.regularOpeningHours.weekdayDescriptions.join(', ');
  }
  if (place.businessStatus === 'CLOSED_PERMANENTLY') patch.listing_status = 'hidden';
  if (place.businessStatus === 'CLOSED_TEMPORARILY') patch.listing_status = 'review';
  patch.review_notes = [row.review_notes, `${marker} ${checkedAt}: Google Places hours, ratings and status checked (${place.businessStatus || 'unspecified'}).`].filter(Boolean).join('\n');
  patch.updated_at = checkedAt;
  return patch;
}

export function shouldRefresh(row, entry, marker) {
  return !!row && row.place_id === entry.place_id && isPublicSauna(row) && !row.review_notes?.includes(marker);
}

export function matchingPlaceId(row, places) {
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const matches = places.filter(place => normalize(place.displayName?.text) === normalize(row.name)
    && Number.isFinite(place.location?.latitude) && Number.isFinite(place.location?.longitude)
    && Math.abs(place.location.latitude - row.lat) < 0.0015
    && Math.abs(place.location.longitude - row.lng) < 0.0015);
  if (matches.length !== 1) throw new Error('Missing Place ID: no unique name and location match; manual review required');
  return matches[0].id;
}

async function main() {
  config({ path: '.env.local', quiet: true });
  const batch = JSON.parse(await readFile(new URL('./places-refresh-2026-10-02.json', import.meta.url)));
  const apply = process.argv.includes('--apply');
  const marker = `[${batch.batch}:complete]`;
  if (apply && (Date.now() < Date.parse(batch.notBefore) || Date.now() >= Date.parse(batch.expiresAt))) {
    console.log('Outside the authorized catch-up window; no API calls or writes.');
    return;
  }
  const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: rows, error } = await db.from('saunas').select('*').in('id', batch.listings.map(r => r.id));
  if (error) throw error;
  const pending = batch.listings.filter(entry => shouldRefresh(rows.find(r => r.id === entry.id), entry, marker));
  const report = { batch: batch.batch, startedAt: new Date().toISOString(), apply, pending: pending.length, completed: [], conflicts: [], errors: [], quotaExhausted: false, journal: [] };
  await mkdir('reports', { recursive: true });
  const persist = () => writeFile('reports/places-catchup.json', JSON.stringify(report, null, 2));
  await persist();
  console.log(`${pending.length} eligible listings remain; ${apply ? 'applying' : 'dry run, no Places calls'}.`);
  if (apply && pending.length && !process.env.GOOGLE_PLACES_API_KEY) throw new Error('Missing Google Places API credential');
  if (apply) for (const entry of pending) {
    const row = rows.find(r => r.id === entry.id);
    try {
      let placeId = row.place_id;
      if (!placeId) {
        const search = await fetchPlacesJSON('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.location' },
          body: JSON.stringify({ textQuery: `${row.name} ${row.address}`, pageSize: 5 }),
        });
        placeId = matchingPlaceId(row, search.places || []);
      }
      const place = await fetchPlacesJSON(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: { 'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY, 'X-Goog-FieldMask': 'id,businessStatus,regularOpeningHours,rating,userRatingCount' },
      });
      const patch = refreshPatch({ ...row, place_id: placeId }, place, marker, new Date().toISOString());
      if (!row.place_id) patch.place_id = placeId;
      const change = { id: row.id, before: Object.fromEntries(Object.keys(patch).map(k => [k, row[k]])), after: patch };
      report.journal.push(change);
      await persist(); // Save restoration evidence before mutation.
      let query = db.from('saunas').update(patch).eq('id', row.id).eq('listing_status', row.listing_status);
      query = row.place_id === null ? query.is('place_id', null) : query.eq('place_id', row.place_id);
      query = row.updated_at ? query.eq('updated_at', row.updated_at) : query.is('updated_at', null);
      query = row.review_notes === null ? query.is('review_notes', null) : query.eq('review_notes', row.review_notes);
      const { data, error: updateError } = await query.select('id');
      if (updateError) throw updateError;
      (data.length ? report.completed : report.conflicts).push(row.id);
      await persist();
      console.log(`${report.completed.length}/${pending.length}: ${row.name}`);
      await new Promise(r => setTimeout(r, 300));
    } catch (error) {
      if (error instanceof PlacesQuotaError) { report.quotaExhausted = true; await persist(); break; }
      report.errors.push({ id: row.id, error: error.message });
      await persist();
      if (/\(401\)|\(403\)/.test(error.message)) break;
    }
  }
  const summary = `Places catch-up: ${report.completed.length} updated; ${pending.length - report.completed.length} remaining; quota exhausted: ${report.quotaExhausted}.`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${report.completed.length}\n`);
  if (report.errors.length || report.conflicts.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}

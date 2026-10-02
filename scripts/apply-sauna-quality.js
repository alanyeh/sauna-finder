// Default is a dry run. --apply writes only changed fields with optimistic
// concurrency guards and saves before/after values for restoration.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { normalizeCategories, isHotelSauna, isPublicSauna } from '../src/lib/saunaQuality.js';
config({path:'.env.local',quiet:true});
const dir='reports/quality-2026-10-02';
const apply=process.argv.includes('--apply');
const client=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY);
const audit=JSON.parse(await readFile(`${dir}/results.json`,'utf8'));
const followup=JSON.parse(await readFile(`${dir}/recheck-results.json`,'utf8'));
const decisions=JSON.parse(await readFile('scripts/quality-decisions-2026-10-02.json','utf8'));
const rows=[];
for(let from=0;;from+=1000){const {data,error}=await client.from('saunas').select('*').order('id').range(from,from+999);if(error)throw error;rows.push(...data);if(data.length<1000)break;}
const changes=[];
for(const row of rows){
  const first=audit.find(r=>r.id===row.id);
  if(!first)continue;
  const second=followup.find(r=>r.id===row.id);
  const reviewed=decisions.find(r=>r.id===row.id);
  if(reviewed&&reviewed.expectedName!==row.name)throw new Error(`Name changed for ${row.id}; review decision first.`);
  const proposed={types:normalizeCategories(row.types)};
  const notes=[];
  if(isHotelSauna(row)){
    proposed.listing_status='review';
    notes.push('Non-guest sauna access not established; hold for source-backed access review.');
  } else if (!first.evidence.sauna) {
    proposed.listing_status='review';
    notes.push('No confirmed sauna evidence after static and browser review. Missing evidence is not proof of absence.');
  }
  if(first.flags.length)notes.push(`Audit flags: ${first.flags.join(', ')}.`);
  if(second)notes.push(`Second pass: ${second.status}.`);
  if(first.evidence.sauna)notes.push(`Candidate sauna text: ${first.evidence.sauna.url}. Automated text detection is not verification.`);
  if(reviewed){Object.assign(proposed,reviewed.changes);notes.push(reviewed.reason);}
  // Non-detection never removes existing amenities or invents new ones.
  proposed.review_notes=`2026-10-02 quality audit. ${notes.join(' ')}`;
  const after=Object.fromEntries(Object.entries(proposed).filter(([key,value])=>JSON.stringify(value)!==JSON.stringify(row[key])));
  if(!Object.keys(after).length)continue;
  changes.push({id:row.id,name:row.name,updated_at:row.updated_at,before:Object.fromEntries(Object.keys(after).map(key=>[key,row[key]])),after});
}
await mkdir(dir,{recursive:true});
const output=`${dir}/cleanup-${apply?'applied':'proposed'}-${Date.now()}.json`;
const log={startedAt:new Date().toISOString(),apply,changes,completed:[],conflicts:[]};
await writeFile(output,JSON.stringify(log,null,2));
if(apply){
  for(const change of changes){
    let query=client.from('saunas').update(change.after).eq('id',change.id).eq('name',change.name);
    if(change.updated_at)query=query.eq('updated_at',change.updated_at);
    const {data,error}=await query.select('id');
    if(error)throw new Error(`Update ${change.id} failed: ${error.message}. Journal: ${output}`);
    if(!data.length)log.conflicts.push(change.id);else log.completed.push(change.id);
    await writeFile(output,JSON.stringify(log,null,2));
  }
}
const projected=rows.map(row=>({...row,...changes.find(change=>change.id===row.id)?.after}));
console.log(JSON.stringify({apply,changed:changes.length,completed:log.completed.length,conflicts:log.conflicts,
  publicUnderQualityRules:projected.filter(isPublicSauna).length,
  statuses:projected.reduce((counts,row)=>({...counts,[row.listing_status]:(counts[row.listing_status]||0)+1}),{}),journal:output},null,2));
if(log.conflicts.length)process.exitCode=1;

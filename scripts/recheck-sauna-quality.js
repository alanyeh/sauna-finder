// Retry inconclusive audit rows using up to five static pages, then ordinary
// browser rendering. Does not solve CAPTCHAs, log in, or write to the database.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import puppeteer from 'puppeteer';
import { crawlWebsite, extractWebsiteContent } from './lib/website-content.js';
const dir = process.argv[2] || 'reports/quality-2026-10-02';
const results = JSON.parse(await readFile(`${dir}/results.json`, 'utf8'));
const candidates = results.filter(row => !row.evidence.sauna);
await mkdir(`${dir}/recheck`, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
const outcomes = [];
let index = 0;
const hosts = new Map();
const saunaPattern = /\b(?:saunas?|banya|jjimjilbang)\b/i;
const blocked = /captcha|verify you are human|access denied|just a moment|checking your browser/i;
const negative = /\b(?:no|not|without|closed|paused|on\s+pause|suspended|removed|unavailable|coming soon|planned)\b/i;
function findEvidence(pages) {
  return pages.flatMap(page => page.text.split(/[.!?\n]+/).filter(sentence => saunaPattern.test(sentence) && !negative.test(sentence)).slice(0,3).map(text => ({ url: page.url, text: text.trim().slice(0,500) })));
}
async function recheck(row) {
  const path = `${dir}/recheck/listing-${row.id}.json`;
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { /* Not checked. */ }
  let pages = [], errors = [];
  try {
    const result = await crawlWebsite(row.website, { maxPages: 5 });
    pages = result.pages; errors = result.errors;
    if (!findEvidence(pages).length && !errors.some(e => /HTTP (403|429)/.test(e.error))) {
      const tab = await browser.newPage();
      try {
        await tab.setRequestInterception(true);
        tab.on('request', req => ['image','media','font'].includes(req.resourceType()) ? req.abort() : req.continue());
        const response = await tab.goto(row.website, { waitUntil: 'domcontentloaded', timeout: 15000 });
        if (response && [403,429].includes(response.status())) throw new Error(`Browser HTTP ${response.status()}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const title = await tab.title();
        if (blocked.test(title)) throw new Error('Browser access challenge; not bypassed');
        const html = await tab.content();
        const page = extractWebsiteContent(html, tab.url());
        // innerText respects CSS visibility. Remove navigation before reading.
        const visibleText = await tab.evaluate(() => {
          document.querySelectorAll('nav,header,footer,script,style,noscript').forEach(e => e.remove());
          return document.body.innerText;
        });
        if (blocked.test(visibleText.slice(0,500))) throw new Error('Browser access challenge; not bypassed');
        if (page.usable && visibleText.length > 40) pages.push({ ...page, text: visibleText, rendered: true });
      } catch (error) { errors.push({ url: row.website, error: error.message }); }
      finally { await tab.close(); }
    }
  } catch (error) { errors.push({ url: row.website, error: error.message }); }
  const evidence = findEvidence(pages);
  const result = { id: row.id, name: row.name, city: row.city, checkedAt: new Date().toISOString(), website: row.website,
    status: evidence.length ? 'sauna_evidence_found_needs_location_review' : pages.length ? 'still_no_sauna_evidence' : 'website_unavailable',
    evidence, pages: pages.map(({url,heading,rendered,text}) => ({url,heading,rendered: !!rendered,text})), errors };
  await writeFile(path, JSON.stringify(result,null,2));
  return result;
}
try {
  await Promise.all(Array.from({length:4}, async () => {
    while(index<candidates.length) {
      const row = candidates[index++];
      let host; try { host = new URL(row.website).origin; } catch { host = row.website; }
      const job = (hosts.get(host) || Promise.resolve()).catch(()=>{}).then(()=>recheck(row));
      hosts.set(host,job);
      const result = await job;
      outcomes.push(result);
      console.log(`[${outcomes.length}/${candidates.length}] ${row.name}: ${result.status}`);
    }
  }));
} finally { await browser.close(); }
await writeFile(`${dir}/recheck-results.json`, JSON.stringify(outcomes.map(({pages,...row})=>({...row,pages:pages.map(page=>({url:page.url,heading:page.heading,rendered:page.rendered}))})),null,2));
console.log(JSON.stringify(outcomes.reduce((counts,row)=>({...counts,[row.status]:(counts[row.status]||0)+1}),{})));

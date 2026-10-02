import test from 'node:test';
import assert from 'node:assert/strict';
import { isPublicSauna, publicationIssue, normalizeCategories, distanceKm, isHotelSauna } from '../../src/lib/saunaQuality.js';
import { discoveryLocationIssue, hasSpecificSaunaName, classifySaunaTypes } from '../lib/discovery-quality.js';
import { inferAmenityEvidence } from '../lib/amenities.js';
const venue = { name:'Example',city_slug:'nyc',lat:40.7,lng:-74,types:['Modern Bathhouse'],listing_status:'active' };
const checked = { sauna_source_url:'https://venue.test/sauna',sauna_checked_at:'2026-10-02',access_source_url:'https://venue.test/access',access_checked_at:'2026-10-02',access_policy:'day_pass' };

test('hotels remain hidden without source-backed public sauna access',()=>{
  const hotel={...venue,types:['Hotel Spa']};
  assert.equal(isPublicSauna(hotel),false);
  assert.equal(isPublicSauna({...hotel,access_policy:'day_pass'}),false);
  assert.equal(isPublicSauna({...hotel,...checked}),true);
  assert.equal(isPublicSauna({...hotel,...checked,access_policy:'guests_only'}),false);
  assert.equal(isPublicSauna({...hotel,...checked,sauna_source_url:''}),false);
  assert.equal(isPublicSauna({...hotel,...checked,access_source_url:'javascript:alert(1)'}),false);
});
test('seasonal, pending and duplicate listings cannot leak into public discovery',()=>{
  for(const status of ['review','hidden','duplicate','seasonal_closed']) assert.equal(isPublicSauna({...venue,...checked,listing_status:status}),false);
  assert.equal(isPublicSauna({...venue,duplicate_of:3}),false);
});
test('hotel detection catches hotel names even with missing categories',()=>{
  assert.equal(isHotelSauna({...venue,name:'Example Hotel'}),true);
  assert.equal(isHotelSauna({...venue,types:['Resort']}),true);
  assert.equal(isHotelSauna(venue),false);
});
test('publication requires source evidence, supported types and correct geography',()=>{
  assert.match(publicationIssue(venue),/evidence/);
  assert.equal(publicationIssue({...venue,...checked}),null);
  assert.match(publicationIssue({...venue,...checked,types:['Unknown']}),/categories/);
  assert.equal(isPublicSauna({...venue,city_slug:'houston'}),false);
  assert.equal(isPublicSauna({...venue,lat:null}),false);
});
test('normalization deduplicates synonyms without equating Finnish sauna and banya',()=>{
  assert.deepEqual(normalizeCategories(['Infrared Studio','Infrared Sauna','Russian Bathhouse','Finnish Sauna']),['Infrared Sauna','Russian Banya','Finnish Sauna']);
});
test('discovery enforces distance despite Places search bias',()=>{
  const config={center:{lat:29.76,lng:-95.37},radius:50000};
  assert.match(discoveryLocationIssue({location:{latitude:34.51,longitude:-93.05}},config),/Outside/);
  assert.equal(discoveryLocationIssue({location:{latitude:29.76,longitude:-95.37}},config),null);
  assert.match(discoveryLocationIssue({},config),/Missing/);
  assert.equal(distanceKm({lat:200,lng:0},{lat:0,lng:0}),Infinity);
});
test('sound baths, floating boats and red-light therapy are not sauna name shortcuts',()=>{
  for(const name of ['Sound Baths & Somatics','Float Therapy','Infrared Light Therapy','Cold Plunge Club']) assert.equal(hasSpecificSaunaName(name),false);
  assert.equal(hasSpecificSaunaName('Wild Haus Floating Saunas'),true);
});
test('floating sauna and float therapy receive different categories',()=>{
  const types=classifySaunaTypes({displayName:{text:'Wild Haus Floating Saunas'},editorialSummary:{text:'Book our wood-fired sauna boats.'}});
  assert.ok(types.includes('Traditional Sauna'));
  assert.ok(!types.includes('Float Spa'));
  assert.ok(classifySaunaTypes({displayName:{text:'Float Spa'},editorialSummary:{text:'Float tank therapy and infrared sauna.'}}).includes('Float Spa'));
});
test('paused sauna facilities are not positive amenity evidence',()=>{
  assert.deepEqual(inferAmenityEvidence(['Our dry sauna is on pause.']),{});
  assert.deepEqual(inferAmenityEvidence(['Infrared sauna service is suspended.']),{});
});

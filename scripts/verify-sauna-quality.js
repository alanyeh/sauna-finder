import assert from 'node:assert/strict';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {isPublicSauna,isHotelSauna} from '../src/lib/saunaQuality.js';
config({path:'.env.local',quiet:true});
const publicClient=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_ANON_KEY);
const adminClient=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY);
async function read(client){const rows=[];for(let from=0;;from+=1000){const {data,error}=await client.from('saunas').select('*').order('id').range(from,from+999);assert.ifError(error);rows.push(...data);if(data.length<1000)return rows;}}
const publicRows=await read(publicClient);const allRows=await read(adminClient);
assert.ok(publicRows.length>100,'Unexpected public dataset loss');
assert.ok(allRows.length>=396,'Records must be preserved');
assert.ok(publicRows.every(isPublicSauna),'A hidden or unqualified listing leaked publicly');
for(const id of [763,764,765,902,913,858,850,606,13,80,595,590]) assert.ok(!publicRows.some(row=>row.id===id),`Hidden listing ${id} leaked`);
for(const id of [84,647,680,808,547,568]) assert.ok(publicRows.some(row=>row.id===id),`Reviewed listing ${id} missing`);
assert.equal(publicRows.find(row=>row.id===808).city_slug,'portland');
console.log(JSON.stringify({totalPreserved:allRows.length,publicRows:publicRows.length,publicHotels:publicRows.filter(isHotelSauna).map(row=>row.name),checks:'passed'},null,2));

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data } = await supabase.from('saunas').select('id, name, types').ilike('name', '%Chill Space%');
  console.log('Found:', JSON.stringify(data, null, 2));

  for (const s of data) {
    const newTypes = (s.types || []).filter(t => t !== 'Wellness Spa');
    if (!newTypes.includes('Infrared Sauna')) newTypes.unshift('Infrared Sauna');

    const { error } = await supabase.from('saunas').update({ types: newTypes }).eq('id', s.id);
    console.log(error ? 'ERROR: ' + error.message : `Updated id ${s.id} types to: [${newTypes.join(', ')}]`);
  }
}
run();

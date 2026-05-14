// One-time script: add "Infrared Sauna" to types for Bathhouse Flatiron & Williamsburg
const SUPABASE_URL = 'https://oqwwxfecnrspcjjwrylx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_KEY env var');
  process.exit(1);
}

const IDS = [1, 3, 21, 23]; // Bathhouse Flatiron (1,21) + Williamsburg (3,23)

async function main() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/saunas?id=in.(${IDS.join(',')})&select=id,name,types`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const saunas = await res.json();

  for (const sauna of saunas) {
    const types = sauna.types || [];
    if (types.includes('Infrared Sauna')) {
      console.log(`  - id ${sauna.id} "${sauna.name}" — already has Infrared Sauna`);
      continue;
    }

    const newTypes = [...types, 'Infrared Sauna'];
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/saunas?id=eq.${sauna.id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ types: newTypes }),
    });

    if (!patchRes.ok) {
      console.error(`  ✗ id ${sauna.id} "${sauna.name}" — ${patchRes.status} ${await patchRes.text()}`);
    } else {
      console.log(`  ✓ id ${sauna.id} "${sauna.name}" — types now: [${newTypes.join(', ')}]`);
    }
  }
}

main().catch(console.error);

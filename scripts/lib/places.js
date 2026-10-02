import fetch from 'node-fetch';

export class PlacesQuotaError extends Error {}

// Retry transient server failures only. A 429 may mean the daily quota is
// exhausted; callers should stop the run instead of spending more requests.
export async function fetchPlacesJSON(url, options, {
  fetchImpl = fetch,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
} = {}) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetchImpl(url, {
      ...options,
      signal: AbortSignal.timeout(15000),
      size: 5 * 1024 * 1024,
    });
    if (response.ok) return response.json();
    const body = await response.text();
    if (response.status === 429 || /RESOURCE_EXHAUSTED/.test(body)) {
      throw new PlacesQuotaError('Google Places quota exhausted; stopping this run.');
    }
    if ([500, 502, 503, 504].includes(response.status) && attempt < 2) {
      await sleep(500 * 2 ** attempt);
      continue;
    }
    throw new Error(`Places API error (${response.status}): ${body.slice(0, 200)}`);
  }
}

export async function collectSearchPages(fetchPage, sleep = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  const places = new Map();
  const tokens = new Set();
  let token = null;
  do {
    const data = await fetchPage(token);
    for (const place of data.places || []) {
      if (place.id) places.set(place.id, place);
    }
    token = data.nextPageToken || null;
    if (token && tokens.has(token)) throw new Error('Places API repeated a page token');
    if (token) {
      tokens.add(token);
      await sleep(300);
    }
  } while (token);
  return [...places.values()];
}

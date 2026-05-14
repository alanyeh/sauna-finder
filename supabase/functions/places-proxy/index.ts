// places-proxy
//
// Server-side proxy for the Google Places API (New) calls used by the admin
// "Add Sauna" flow (src/components/AdminAddSaunaModal.jsx). It exists so the
// Places API key is never shipped to the browser bundle — the key lives only as
// the GOOGLE_PLACES_API_KEY function secret.
//
// Auth: config.toml sets verify_jwt = true, so the platform rejects any caller
// without a valid user JWT before this code runs. We additionally confirm the
// caller is an admin.
//
// Actions (JSON body, dispatched on `action`):
//   { action: "searchText", textQuery }  -> { places: [...] }
//   { action: "details",    placeId }    -> full Google place object
//   { action: "photos",     placeId }    -> { photos: [publicUrl, ...] }

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

const PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')

// Keep in sync with the allowlist in src/lib/admin.js
const ADMIN_EMAILS = ['alnyeh@gmail.com']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
}

// Field masks mirror what AdminAddSaunaModal.jsx previously requested directly.
const SEARCH_FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri'
const DETAILS_FIELD_MASK =
  'displayName,formattedAddress,location,rating,userRatingCount,websiteUri,regularOpeningHours,priceLevel,editorialSummary,reviews,photos,types'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!PLACES_API_KEY) {
    return json({ error: 'GOOGLE_PLACES_API_KEY is not configured' }, 500)
  }

  // --- Authn / Authz: must be a logged-in admin -----------------------------
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  // Caller-context client: uses the anon key + the caller's JWT, so auth.getUser()
  // resolves the caller and Storage writes run under the caller's own session
  // (same permissions the browser client had before this proxy existed).
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return json({ error: 'Invalid session' }, 401)
  if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    return json({ error: 'Forbidden' }, 403)
  }

  // --- Dispatch -------------------------------------------------------------
  let payload: { action?: string; textQuery?: string; placeId?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  try {
    switch (payload.action) {
      case 'searchText':
        return await handleSearchText(payload.textQuery)
      case 'details':
        return await handleDetails(payload.placeId)
      case 'photos':
        return await handlePhotos(payload.placeId, supabase)
      default:
        return json({ error: `Unknown action: ${payload.action}` }, 400)
    }
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Proxy error' }, 502)
  }
})

async function handleSearchText(textQuery?: string): Promise<Response> {
  if (!textQuery?.trim()) return json({ error: 'textQuery is required' }, 400)

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_API_KEY!,
      'X-Goog-FieldMask': SEARCH_FIELD_MASK,
    },
    body: JSON.stringify({ textQuery, maxResultCount: 5 }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return json({ error: data?.error?.message || `Places API error ${res.status}` }, 502)
  }
  return json({ places: data.places ?? [] })
}

async function handleDetails(placeId?: string): Promise<Response> {
  if (!placeId) return json({ error: 'placeId is required' }, 400)

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': PLACES_API_KEY!,
      'X-Goog-FieldMask': DETAILS_FIELD_MASK,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return json({ error: data?.error?.message || `Places API error ${res.status}` }, 502)
  }
  return json(data)
}

async function handlePhotos(
  placeId: string | undefined,
  supabase: SupabaseClient,
): Promise<Response> {
  if (!placeId) return json({ error: 'placeId is required' }, 400)

  // 1. Fetch photo references for the place.
  const detailsRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': PLACES_API_KEY!,
      'X-Goog-FieldMask': 'photos',
    },
  })
  const detailsData = await detailsRes.json().catch(() => ({}))
  if (!detailsRes.ok) {
    return json(
      { error: detailsData?.error?.message || `Places API error ${detailsRes.status}` },
      502,
    )
  }

  const photoRefs = (detailsData.photos ?? []).slice(0, 5)
  if (photoRefs.length === 0) return json({ photos: [] })

  // 2. Download each photo and re-host it in the sauna-photos Storage bucket.
  const uploadedUrls: string[] = []
  for (let i = 0; i < photoRefs.length; i++) {
    try {
      const mediaUrl =
        `https://places.googleapis.com/v1/${photoRefs[i].name}/media` +
        `?maxHeightPx=600&key=${PLACES_API_KEY}`
      const photoRes = await fetch(mediaUrl)
      if (!photoRes.ok) continue

      const blob = await photoRes.blob()
      const fileName = `${Date.now()}-${i}-${crypto.randomUUID()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('sauna-photos')
        .upload(`public/${fileName}`, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        })
      if (uploadError) continue

      const { data: { publicUrl } } = supabase.storage
        .from('sauna-photos')
        .getPublicUrl(`public/${fileName}`)
      uploadedUrls.push(publicUrl)
    } catch {
      // Skip this photo, continue with the rest.
    }
  }

  return json({ photos: uploadedUrls })
}

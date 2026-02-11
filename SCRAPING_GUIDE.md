# Sauna Finder - Scraping & Data Entry Guide

## Overview

This project is a React app for discovering saunas/bathhouses. Data lives in two places:

1. **Supabase (primary)** - The app fetches from here at runtime
2. **`src/data/saunas.js` (local fallback)** - Used for reference/development

When adding new locations, **always add to Supabase**. Optionally update the local file too.

---

## Supabase Connection

- **URL:** `https://oqwwxfecnrspcjjwrylx.supabase.co`
- **Table:** `saunas`
- **Keys are in:** `.env.local` (`VITE_SUPABASE_ANON_KEY` for reads, `SUPABASE_SERVICE_KEY` for writes)
- **REST endpoint:** `POST {SUPABASE_URL}/rest/v1/saunas`

### Insert Example (Python)

```python
import urllib.request, json

url = "https://oqwwxfecnrspcjjwrylx.supabase.co/rest/v1/saunas"
service_key = "<SUPABASE_SERVICE_KEY from .env.local>"

data = json.dumps([{
    "name": "Example Gym",
    "address": "123 Main St, New York, NY 10001",
    "neighborhood": "Midtown",
    "lat": 40.7500,
    "lng": -73.9900,
    "rating": 4.5,
    "rating_count": 200,
    "price": "$$",
    "types": ["Gym Sauna"],
    "amenities": ["steam_room", "coed"],
    "hours": "Mon-Fri: 6AM-10PM",
    "place_id": "ChIJ...",
    "description": "Short description of the sauna.",
    "city_slug": "nyc"
}]).encode("utf-8")

req = urllib.request.Request(url, data=data, method="POST")
req.add_header("apikey", service_key)
req.add_header("Authorization", f"Bearer {service_key}")
req.add_header("Content-Type", "application/json")
req.add_header("Prefer", "return=representation")

with urllib.request.urlopen(req) as resp:
    result = json.loads(resp.read())
    for row in result:
        print(f"ID {row['id']}: {row['name']}")
```

### Check Existing Entries

Before inserting, always check for duplicates:

```python
req = urllib.request.Request(
    f"{url}?select=id,name&order=id.asc",
    method="GET"
)
req.add_header("apikey", service_key)
req.add_header("Authorization", f"Bearer {service_key}")
```

---

## Database Schema (snake_case)

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | integer | auto-generated | Don't set manually |
| `name` | text | yes | Full business name |
| `address` | text | yes | Full street address with zip |
| `neighborhood` | text | yes | Used in filter dropdown |
| `lat` | decimal | yes | Latitude |
| `lng` | decimal | yes | Longitude |
| `rating` | decimal | yes | Google rating (0-5) |
| `rating_count` | integer | yes | Number of Google reviews |
| `price` | text | yes | `"$"`, `"$$"`, or `"$$$"` |
| `types` | json array | yes | e.g. `["Gym Sauna"]` |
| `amenities` | json array | yes | See valid values below |
| `hours` | text | yes | Operating hours |
| `place_id` | text | yes | Google Place ID (can be empty `""`) |
| `description` | text | yes | One sentence description |
| `city_slug` | text | yes | `"nyc"`, `"sf"`, etc. |
| `photos` | json array | nullable | Array of photo URLs |
| `website_url` | text | nullable | Website URL |
| `gender_policy` | text | nullable | Gender restrictions |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto | |

**Note:** The local JS file uses camelCase (`ratingCount`, `placeId`), but the database uses snake_case (`rating_count`, `place_id`). The App.jsx transform handles this.

---

## Valid Field Values

### Price Tiers
- `"$"` - Budget (under ~$30)
- `"$$"` - Moderate ($30-60)
- `"$$$"` - Premium ($60+)

### Amenities
- `"cold_plunge"` - Cold plunge pool
- `"steam_room"` - Steam room
- `"massage"` - Massage services
- `"pool"` - Swimming pool
- `"coed"` - Co-ed (mixed gender)
- `"private"` - Private rooms/sessions

### Types (used for display, not filtering)
**Standalone saunas/bathhouses:**
- `"Modern Bathhouse"`, `"Traditional Banya"`, `"Russian Bathhouse"`
- `"Korean Spa"`, `"Luxury Spa"`, `"Day Spa"`, `"Italian Spa"`
- `"Boutique Sauna"`, `"Infrared Sauna"`, `"World Spa"`

**Gyms & Hotels:**
- `"Gym Sauna"` - Sauna inside a gym/fitness club
- `"Hotel Spa"` - Sauna inside a hotel

### City Slugs
- `"nyc"` - New York City
- `"sf"` - San Francisco

---

## How to Find Data for New Locations

### 1. Google Place ID

The `place_id` field links to Google Maps. To find it:

- **Waze trick:** Search `waze.com directions "[Business Name]" [address] place.ChIJ` - the Place ID appears in Waze URLs as `place.ChIJxxxxx`
- **Google Maps URL trick:** Search `google.com/maps/search "[Business Name]" query_place_id ChIJ` - appears in the URL
- **Official tool:** https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
- If you can't find it, use an empty string `""` - the app handles this gracefully

### 2. Coordinates (lat/lng)

- Google Maps URLs often contain coordinates: `@40.7546,-74.0021,17z`
- Apple Maps URLs also contain them
- For approximate coords, use nearby existing entries as reference points

### 3. Ratings & Review Counts

- Use Google Maps ratings when available
- Yelp ratings are a reasonable fallback
- Review counts from Google Maps are preferred

### 4. Research Strategy

When searching for saunas in gyms/hotels:
1. Search Yelp: `"gym with sauna" [city]`
2. Search Google: `gyms with saunas in [city] [year]`
3. Search for hotels: `hotels with sauna spa [city]`
4. Check individual gym chains: Equinox, Life Time, Chelsea Piers, TMPL, etc.
5. Check climbing gyms: many have saunas (Vital, Brooklyn Boulders, etc.)

---

## Scraping Photos

Photos are stored in Supabase Storage (`sauna-photos` bucket) and referenced as an array of URLs in the `photos` column. Each sauna should have up to 5 photos. Google Places API returns photos in relevance order, so the first photos tend to show the business interior/exterior.

### Prerequisites

- `GOOGLE_PLACES_API_KEY` from `.env.local`
- `SUPABASE_SERVICE_KEY` from `.env.local`

### How It Works

1. **Get photo references** from the Google Places API using the sauna's `place_id`
2. **Download** each photo via the Places Photo endpoint
3. **Upload** to Supabase Storage (`sauna-photos/public/`)
4. **Update** the `photos` array in the saunas table

### Step 1: Find saunas missing photos

```python
import urllib.request, json

url = "https://oqwwxfecnrspcjjwrylx.supabase.co/rest/v1/saunas?select=id,name,place_id,photos&order=id.asc"
anon_key = "<VITE_SUPABASE_ANON_KEY from .env.local>"

req = urllib.request.Request(url)
req.add_header("apikey", anon_key)
req.add_header("Authorization", f"Bearer {anon_key}")

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())

missing = [s for s in data if not s.get("photos") or len(s["photos"]) == 0]
print(f"{len(missing)} saunas missing photos")
```

### Step 2: Get photo references from Google Places API

```python
api_key = "<GOOGLE_PLACES_API_KEY from .env.local>"

def get_place_photos(place_id):
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=photos&key={api_key}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    if data.get("status") != "OK":
        return []
    return data.get("result", {}).get("photos", [])[:5]
```

If the `place_id` is missing or invalid, fall back to **text search**:

```python
import urllib.parse

def find_place_id(name, address):
    query = urllib.parse.quote(f"{name} {address}")
    url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={query}&key={api_key}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    if data.get("status") == "OK" and data.get("results"):
        return data["results"][0].get("place_id")
    return None
```

### Step 3: Download and upload photos

```python
import time

service_key = "<SUPABASE_SERVICE_KEY from .env.local>"
supabase_url = "https://oqwwxfecnrspcjjwrylx.supabase.co"
bucket = "sauna-photos"

def download_photo(photo_reference, max_width=800):
    url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth={max_width}&photoreference={photo_reference}&key={api_key}"
    with urllib.request.urlopen(url) as resp:
        return resp.read()

def upload_photo(image_data, filename):
    url = f"{supabase_url}/storage/v1/object/{bucket}/public/{filename}"
    req = urllib.request.Request(url, data=image_data, method="POST")
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    req.add_header("Content-Type", "image/jpeg")
    urllib.request.urlopen(req)

# For each sauna:
sauna_id = 42
photos = get_place_photos("ChIJ...")
photo_urls = []
timestamp = int(time.time() * 1000)

for i, photo in enumerate(photos):
    img = download_photo(photo["photo_reference"])
    filename = f"{sauna_id}-{i}-{timestamp}.jpg"
    upload_photo(img, filename)
    photo_urls.append(f"{supabase_url}/storage/v1/object/public/{bucket}/public/{filename}")
```

### Step 4: Update the database

```python
url = f"{supabase_url}/rest/v1/saunas?id=eq.{sauna_id}"
data = json.dumps({"photos": photo_urls}).encode("utf-8")

req = urllib.request.Request(url, data=data, method="PATCH")
req.add_header("apikey", service_key)
req.add_header("Authorization", f"Bearer {service_key}")
req.add_header("Content-Type", "application/json")
req.add_header("Prefer", "return=minimal")
urllib.request.urlopen(req)
```

### Naming Convention

Photo files in storage follow the pattern: `{supabase_id}-{index}-{timestamp}.jpg`
- `supabase_id` - The sauna's ID in the database
- `index` - Photo number (0-4)
- `timestamp` - Millisecond timestamp to avoid collisions

### Notes

- Rate limit requests (~0.2-0.3s between calls) to avoid hitting Google API limits
- Some older `place_id` values in the DB may be invalid. If Place Details returns no photos, use text search to find the correct `place_id` and update it
- The `scripts/scrape-photos.js` file has a Node.js implementation of a similar flow

---

## Local File Format (`src/data/saunas.js`)

If also updating the local file, entries use **camelCase**:

```javascript
{
  id: 21,                    // sequential, but doesn't need to match Supabase
  name: "VITAL Climbing Gym Brooklyn",
  address: "221 N 14th St, Brooklyn, NY 11249",
  neighborhood: "Williamsburg",
  lat: 40.7233,
  lng: -73.9568,
  rating: 4.4,
  ratingCount: 800,          // camelCase (DB uses rating_count)
  price: "$$",
  types: ["Gym Sauna"],
  amenities: ["coed"],
  hours: "Mon-Thu: 8AM-11PM, Fri: 8AM-10PM, Sat-Sun: 9AM-10PM",
  placeId: "ChIJqR_jAeRZwokRpmZBdYTeb9A",  // camelCase (DB uses place_id)
  description: "45,000 sq ft climbing gym with rooftop sauna and cafe."
}
```

---

## Current NYC Locations (as of Feb 2026)

### Standalone (IDs 1-20 in local, 1-52 in Supabase)
Bathhouse Flatiron, AIRE Ancient Baths, Bathhouse Williamsburg, Spa Castle, Othership, The SPA Club, Brooklyn Bathhouse, Russian & Turkish Baths, QC NY SPA, JUVENEX SPA, Great Jones Spa, SoJo Spa Club, cityWell Brooklyn, Area Infrared Sauna, Perspire Sauna Studio, Brooklyn Banya, WORLD SPA, Wall Street Bath & Spa, Tribeca Spa of Tranquility, beem Light Sauna, Lore Bathing Club, Saint NYC, Chill Space NYC, Akari Sauna (Williamsburg & Greenpoint), Mermaid Spa, Russian Bath of NY, New York Spa & Sauna, QF SPA, BRC Day Spa, Bear and Birch

### Gyms (Supabase IDs 68-74)
VITAL Climbing Gym Brooklyn, Life Time Atlantic Avenue, Chelsea Piers Fitness Brooklyn, Brooklyn Boulders Queensbridge, TMPL Avenue A, Manhattan Plaza Health Club, Mercedes Club

### Hotels (Supabase IDs 75-78)
Equinox Hotel New York, Aman New York, The Dominick Hotel, The Peninsula New York

### SF Locations (Supabase IDs 53-67)
Archimedes Banya, Kabuki Springs & Spa, Alchemy Springs, Onsen SF, and others

#!/usr/bin/env python3
"""Find and update missing Google Place IDs for Minneapolis saunas (IDs 664-674)"""

import os
import urllib.request
import urllib.parse
import json

GOOGLE_PLACES_API_KEY = os.environ["GOOGLE_PLACES_API_KEY"]
SUPABASE_URL = "https://oqwwxfecnrspcjjwrylx.supabase.co"
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# Minneapolis saunas inserted with IDs 664-674
venues_to_update = [
    {"id": 664, "name": "Watershed Spa", "address": "514 2nd St SE, Minneapolis, MN 55414"},
    {"id": 665, "name": "PORTAL Thermaculture", "address": "3120 Excelsior Blvd, Minneapolis, MN 55416"},
    {"id": 666, "name": "Embrace North", "address": "811 SE 9th St, Minneapolis, MN 55414"},
    {"id": 667, "name": "Cedar & Stone at Four Seasons", "address": "245 Hennepin Ave, Minneapolis, MN 55401"},
    {"id": 668, "name": "Sauna Strong", "address": "4420 Drew Ave S, Minneapolis, MN 55410"},
    {"id": 669, "name": "The Yard at Superior Sauna & Steam", "address": "4355 Nicollet Ave, Minneapolis, MN 55409"},
    {"id": 670, "name": "612 Sauna Cooperative", "address": "1221 Theodore Wirth Pkwy, Minneapolis, MN 55422"},
    {"id": 671, "name": "Relaxing Healthy Center", "address": "7827 Portland Ave S, Bloomington, MN 55420"},
    {"id": 672, "name": "Aurora Spa", "address": "1609 W Lake St, Minneapolis, MN 55408"},
    {"id": 673, "name": "Hewing Hotel", "address": "300 N Washington Ave, Minneapolis, MN 55401"},
    {"id": 674, "name": "Vita Day Spa", "address": "5999 Rice Creek Pkwy, Shoreview, MN 55126"},
]


def find_place_id(name, address):
    """Search for a place using Google Places Text Search API"""
    query = f"{name} {address}"
    url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={urllib.parse.quote(query)}&key={GOOGLE_PLACES_API_KEY}"

    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            if data.get("status") == "OK" and data.get("results"):
                return data["results"][0].get("place_id")
    except Exception as e:
        print(f"Error searching for {name}: {e}")

    return None


def update_place_id(sauna_id, place_id):
    """Update a single sauna's place_id in Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/saunas?id=eq.{sauna_id}"

    data = json.dumps({"place_id": place_id}).encode("utf-8")

    req = urllib.request.Request(url, data=data, method="PATCH")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")

    try:
        with urllib.request.urlopen(req) as resp:
            return True
    except Exception as e:
        print(f"Error updating ID {sauna_id}: {e}")
        return False


def main():
    print("🔍 Finding Place IDs for Minneapolis saunas...\n")

    updated = 0
    for venue in venues_to_update:
        print(f"Searching for {venue['name']}...", end=" ", flush=True)
        place_id = find_place_id(venue["name"], venue["address"])

        if place_id:
            print(f"Found: {place_id}")
            if update_place_id(venue["id"], place_id):
                print(f"  ✅ Updated in Supabase")
                updated += 1
            else:
                print(f"  ❌ Failed to update in Supabase")
        else:
            print("Not found")

    print(f"\n✅ Updated {updated}/{len(venues_to_update)} Place IDs")


if __name__ == "__main__":
    main()

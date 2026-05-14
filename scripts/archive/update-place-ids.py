#!/usr/bin/env python3
"""Find and update missing Google Place IDs for Chicago saunas"""

import os
import urllib.request
import json

GOOGLE_PLACES_API_KEY = os.environ["GOOGLE_PLACES_API_KEY"]
SUPABASE_URL = "https://oqwwxfecnrspcjjwrylx.supabase.co"
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# Venues that need Place IDs
venues_to_update = [
    {"id": 635, "name": "Sky Spa Sauna", "address": "1501 Busch Parkway, Buffalo Grove, IL 60089"},
    {"id": 636, "name": "Life Time River North", "address": "15 W Chicago Avenue, Chicago, IL 60654"},
    {"id": 637, "name": "Eastend", "address": "1132 W Fulton Market, Chicago, IL 60607"},
    {"id": 638, "name": "Perspire Sauna Studio", "address": "3320 N Broadway, Chicago, IL 60657"},
    {"id": 639, "name": "SweatHouz Old Town", "address": "1439 N Wells Street, Chicago, IL 60610"},
    {"id": 641, "name": "Midtown Athletic Club", "address": "2444 N Elston Avenue, Chicago, IL 60647"},
    {"id": 644, "name": "Lost Language Sauna", "address": "4510 N Ravenswood Avenue, Chicago, IL 60640"},
    {"id": 647, "name": "Chuan Spa at The Langham", "address": "330 N Wabash Avenue, Chicago, IL 60611"},
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
    print("🔍 Finding missing Place IDs...\n")

    updated = 0
    for venue in venues_to_update:
        print(f"Searching for {venue['name']}...", end=" ")
        place_id = find_place_id(venue['name'], venue['address'])

        if place_id:
            print(f"Found: {place_id}")
            if update_place_id(venue['id'], place_id):
                print(f"  ✅ Updated in Supabase")
                updated += 1
            else:
                print(f"  ❌ Failed to update in Supabase")
        else:
            print("Not found")

    print(f"\n✅ Updated {updated}/{len(venues_to_update)} Place IDs")

if __name__ == "__main__":
    main()

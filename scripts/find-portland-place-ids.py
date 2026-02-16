#!/usr/bin/env python3
"""Find and update missing Google Place IDs for Portland saunas (IDs 676-686)"""

import os
import urllib.request
import urllib.parse
import json

GOOGLE_PLACES_API_KEY = os.environ["GOOGLE_PLACES_API_KEY"]
SUPABASE_URL = "https://oqwwxfecnrspcjjwrylx.supabase.co"
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# Portland saunas inserted with IDs 676-686
venues_to_update = [
    {"id": 676, "name": "Löyly Sauna", "address": "2713 SE 21st Ave, Portland, OR 97202"},
    {"id": 677, "name": "Knot Springs Social Club", "address": "33 NE 3rd Ave, Portland, OR 97232"},
    {"id": 678, "name": "The Everett House", "address": "2927 NE Everett St, Portland, OR 97232"},
    {"id": 679, "name": "Common Ground Wellness Cooperative", "address": "5010 NE 33rd Ave, Portland, OR 97211"},
    {"id": 680, "name": "CASCADA Thermal Springs", "address": "1150 NE Alberta St, Portland, OR 97211"},
    {"id": 681, "name": "Haven Forest Sauna", "address": "9644 SW West Haven Dr, Portland, OR 97225"},
    {"id": 682, "name": "Bear Banya", "address": "2130 SE 96th Ave, Portland, OR 97216"},
    {"id": 683, "name": "SaunaGlo", "address": "1915 SE Jefferson St, Milwaukie, OR 97222"},
    {"id": 684, "name": "Koti Sauna", "address": "4128 SE Jefferson St, Milwaukie, OR 97222"},
    {"id": 685, "name": "Pure Sweat Sauna Studio", "address": "4019 N Williams Ave, Portland, OR 97227"},
    {"id": 686, "name": "Lloyd Athletic Club", "address": "815 NE Halsey St, Portland, OR 97232"},
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
    print("🔍 Finding Place IDs for Portland saunas...\n")

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

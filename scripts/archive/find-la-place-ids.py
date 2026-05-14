#!/usr/bin/env python3
"""Find and update missing Google Place IDs for LA saunas (IDs 648-662)"""

import os
import urllib.request
import urllib.parse
import json

GOOGLE_PLACES_API_KEY = os.environ["GOOGLE_PLACES_API_KEY"]
SUPABASE_URL = "https://oqwwxfecnrspcjjwrylx.supabase.co"
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# LA saunas inserted with IDs 648-662
venues_to_update = [
    {"id": 648, "name": "Wi Spa", "address": "2700 Wilshire Blvd, Los Angeles, CA 90057"},
    {"id": 649, "name": "Spa Palace", "address": "620 S Union Ave, Los Angeles, CA 90017"},
    {"id": 650, "name": "Olympic Spa", "address": "3915 W Olympic Blvd, Los Angeles, CA 90019"},
    {"id": 651, "name": "Beverly Hot Springs", "address": "308 N Oxford Ave, Los Angeles, CA 90004"},
    {"id": 652, "name": "Crystal Spa", "address": "3500 W 6th St, Los Angeles, CA 90020"},
    {"id": 653, "name": "Aroma Spa & Sports", "address": "3680 Wilshire Blvd, Los Angeles, CA 90010"},
    {"id": 654, "name": "Century Day Spa", "address": "4120 W Olympic Blvd, Los Angeles, CA 90019"},
    {"id": 655, "name": "Daengki Spa", "address": "4245 W 3rd St, Los Angeles, CA 90020"},
    {"id": 656, "name": "Queen Spa & Sauna", "address": "932 S Vermont Ave, Los Angeles, CA 90006"},
    {"id": 657, "name": "Voda Spa", "address": "7700 Santa Monica Blvd, West Hollywood, CA 90046"},
    {"id": 658, "name": "The Raven Spa", "address": "2910 Rowena Ave, Los Angeles, CA 90039"},
    {"id": 659, "name": "Teddy's Hot House", "address": "1915 Lincoln Blvd, Los Angeles, CA 90291"},
    {"id": 660, "name": "Riviera Health Spa", "address": "3601 Lomita Blvd, Torrance, CA 90505"},
    {"id": 661, "name": "Spa Montage Beverly Hills", "address": "225 N Canon Dr, Beverly Hills, CA 90210"},
    {"id": 662, "name": "Burke Williams Day Spa", "address": "925 N La Brea Ave, Hollywood, CA 90038"},
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
    print("🔍 Finding Place IDs for LA saunas...\n")

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

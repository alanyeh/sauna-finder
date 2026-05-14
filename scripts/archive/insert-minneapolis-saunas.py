#!/usr/bin/env python3
"""Insert Minneapolis saunas into Supabase"""

import os
import urllib.request
import json

# Supabase credentials
SUPABASE_URL = "https://oqwwxfecnrspcjjwrylx.supabase.co"
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# Minneapolis saunas data
saunas = [
  {
    "name": "Watershed Spa",
    "address": "514 2nd St SE, Minneapolis, MN 55414",
    "neighborhood": "St. Anthony Main",
    "lat": 44.9815,
    "lng": -93.2490,
    "rating": 4.7,
    "rating_count": 261,
    "price": "$$",
    "types": ["Modern Bathhouse", "Day Spa"],
    "amenities": ["dry_sauna", "steam_room", "cold_plunge", "massage", "coed"],
    "hours": "Check website for current hours",
    "place_id": "",
    "description": "A full-service ritual bathing spa in the historic Switch House on the Mississippi River, offering communal steam, sauna, cold plunge, and holistic wellness treatments.",
    "city_slug": "minneapolis",
    "website_url": "https://www.watershedspa.com"
  },
  {
    "name": "PORTAL Thermaculture",
    "address": "3120 Excelsior Blvd, Minneapolis, MN 55416",
    "neighborhood": "Bde Maka Ska",
    "lat": 44.9494,
    "lng": -93.3197,
    "rating": 4.5,
    "rating_count": None,
    "price": "$$",
    "types": ["Nordic Spa", "Modern Bathhouse"],
    "amenities": ["dry_sauna", "cold_plunge", "coed"],
    "hours": "Check website for current hours",
    "place_id": "",
    "description": "A modern Scandinavian sauna social club near Bde Maka Ska with electric and wood-fired saunas, a communal cold plunge, and a community-centered wellness philosophy.",
    "city_slug": "minneapolis",
    "website_url": "https://www.portalthermaculture.com"
  },
  {
    "name": "Embrace North",
    "address": "811 SE 9th St, Minneapolis, MN 55414",
    "neighborhood": "Marcy-Holmes",
    "lat": 44.9858,
    "lng": -93.2380,
    "rating": 4.8,
    "rating_count": 120,
    "price": "$",
    "types": ["Finnish Sauna", "Modern Bathhouse"],
    "amenities": ["dry_sauna", "cold_plunge", "coed"],
    "hours": "Check website for current hours",
    "place_id": "",
    "description": "A community-oriented sauna and cold water immersion facility in Northeast Minneapolis offering daily open sessions and affordable monthly memberships.",
    "city_slug": "minneapolis",
    "website_url": "https://embracenorth.com"
  },
  {
    "name": "Cedar & Stone at Four Seasons",
    "address": "245 Hennepin Ave, Minneapolis, MN 55401",
    "neighborhood": "Downtown Minneapolis",
    "lat": 44.9794,
    "lng": -93.2734,
    "rating": 4.8,
    "rating_count": None,
    "price": "$$$",
    "types": ["Nordic Spa", "Finnish Sauna"],
    "amenities": ["dry_sauna", "steam_room", "cold_plunge", "pool", "massage", "coed", "private"],
    "hours": "Check website for current hours",
    "place_id": "",
    "description": "A guided 75-minute Nordic sauna ceremony on the rooftop terrace of Four Seasons Hotel Minneapolis, featuring wood-fired and electric saunas with aromatherapy and full spa access.",
    "city_slug": "minneapolis",
    "website_url": "https://cedarandstonesauna.com/minneapolis"
  },
  {
    "name": "Sauna Strong",
    "address": "4420 Drew Ave S, Minneapolis, MN 55410",
    "neighborhood": "Linden Hills",
    "lat": 44.9199,
    "lng": -93.3212,
    "rating": 4.9,
    "rating_count": 500,
    "price": "$$",
    "types": ["Infrared Studio", "Finnish Sauna", "Gym Sauna"],
    "amenities": ["dry_sauna", "infrared_sauna", "cold_plunge", "coed", "private"],
    "hours": "Check website for current hours",
    "place_id": "",
    "description": "An all-in-one wellness hub in Linden Hills combining traditional Finnish sauna, multi-energy infrared saunas, cold plunge, red light therapy, and open gym.",
    "city_slug": "minneapolis",
    "website_url": "https://saunastrong.com"
  },
  {
    "name": "The Yard at Superior Sauna & Steam",
    "address": "4355 Nicollet Ave, Minneapolis, MN 55409",
    "neighborhood": "Kingfield",
    "lat": 44.9266,
    "lng": -93.2900,
    "rating": 4.5,
    "rating_count": None,
    "price": "$$",
    "types": ["Finnish Sauna", "Nordic Spa"],
    "amenities": ["dry_sauna", "steam_room", "cold_plunge", "coed"],
    "hours": "Check website for current hours",
    "place_id": "",
    "description": "A sauna event space and showroom in the Kingfield neighborhood hosting wood-fired public sessions, Aufguss ceremonies, and community sauna events.",
    "city_slug": "minneapolis",
    "website_url": "https://superiorsaunas.com/pages/events"
  },
  {
    "name": "612 Sauna Cooperative",
    "address": "1221 Theodore Wirth Pkwy, Minneapolis, MN 55422",
    "neighborhood": "Theodore Wirth Park",
    "lat": 44.9985,
    "lng": -93.3308,
    "rating": None,
    "rating_count": None,
    "price": "$",
    "types": ["Finnish Sauna", "Traditional Sauna"],
    "amenities": ["dry_sauna", "cold_plunge", "coed"],
    "hours": "Seasonal — check website",
    "place_id": "",
    "description": "A member-owned cooperative operating a mobile wood-fired sauna at parks and event venues across the Twin Cities each winter season since 2016.",
    "city_slug": "minneapolis",
    "website_url": "https://612saunasociety.com"
  },
  {
    "name": "Relaxing Healthy Center",
    "address": "7827 Portland Ave S, Bloomington, MN 55420",
    "neighborhood": "Bloomington",
    "lat": 44.8453,
    "lng": -93.2870,
    "rating": 4.0,
    "rating_count": None,
    "price": "$$",
    "types": ["Korean Spa", "Day Spa"],
    "amenities": ["dry_sauna", "steam_room", "pool", "massage", "coed"],
    "hours": "24/7",
    "place_id": "",
    "description": "Minnesota's first Chinese-style 24-hour day spa inspired by Korean jjimjilbang culture, featuring five themed heated rooms, soaking tubs, massage, and an on-site restaurant.",
    "city_slug": "minneapolis",
    "website_url": "https://www.relaxinghealthy.center"
  },
  {
    "name": "Aurora Spa",
    "address": "1609 W Lake St, Minneapolis, MN 55408",
    "neighborhood": "Uptown",
    "lat": 44.9489,
    "lng": -93.3007,
    "rating": 4.3,
    "rating_count": None,
    "price": "$$",
    "types": ["Infrared Studio", "Day Spa"],
    "amenities": ["infrared_sauna", "massage", "private"],
    "hours": "Check website for current hours",
    "place_id": "",
    "description": "A serene day spa in Uptown Minneapolis offering private infrared sauna sessions, massage, and skin care in a calm boutique environment.",
    "city_slug": "minneapolis",
    "website_url": "https://www.auroraspaonline.com"
  },
  {
    "name": "Hewing Hotel Rooftop Spa",
    "address": "300 N Washington Ave, Minneapolis, MN 55401",
    "neighborhood": "North Loop",
    "lat": 44.9850,
    "lng": -93.2768,
    "rating": 4.5,
    "rating_count": None,
    "price": "$$$",
    "types": ["Nordic Spa", "Hotel Spa"],
    "amenities": ["dry_sauna", "pool", "private"],
    "hours": "Hotel guests only — check with hotel",
    "place_id": "",
    "description": "A rooftop spa at the historic Hewing Hotel in the North Loop featuring a custom Helo dry sauna, heated outdoor spa pool, and cocktail lounge.",
    "city_slug": "minneapolis",
    "website_url": "https://hewinghotel.com/rooftop/"
  },
  {
    "name": "Vita Day Spa",
    "address": "5999 Rice Creek Pkwy, Suite 107, Shoreview, MN 55126",
    "neighborhood": "Shoreview",
    "lat": 45.0830,
    "lng": -93.1360,
    "rating": 4.4,
    "rating_count": 156,
    "price": "$$",
    "types": ["Day Spa", "Infrared Studio"],
    "amenities": ["infrared_sauna", "massage", "private"],
    "hours": "Check website for current hours",
    "place_id": "",
    "description": "A Twin Cities day spa known for Korean body scrubs, infrared sauna sessions, and traditional massage and facial services.",
    "city_slug": "minneapolis",
    "website_url": "https://www.vitadayspa.com"
  }
]

def insert_saunas():
    """Insert all saunas into Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/saunas"

    # Prepare JSON data
    data = json.dumps(saunas).encode("utf-8")

    # Create request
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            print(f"✅ Successfully inserted {len(result)} Minneapolis saunas into Supabase!")
            print("\nInserted venues:")
            for row in result:
                print(f"  • {row['name']} (ID: {row['id']})")
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"❌ Error inserting saunas: {e.code}")
        print(f"Details: {error_body}")
        return False

if __name__ == "__main__":
    insert_saunas()

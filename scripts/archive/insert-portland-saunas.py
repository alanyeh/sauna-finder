#!/usr/bin/env python3
"""Insert Portland saunas into Supabase"""

import os
import urllib.request
import json

# Supabase credentials
SUPABASE_URL = "https://oqwwxfecnrspcjjwrylx.supabase.co"
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# Portland saunas data
saunas = [
  {
    "name": "Löyly Sauna",
    "address": "2713 SE 21st Ave, Portland, OR 97202",
    "neighborhood": "Richmond",
    "lat": 45.5084,
    "lng": -122.6448,
    "rating": 4.7,
    "rating_count": 160,
    "price": "$$",
    "types": ["Finnish Sauna", "Day Spa"],
    "amenities": ["dry_sauna", "steam_room", "massage", "private"],
    "hours": "Daily: 9AM-9PM",
    "place_id": "",
    "description": "A modern Finnish sauna sanctuary offering dry sauna, steam, holistic bodywork, massages, and facials in a calm, intimate urban setting.",
    "city_slug": "portland",
    "website_url": "https://www.loyly.net"
  },
  {
    "name": "Knot Springs Social Club",
    "address": "33 NE 3rd Ave, Portland, OR 97232",
    "neighborhood": "Central Eastside",
    "lat": 45.5236,
    "lng": -122.6601,
    "rating": 4.4,
    "rating_count": 497,
    "price": "$$",
    "types": ["Modern Bathhouse"],
    "amenities": ["cold_plunge", "steam_room", "pool", "dry_sauna", "massage", "coed"],
    "hours": "Daily: 8AM-8PM",
    "place_id": "",
    "description": "A membership-based wellness social club featuring contrast therapy hot pools, eucalyptus steam, cold plunge, dry sauna, and massage with Willamette River views.",
    "city_slug": "portland",
    "website_url": "https://www.knotsprings.com"
  },
  {
    "name": "The Everett House",
    "address": "2927 NE Everett St, Portland, OR 97232",
    "neighborhood": "Kerns",
    "lat": 45.5283,
    "lng": -122.6427,
    "rating": 4.5,
    "rating_count": 186,
    "price": "$",
    "types": ["Finnish Sauna", "Day Spa"],
    "amenities": ["dry_sauna", "steam_room", "cold_plunge", "pool", "coed", "massage"],
    "hours": "Tue-Thu: 9AM-11PM, Fri: 11AM-11PM, Sat-Sun: 9AM-11PM",
    "place_id": "",
    "description": "A Portland institution for 30+ years set in two craftsman homes — clothing-optional salt hot tubs, dry sauna, steam room, cold plunge, and community healing arts.",
    "city_slug": "portland",
    "website_url": "https://www.everetthousecommunityhealingcenter.com"
  },
  {
    "name": "Common Ground Wellness Cooperative",
    "address": "5010 NE 33rd Ave, Portland, OR 97211",
    "neighborhood": "Concordia",
    "lat": 45.5546,
    "lng": -122.6319,
    "rating": 4.7,
    "rating_count": 533,
    "price": "$",
    "types": ["Day Spa"],
    "amenities": ["pool", "dry_sauna", "coed", "massage"],
    "hours": "Mon-Tue, Thu-Sun: 10AM-10PM; Wed: 3PM-10PM",
    "place_id": "",
    "description": "A cooperative healing center offering a clothing-optional saltwater hot pool and cedar dry sauna in a lush outdoor courtyard alongside 25+ wellness practitioners.",
    "city_slug": "portland",
    "website_url": "https://www.cgwc.org"
  },
  {
    "name": "CASCADA Thermal Springs",
    "address": "1150 NE Alberta St, Portland, OR 97211",
    "neighborhood": "Alberta Arts District",
    "lat": 45.5604,
    "lng": -122.6541,
    "rating": 4.5,
    "rating_count": 53,
    "price": "$$$",
    "types": ["Modern Bathhouse", "Hotel Spa"],
    "amenities": ["pool", "steam_room", "dry_sauna", "cold_plunge", "massage", "coed"],
    "hours": "Mon-Fri: 6:30AM-9PM, Sat-Sun: 7AM-9PM",
    "place_id": "",
    "description": "Portland's first subterranean thermal spa inside a LEED Platinum mass-timber hotel — five mineral-rich vitality pools, sauna, steam room, and full spa.",
    "city_slug": "portland",
    "website_url": "https://cascada.me"
  },
  {
    "name": "Haven Forest Sauna",
    "address": "9644 SW West Haven Dr, Portland, OR 97225",
    "neighborhood": "West Haven-Sylvan",
    "lat": 45.5118,
    "lng": -122.7616,
    "rating": 5.0,
    "rating_count": 35,
    "price": "$$$",
    "types": ["Russian Bathhouse", "Boutique Sauna"],
    "amenities": ["dry_sauna", "steam_room", "cold_plunge", "private", "massage"],
    "hours": "Daily: 10AM-9PM",
    "place_id": "",
    "description": "A secluded Russian banya tucked in a forested SW Portland setting, offering private attendant-guided sessions with venik ritual, cold plunge, and herbal tea.",
    "city_slug": "portland",
    "website_url": "http://forestsaunapdx.com"
  },
  {
    "name": "Bear Banya",
    "address": "2130 SE 96th Ave, Portland, OR 97216",
    "neighborhood": "Hazelwood",
    "lat": 45.5134,
    "lng": -122.5627,
    "rating": 4.8,
    "rating_count": 40,
    "price": "$$$",
    "types": ["Russian Bathhouse"],
    "amenities": ["dry_sauna", "steam_room", "cold_plunge", "massage", "private", "infrared_sauna"],
    "hours": "Daily: 10AM-10PM",
    "place_id": "",
    "description": "Portland's premier Russian banya blending traditional venik ritual, parilka steam, infrared sauna, cold plunge, and honey-salt treatments in a private setting.",
    "city_slug": "portland",
    "website_url": "https://www.bearbanya.com"
  },
  {
    "name": "SaunaGlo",
    "address": "1915 SE Jefferson St, Milwaukie, OR 97222",
    "neighborhood": "Milwaukie",
    "lat": 45.4575,
    "lng": -122.6419,
    "rating": 4.7,
    "rating_count": 120,
    "price": "$",
    "types": ["Nordic Spa", "Finnish Sauna"],
    "amenities": ["dry_sauna", "cold_plunge", "coed"],
    "hours": "Mon-Thu: 7AM-8PM, Fri: 7AM-9PM, Sat: 9AM-9PM, Sun: 9AM-8PM",
    "place_id": "",
    "description": "A welcoming Nordic community sauna featuring an authentic cedar barrel sauna for up to 18 people, rainwater shower, and cold plunge in a relaxed botanical lounge.",
    "city_slug": "portland",
    "website_url": "https://www.saunaglo.com"
  },
  {
    "name": "Koti Sauna",
    "address": "4128 SE Jefferson St, Milwaukie, OR 97222",
    "neighborhood": "Milwaukie",
    "lat": 45.4577,
    "lng": -122.6437,
    "rating": 4.9,
    "rating_count": 50,
    "price": "$",
    "types": ["Finnish Sauna", "Nordic Spa"],
    "amenities": ["dry_sauna", "cold_plunge", "coed"],
    "hours": "Mon: 10:30AM-6:30PM, Thu-Fri: 12:30PM-8:30PM, Sat-Sun: 8AM-6:30PM",
    "place_id": "",
    "description": "A neighborhood Finnish sauna rooted in community and well-being — outdoor cedar sauna at 185-195°F, dual cold plunges, firepit lounge, and complimentary tea.",
    "city_slug": "portland",
    "website_url": "https://www.kotisauna.com"
  },
  {
    "name": "Pure Sweat Sauna Studio",
    "address": "4019 N Williams Ave, Portland, OR 97227",
    "neighborhood": "Boise",
    "lat": 45.5543,
    "lng": -122.6672,
    "rating": 4.8,
    "rating_count": 80,
    "price": "$$",
    "types": ["Infrared Studio"],
    "amenities": ["infrared_sauna", "cold_plunge", "private"],
    "hours": "Mon-Fri: 10AM-7PM, Sat: 10AM-5PM, Sun: 10AM-6:30PM",
    "place_id": "",
    "description": "Portland's infrared sauna and cold plunge studio on the N. Williams corridor, with private infrared sauna cabins and contrast therapy rooms for recovery.",
    "city_slug": "portland",
    "website_url": "https://www.puresweatstudios.com/portland-or"
  },
  {
    "name": "Lloyd Athletic Club",
    "address": "815 NE Halsey St, Portland, OR 97232",
    "neighborhood": "Lloyd District",
    "lat": 45.5294,
    "lng": -122.6538,
    "rating": 4.5,
    "rating_count": 173,
    "price": "$$",
    "types": ["Gym Sauna"],
    "amenities": ["dry_sauna", "steam_room", "pool", "coed"],
    "hours": "Mon-Fri: 5:30AM-9:30PM, Sat-Sun: 7AM-8PM",
    "place_id": "",
    "description": "Portland's top-rated independent gym with a full sauna, steam room, hot tub, pool, and comprehensive fitness facilities.",
    "city_slug": "portland",
    "website_url": "https://lloydathleticclub.com"
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
            print(f"✅ Successfully inserted {len(result)} Portland saunas into Supabase!")
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

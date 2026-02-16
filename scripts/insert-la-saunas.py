#!/usr/bin/env python3
"""Insert 15 Los Angeles saunas into Supabase"""

import urllib.request
import json

# Supabase credentials
SUPABASE_URL = "https://oqwwxfecnrspcjjwrylx.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xd3d4ZmVjbnJzcGNqandyeWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4Njk3NiwiZXhwIjoyMDg2MDYyOTc2fQ.Q_uQhG2BZdNOsOS-zddwFXe39rzFW2OrynxqvBTVuS8"

# Los Angeles saunas data
saunas = [
  {
    "name": "Wi Spa",
    "address": "2700 Wilshire Blvd, Los Angeles, CA 90057",
    "neighborhood": "Koreatown",
    "lat": 34.0578,
    "lng": -118.2911,
    "rating": 4.3,
    "rating_count": 3891,
    "price": "$$",
    "types": ["Korean Spa"],
    "amenities": ["cold_plunge", "steam_room", "massage", "pool", "coed", "restaurant", "hot_tub"],
    "hours": "Open 24 hours",
    "place_id": "ChIJR9MhLq_GwoARNOEWr6CtUCo",
    "description": "The iconic 24-hour mega jjimjilbang in Koreatown with five themed sauna rooms, co-ed lounge, restaurant, and separate men's and women's bath floors.",
    "city_slug": "la",
    "website_url": "https://wispausa.com",
    "gender_policy": None
  },
  {
    "name": "Spa Palace",
    "address": "620 S Union Ave, Los Angeles, CA 90017",
    "neighborhood": "Koreatown",
    "lat": 34.0562,
    "lng": -118.2693,
    "rating": 4.1,
    "rating_count": 1667,
    "price": "$$",
    "types": ["Korean Spa"],
    "amenities": ["cold_plunge", "steam_room", "massage", "pool", "coed", "restaurant", "hot_tub"],
    "hours": "Open 24 hours",
    "place_id": None,
    "description": "Beloved 24/7 co-ed Korean spa with Himalayan salt room, gold room, loess soil room, ice room, restaurant, and expansive jimjilbang.",
    "city_slug": "la",
    "website_url": "https://spapalacela.com",
    "gender_policy": None
  },
  {
    "name": "Olympic Spa",
    "address": "3915 W Olympic Blvd, Los Angeles, CA 90019",
    "neighborhood": "Koreatown",
    "lat": 34.0529,
    "lng": -118.3245,
    "rating": 4.6,
    "rating_count": 1227,
    "price": "$$",
    "types": ["Korean Spa"],
    "amenities": ["steam_room", "massage", "pool", "hot_tub"],
    "hours": "Daily: 9AM-9PM",
    "place_id": None,
    "description": "Women-only sanctuary offering mugwort pools, Himalayan salt chamber, jade healing lounge, and CBD massages in a serene environment.",
    "city_slug": "la",
    "website_url": "https://olympicspala.com",
    "gender_policy": "Women only"
  },
  {
    "name": "Beverly Hot Springs",
    "address": "308 N Oxford Ave, Los Angeles, CA 90004",
    "neighborhood": "Koreatown",
    "lat": 34.0702,
    "lng": -118.3097,
    "rating": 3.8,
    "rating_count": 360,
    "price": "$$",
    "types": ["Korean Spa", "Traditional Sauna"],
    "amenities": ["steam_room", "massage", "pool", "hot_tub"],
    "hours": "Daily: 10AM-8PM",
    "place_id": None,
    "description": "The only spa in LA built atop a natural alkaline mineral spring, with separate men's and women's facilities featuring hot and cold pools and herbal saunas.",
    "city_slug": "la",
    "website_url": "https://beverlyhotsprings.com",
    "gender_policy": "Separate men/women areas"
  },
  {
    "name": "Crystal Spa",
    "address": "3500 W 6th St, Suite 321, Los Angeles, CA 90020",
    "neighborhood": "Koreatown",
    "lat": 34.0606,
    "lng": -118.3005,
    "rating": 4.2,
    "rating_count": 552,
    "price": "$",
    "types": ["Korean Spa"],
    "amenities": ["cold_plunge", "steam_room", "massage", "hot_tub"],
    "hours": "Daily: 7AM-10PM",
    "place_id": None,
    "description": "Affordable Korean day spa in Koreatown with charcoal room, mud room, salt room, cold plunge, and traditional body scrubs.",
    "city_slug": "la",
    "website_url": "https://crystalspala.com",
    "gender_policy": "Separate men/women areas with coed common area"
  },
  {
    "name": "Aroma Spa & Sports",
    "address": "3680 Wilshire Blvd, Suite 301, Los Angeles, CA 90010",
    "neighborhood": "Koreatown",
    "lat": 34.0617,
    "lng": -118.3063,
    "rating": 4.0,
    "rating_count": 153,
    "price": "$$",
    "types": ["Korean Spa"],
    "amenities": ["cold_plunge", "steam_room", "massage", "pool", "coed", "hot_tub"],
    "hours": "Mon-Fri: 6AM-10PM, Sat-Sun: 7AM-10PM",
    "place_id": None,
    "description": "Hybrid Korean spa and urban resort with multiple sauna styles (steam, dry, clay, jade, infrared), hot/cold pools, indoor pool, and a 4-story golf driving range.",
    "city_slug": "la",
    "website_url": "https://aromaresort.com",
    "gender_policy": None
  },
  {
    "name": "Century Day Spa",
    "address": "4120 W Olympic Blvd, Los Angeles, CA 90019",
    "neighborhood": "Koreatown",
    "lat": 34.0521,
    "lng": -118.3320,
    "rating": 4.0,
    "rating_count": 700,
    "price": "$$",
    "types": ["Korean Spa"],
    "amenities": ["steam_room", "massage", "pool", "coed", "restaurant", "hot_tub"],
    "hours": "Daily: 9AM-12AM",
    "place_id": None,
    "description": "Full-service traditional Korean spa with mugwort tea bath, Korean mist sauna, clay and marble saunas, and body scrubs.",
    "city_slug": "la",
    "website_url": "https://centurydayspa.com",
    "gender_policy": None
  },
  {
    "name": "Daengki Spa",
    "address": "4245 W 3rd St, Los Angeles, CA 90020",
    "neighborhood": "Koreatown",
    "lat": 34.0705,
    "lng": -118.3347,
    "rating": 4.3,
    "rating_count": 181,
    "price": "$",
    "types": ["Korean Spa"],
    "amenities": ["steam_room", "massage"],
    "hours": "Daily: 7AM-10PM",
    "place_id": None,
    "description": "Women-only Korean spa known for outstanding body scrubs, traditional akasuri treatments, and a fabulous dry sauna at an affordable price.",
    "city_slug": "la",
    "website_url": "https://daengkispa.com",
    "gender_policy": "Women only"
  },
  {
    "name": "Queen Spa & Sauna",
    "address": "932 S Vermont Ave, Los Angeles, CA 90006",
    "neighborhood": "Koreatown",
    "lat": 34.0494,
    "lng": -118.2916,
    "rating": 4.6,
    "rating_count": 37,
    "price": "$",
    "types": ["Korean Spa"],
    "amenities": ["steam_room", "massage"],
    "hours": "Daily: 7AM-10PM",
    "place_id": None,
    "description": "Women-only Korean spa with hot sauna rooms, traditional scrub and massage treatments, herbal therapy, acupressure, and skin care services.",
    "city_slug": "la",
    "website_url": "https://queenspala.com",
    "gender_policy": "Women only"
  },
  {
    "name": "Voda Spa",
    "address": "7700 Santa Monica Blvd, West Hollywood, CA 90046",
    "neighborhood": "West Hollywood",
    "lat": 34.0909,
    "lng": -118.3614,
    "rating": 4.1,
    "rating_count": 473,
    "price": "$$$",
    "types": ["Day Spa"],
    "amenities": ["cold_plunge", "steam_room", "massage", "pool", "coed", "restaurant", "hot_tub"],
    "hours": "Mon, Wed-Fri: 1PM-11PM, Sat-Sun: 11AM-11PM",
    "place_id": None,
    "description": "European-style banya spa with Russian, Turkish, and Finnish saunas, indoor pool, cold plunge, full restaurant, and signature platza branch massage.",
    "city_slug": "la",
    "website_url": "https://vodaspa.com",
    "gender_policy": None
  },
  {
    "name": "The Raven Spa",
    "address": "2910 Rowena Ave, Los Angeles, CA 90039",
    "neighborhood": "Silver Lake",
    "lat": 34.0861,
    "lng": -118.2659,
    "rating": 4.6,
    "rating_count": 714,
    "price": "$$",
    "types": ["Day Spa"],
    "amenities": ["steam_room", "massage", "private"],
    "hours": "Daily: 10AM-9PM",
    "place_id": None,
    "description": "Beloved neighborhood spa in Silver Lake offering Thai and custom massages, infrared sauna, rose quartz facials, and holistic wellness treatments.",
    "city_slug": "la",
    "website_url": "https://theravenspa.com",
    "gender_policy": None
  },
  {
    "name": "Teddy's Hot House",
    "address": "1915 Lincoln Blvd, Los Angeles, CA 90291",
    "neighborhood": "Venice",
    "lat": 33.9987,
    "lng": -118.4716,
    "rating": 4.8,
    "rating_count": 120,
    "price": "$$",
    "types": ["Modern Bathhouse", "Finnish Sauna"],
    "amenities": ["cold_plunge"],
    "hours": "Mon-Fri: 7:30AM-11:30AM & 4PM-9PM, Sat-Sun: 10AM-7PM",
    "place_id": None,
    "description": "Community contrast therapy studio in Venice with a 195°F all-magnolia Finnish dry sauna and 38°F cold plunge tubs in 90-minute cycling sessions.",
    "city_slug": "la",
    "website_url": "https://teddyshothouse.com",
    "gender_policy": None
  },
  {
    "name": "Riviera Health Spa",
    "address": "3601 Lomita Blvd, Suite 100, Torrance, CA 90505",
    "neighborhood": "Torrance",
    "lat": 33.8016,
    "lng": -118.3417,
    "rating": 4.4,
    "rating_count": 622,
    "price": "$$",
    "types": ["Korean Spa"],
    "amenities": ["cold_plunge", "steam_room", "massage", "pool", "coed", "restaurant", "hot_tub"],
    "hours": "Daily: 9AM-10PM",
    "place_id": None,
    "description": "Voted cleanest Korean spa in LA County — 30,000 sq ft co-ed facility with Himalayan salt and clay saunas, jacuzzis, hot/cold plunges, and restaurant.",
    "city_slug": "la",
    "website_url": "https://rivierakoreanspa.com",
    "gender_policy": None
  },
  {
    "name": "Spa Montage Beverly Hills",
    "address": "225 N Canon Dr, Beverly Hills, CA 90210",
    "neighborhood": "Beverly Hills",
    "lat": 34.0708,
    "lng": -118.4001,
    "rating": 4.4,
    "rating_count": 63,
    "price": "$$$",
    "types": ["Day Spa"],
    "amenities": ["steam_room", "massage", "pool", "hot_tub", "private"],
    "hours": "Daily: 6AM-9PM",
    "place_id": None,
    "description": "Opulent 20,000 sq ft hotel spa with a sky-lit mineral pool, Swiss showers, Turkish steam rooms, redwood dry saunas, and 17 treatment rooms.",
    "city_slug": "la",
    "website_url": "https://montagehotels.com/beverlyhills/spa",
    "gender_policy": None
  },
  {
    "name": "Burke Williams Day Spa",
    "address": "925 N La Brea Ave, Hollywood, CA 90038",
    "neighborhood": "Hollywood",
    "lat": 34.0850,
    "lng": -118.3450,
    "rating": 4.2,
    "rating_count": 354,
    "price": "$$$",
    "types": ["Day Spa"],
    "amenities": ["steam_room", "massage", "hot_tub", "pool", "coed"],
    "hours": "Mon-Thu: 9AM-9PM, Fri: 9AM-10PM, Sat: 8AM-10PM, Sun: 8AM-9PM",
    "place_id": None,
    "description": "LA's original luxury day spa chain with 21 treatment rooms, whirlpools, steam rooms, dry saunas, misting rooms, and a serene co-ed lounge.",
    "city_slug": "la",
    "website_url": "https://burkewilliams.com",
    "gender_policy": None
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
            print(f"✅ Successfully inserted {len(result)} Los Angeles saunas into Supabase!")
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

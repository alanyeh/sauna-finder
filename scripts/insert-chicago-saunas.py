#!/usr/bin/env python3
"""Insert 15 Chicago saunas into Supabase"""

import urllib.request
import json

# Supabase credentials
SUPABASE_URL = "https://oqwwxfecnrspcjjwrylx.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xd3d4ZmVjbnJzcGNqandyeWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4Njk3NiwiZXhwIjoyMDg2MDYyOTc2fQ.Q_uQhG2BZdNOsOS-zddwFXe39rzFW2OrynxqvBTVuS8"

# Chicago saunas data
saunas = [
  {
    "name": "King Spa & Sauna",
    "address": "809 Civic Center Drive, Niles, IL 60714",
    "neighborhood": "Niles",
    "lat": 42.0249,
    "lng": -87.8013,
    "rating": 4.8,
    "rating_count": 1384,
    "price": "$$",
    "types": ["Korean Spa"],
    "amenities": ["sauna", "pool", "massage", "steam_room", "coed"],
    "hours": "24/7",
    "place_id": "ChIJzyQrI-TID4gR8mgPIjV1-Zo",
    "description": "Largest Korean spa in the US with 9 healing sauna rooms, 34,000 sq ft, 24/7 access.",
    "city_slug": "chicago",
    "website_url": "https://www.kingspa.com/chicago/"
  },
  {
    "name": "AIRE Ancient Baths Chicago",
    "address": "800 W Superior Street, Chicago, IL 60642",
    "neighborhood": "River West",
    "lat": 41.8957,
    "lng": -87.6480,
    "rating": 4.5,
    "rating_count": 684,
    "price": "$$$",
    "types": ["Modern Bathhouse"],
    "amenities": ["sauna", "steam_room", "cold_plunge", "pool", "massage"],
    "hours": "Mon 8AM-11PM, Tue-Thu 9AM-11PM, Fri-Sun 8AM-11PM",
    "place_id": "ChIJ_5LpqjLTD4gR1hwh0I4nC1A",
    "description": "Luxury 90-minute thermal bath experience with 6 hot/cold baths, steam rooms, and floatarium.",
    "city_slug": "chicago",
    "website_url": "https://beaire.com/en/aire-ancient-baths-chicago"
  },
  {
    "name": "Sky Spa Sauna",
    "address": "1501 Busch Parkway, Buffalo Grove, IL 60089",
    "neighborhood": "Buffalo Grove",
    "lat": 42.1702,
    "lng": -87.9248,
    "rating": 4.5,
    "rating_count": 949,
    "price": "$$",
    "types": ["Russian Banya"],
    "amenities": ["sauna", "steam_room", "salt_cave", "jacuzzi", "pool", "coed"],
    "hours": "Mon-Fri 3PM-11PM, Sat-Sun 12PM-11PM",
    "place_id": "",
    "description": "Premier Russian European spa with 5 different saunas, Himalayan salt caves, 16,000 sq ft facility.",
    "city_slug": "chicago",
    "website_url": "https://skyspasauna.com/"
  },
  {
    "name": "Life Time River North",
    "address": "15 W Chicago Avenue, Chicago, IL 60654",
    "neighborhood": "River North",
    "lat": 41.8927,
    "lng": -87.6275,
    "rating": 4.2,
    "rating_count": 52,
    "price": "$$$",
    "types": ["Gym Sauna", "Luxury Athletic Club"],
    "amenities": ["sauna", "steam_room", "cold_plunge", "pool", "massage"],
    "hours": "Call for hours",
    "place_id": "",
    "description": "126,000 sq ft luxury athletic resort with sauna, steam, cold plunge, and 50-foot indoor pool.",
    "city_slug": "chicago",
    "website_url": "https://www.lifetime.life/locations/il/river-north-one-chicago.html"
  },
  {
    "name": "Eastend",
    "address": "1132 W Fulton Market, Chicago, IL 60607",
    "neighborhood": "West Loop",
    "lat": 41.8831,
    "lng": -87.6474,
    "rating": None,
    "rating_count": None,
    "price": "$$",
    "types": ["Modern Wellness Club"],
    "amenities": ["sauna", "cold_plunge", "infrared_sauna", "light_therapy", "salt_chamber"],
    "hours": "Mon-Fri 8AM-9PM, Sat-Sun 9AM-6PM",
    "place_id": "",
    "description": "5,000 sq ft modern wellness club with 40-person Finnish sauna, 4 cold plunges, infrared, and light therapy.",
    "city_slug": "chicago",
    "website_url": "https://practiceeastend.com/"
  },
  {
    "name": "Perspire Sauna Studio",
    "address": "3320 N Broadway, Chicago, IL 60657",
    "neighborhood": "Lakeview",
    "lat": 41.9483,
    "lng": -87.6418,
    "rating": 4.2,
    "rating_count": 18,
    "price": "$$",
    "types": ["Infrared Sauna Studio"],
    "amenities": ["infrared_sauna", "light_therapy"],
    "hours": "Mon-Fri 7AM-8PM, Sat 8AM-6PM, Sun 9AM-5PM",
    "place_id": "",
    "description": "Modern infrared sauna studio offering full-spectrum IR sauna and red light therapy sessions.",
    "city_slug": "chicago",
    "website_url": "https://www.perspiresaunastudio.com/il/lakeview/"
  },
  {
    "name": "SweatHouz Old Town",
    "address": "1439 N Wells Street, Chicago, IL 60610",
    "neighborhood": "Old Town",
    "lat": 41.9171,
    "lng": -87.6381,
    "rating": 4.5,
    "rating_count": 109,
    "price": "$$",
    "types": ["Infrared Sauna & Cold Plunge"],
    "amenities": ["infrared_sauna", "cold_plunge", "private"],
    "hours": "Mon-Fri 6AM-8PM, Sat-Sun 8AM-6PM",
    "place_id": "",
    "description": "Modern infrared sauna and cold plunge facility with private exclusive suites for individual or small group sessions.",
    "city_slug": "chicago",
    "website_url": "https://sweathouz.com/old-town-book-now/"
  },
  {
    "name": "Ethos",
    "address": "3620 N Lincoln Avenue, Chicago, IL 60613",
    "neighborhood": "Roscoe Village",
    "lat": 41.9455,
    "lng": -87.6835,
    "rating": 4.5,
    "rating_count": 87,
    "price": "$$",
    "types": ["Gym Sauna", "Recovery Center"],
    "amenities": ["sauna", "cold_plunge", "training"],
    "hours": "Mon-Fri 5AM-7:30PM, Sat-Sun limited",
    "place_id": "ChIJb0aFS6nTD4gRlWkC7TeCDYM",
    "description": "Modern recovery-focused gym with 15-person sauna and 3 cold plunges for contrast therapy.",
    "city_slug": "chicago",
    "website_url": "https://ethostrainingchi.com/"
  },
  {
    "name": "Midtown Athletic Club",
    "address": "2444 N Elston Avenue, Chicago, IL 60647",
    "neighborhood": "North Center",
    "lat": 41.9275,
    "lng": -87.6889,
    "rating": 4.3,
    "rating_count": 277,
    "price": "$$",
    "types": ["Gym Sauna"],
    "amenities": ["sauna", "steam_room", "pool", "tennis", "massage"],
    "hours": "Mon-Thu 5AM-11PM, Fri 5AM-10PM, Sat-Sun 6AM-9PM",
    "place_id": "",
    "description": "Established 1970, world's largest indoor tennis facility with spacious sauna and steam rooms.",
    "city_slug": "chicago",
    "website_url": "https://www.midtown.com/locations/chicago/"
  },
  {
    "name": "FFC Gold Coast",
    "address": "1030 N Clark Street, Chicago, IL 60610",
    "neighborhood": "Gold Coast",
    "lat": 41.8977,
    "lng": -87.6313,
    "rating": 4.3,
    "rating_count": 144,
    "price": "$$",
    "types": ["Gym Sauna"],
    "amenities": ["sauna", "steam_room", "pool", "massage"],
    "hours": "Mon-Thu 4:30AM-10PM, Fri 4:30AM-9PM, Sat-Sun 6AM-8PM",
    "place_id": "ChIJwbFKjU7TD4gREEALQK76pJ8",
    "description": "Upscale fitness club with indoor pool, saunas, steam rooms, and full recovery amenities.",
    "city_slug": "chicago",
    "website_url": "https://ffc.com/club-locations/gold-coast/"
  },
  {
    "name": "Steamworks Chicago",
    "address": "3246 N Halsted Street, Chicago, IL 60657",
    "neighborhood": "Boystown",
    "lat": 41.9453,
    "lng": -87.6451,
    "rating": 4.4,
    "rating_count": 142,
    "price": "$$",
    "types": ["Bathhouse", "Gym"],
    "amenities": ["sauna", "steam_room", "gym", "private"],
    "hours": "24/7",
    "place_id": "ChIJebfiQK_TD4gRCV3dYmG8UPI",
    "description": "Modern 24/7 bathhouse with gym, sauna, steam room, private cabins, and food service.",
    "city_slug": "chicago",
    "website_url": "https://www.steamworksbaths.com/chicago"
  },
  {
    "name": "Lost Language Sauna",
    "address": "4510 N Ravenswood Avenue, Chicago, IL 60640",
    "neighborhood": "Ravenswood",
    "lat": 41.9821,
    "lng": -87.6624,
    "rating": None,
    "rating_count": None,
    "price": "$$",
    "types": ["Outdoor Sauna"],
    "amenities": ["wood_fired_sauna", "infrared_sauna", "cold_plunge", "coed"],
    "hours": "Thu-Sun (varies, electric sauna), Fri-Sun (wood-fired)",
    "place_id": "",
    "description": "NEW 2025: Trendy outdoor sauna with wood-fired and electric options, cold plunges, and social atmosphere.",
    "city_slug": "chicago",
    "website_url": "https://www.lostlanguagesauna.com"
  },
  {
    "name": "Four Seasons Chicago Spa",
    "address": "120 E Delaware Place, Chicago, IL 60611",
    "neighborhood": "Downtown",
    "lat": 41.8954,
    "lng": -87.6225,
    "rating": 4.5,
    "rating_count": 329,
    "price": "$$$",
    "types": ["Hotel Spa"],
    "amenities": ["sauna", "steam_room", "pool", "massage"],
    "hours": "8AM-8PM daily",
    "place_id": "ChIJm8-Nw1PTD4gRPGFqqWxjOkA",
    "description": "Luxury 5-star hotel spa above the Magnificent Mile with sauna, steam room, 50-ft indoor pool.",
    "city_slug": "chicago",
    "website_url": "https://www.fourseasons.com/chicago/spa/"
  },
  {
    "name": "Urban Oasis North Avenue",
    "address": "939 W North Avenue, Chicago, IL 60642",
    "neighborhood": "Old Town",
    "lat": 41.9098,
    "lng": -87.6461,
    "rating": 4.5,
    "rating_count": 287,
    "price": "$$",
    "types": ["Day Spa"],
    "amenities": ["sauna", "steam_shower", "massage"],
    "hours": "Mon 12PM-8PM, Tue-Thu 10AM-8PM, Fri 9AM-7PM, Sat 9AM-6PM, Sun 10AM-5PM",
    "place_id": "ChIJr5SI_iPTD4gREHv1jgytBq8",
    "description": "Established 1992: Premier massage spa with private locker rooms, sauna, and steam showers.",
    "city_slug": "chicago",
    "website_url": "https://urbanoasismassage.com/"
  },
  {
    "name": "Chuan Spa at The Langham",
    "address": "330 N Wabash Avenue, Chicago, IL 60611",
    "neighborhood": "Downtown",
    "lat": 41.8863,
    "lng": -87.6226,
    "rating": 4.5,
    "rating_count": 86,
    "price": "$$$",
    "types": ["Hotel Spa", "Luxury Spa"],
    "amenities": ["herbal_sauna", "salt_sauna", "steam_room", "massage"],
    "hours": "8AM-8PM daily",
    "place_id": "",
    "description": "Luxury 5-star hotel spa with herbal sauna, Himalayan salt sauna, and premium wellness treatments.",
    "city_slug": "chicago",
    "website_url": "https://www.langhamhotels.com/en/the-langham/chicago/wellness/chuan-spa/"
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
            print(f"✅ Successfully inserted {len(result)} Chicago saunas into Supabase!")
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

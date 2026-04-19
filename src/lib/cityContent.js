// Per-city SEO content: intro paragraphs + FAQs rendered below the sauna list.
//
// Why this file exists: crawlers and AI answer engines need unique prose to
// extract, compare, and cite. A list of sauna cards isn't enough — each city
// page needs 100-200 words of original text about the local bathing scene plus
// answers to the questions people actually ask. That's what this file stores.
//
// Content is intentionally written once here (not pulled from a CMS) so it
// ships with the prerendered HTML. Keep each city's intro factually safe —
// talk about the scene, traditions, and what to expect rather than naming
// specific venues whose details may go stale.

export const CITY_CONTENT = {
  nyc: {
    intro: [
      "New York City has one of the oldest and most diverse bathhouse scenes in North America. From century-old Russian and Turkish steam rooms in the East Village to Korean-style jjimjilbangs in Flushing and sleek social bathhouses in Williamsburg and Flatiron, you can find almost every bathing tradition within a single subway ride.",
      "Most NYC saunas fall into three camps: traditional Russian and Turkish banyas with heavy platza oak-leaf treatments, Korean spas built around multiple themed rooms and contrast bathing, and newer wellness-focused bathhouses offering hot-cold circuits, breathwork, and ice baths. Expect day passes from around $40 at Korean spas up to $70–$90 at modern bathhouses.",
    ],
    faqs: [
      {
        q: "How much does a sauna session cost in New York City?",
        a: "NYC sauna and bathhouse day passes typically range from $40 to $90. Korean-style jjimjilbangs are usually the most affordable at around $40–$50 for all-day access. Modern social bathhouses charge $60–$90 for a single session, and traditional Russian-Turkish banyas fall in the middle at around $50–$70.",
      },
      {
        q: "What's the best sauna in NYC?",
        a: "The best sauna depends on the experience you want. For traditional Russian-Turkish banya with platza treatments, the East Village has been the historic home of the scene since the late 1800s. For Korean-style jjimjilbangs with multiple themed rooms, head to Flushing. For modern contrast bathing and social wellness, Williamsburg and Flatiron have the newer concept bathhouses.",
      },
      {
        q: "Do you need to bring a swimsuit to NYC bathhouses?",
        a: "Most mixed-gender bathhouses in NYC require a swimsuit. Traditional Russian banyas and Korean spas typically have single-gender bathing areas where nudity is customary, plus coed common rooms that use loaner shorts and t-shirts. Check each venue's rules before going.",
      },
      {
        q: "Are there coed saunas in NYC?",
        a: "Yes. Most modern bathhouses in Williamsburg, Flatiron, and Brooklyn are fully coed and require swimsuits. Traditional Korean jjimjilbangs have single-gender bathing zones but a large coed common room where everyone wears provided shorts and t-shirts.",
      },
      {
        q: "What should I bring to a sauna in NYC?",
        a: "Bring a swimsuit, a water bottle, flip-flops for the wet areas, and a sauna hat to protect your hair and help regulate head temperature during longer sessions. Most venues provide towels, a robe, and basic toiletries, but some Russian banyas expect you to bring your own.",
      },
    ],
  },

  sf: {
    intro: [
      "San Francisco's sauna scene reflects the city's cultural crosscurrents: Japanese-style onsen bathing in the Mission, century-old Japantown bathhouses, Russian banyas with riverfront cold plunges, and a growing number of Nordic-inspired contrast bathing studios. The Bay Area's temperate climate makes hot-cold therapy feel especially indulgent year-round.",
      "Compared to NYC, SF leans heavier into Japanese and Nordic traditions and lighter on Korean spa culture. Many venues emphasize mineral hot springs, redwood cedar rooms, and quiet communal bathing over the social-lounge experience. Expect day passes between $45 and $95 depending on the venue.",
    ],
    faqs: [
      {
        q: "How much does a sauna session cost in San Francisco?",
        a: "San Francisco sauna day passes generally run from $45 to $95. Japanese communal baths and hot spring spas sit on the lower end, while private-room Nordic bathhouses and mineral spas are pricier.",
      },
      {
        q: "What's the best sauna in San Francisco?",
        a: "It depends on the style. For Japanese onsen-style communal bathing, the Mission and Japantown have the most authentic options. For Russian banyas with outdoor cold plunges and platza, the eastern waterfront has long-running venues. For modern contrast bathing, several newer studios have opened across the city since 2022.",
      },
      {
        q: "Are San Francisco bathhouses clothing-optional?",
        a: "Japanese-style communal baths and some traditional banyas in SF have single-gender nude bathing sections. Mixed-gender areas and most modern bathhouses require swimsuits. Always check the venue's policy before arriving.",
      },
      {
        q: "Where can I find a Finnish or Nordic-style sauna in SF?",
        a: "San Francisco has several Nordic-inspired contrast bathing studios that opened in the last few years, most offering wood-fired or electric saunas paired with cold plunges. Traditional Finnish saunas are also available at some Japanese bathhouses and mineral spas around the Bay Area.",
      },
      {
        q: "What should I bring to a sauna in San Francisco?",
        a: "Bring a swimsuit for mixed-gender areas, flip-flops, a refillable water bottle, and a sauna hat to keep your head cooler during longer heat sessions. Most venues provide towels and a locker; nicer spas include robes and toiletries.",
      },
    ],
  },

  chicago: {
    intro: [
      "Chicago's sauna culture is anchored by its strong Eastern European roots: Russian and Ukrainian banyas have been operating in the city for decades, with platza oak-leaf treatments and cold plunges as the centerpiece. The scene also includes Korean spas serving the large Midwest Korean community and a growing cluster of modern social bathhouses.",
      "Winters here make sauna a genuine health ritual, not just a wellness trend. Expect traditional venues to lean rugged and communal, while newer bathhouses emphasize design, ice baths, and contrast therapy. Day passes typically range from $40 to $85.",
    ],
    faqs: [
      {
        q: "How much does a sauna session cost in Chicago?",
        a: "Chicago sauna and bathhouse day passes generally fall between $40 and $85. Traditional Russian banyas and Korean spas offer all-day access on the lower end, while newer concept bathhouses with contrast circuits charge $60–$85 per session.",
      },
      {
        q: "What's the best banya in Chicago?",
        a: "Chicago has several long-running Russian and Ukrainian banyas that offer the full traditional experience — wood-fired steam rooms, cold plunges, platza treatments, and hearty food service. These are usually family-run and located in the neighborhoods with historic Eastern European communities.",
      },
      {
        q: "Are there Korean spas in Chicago?",
        a: "Yes. Chicago and its north suburbs have several Korean-style jjimjilbangs with multiple themed rooms, scrub treatments, and large communal bathing areas. These are typically open 24 hours and offer overnight stays.",
      },
      {
        q: "What should I wear to a Chicago bathhouse?",
        a: "Russian banyas and Korean spas typically have single-gender nude bathing areas plus coed common rooms that require provided shorts and a t-shirt. Modern mixed-gender bathhouses require a swimsuit throughout. Bring flip-flops for the wet areas.",
      },
      {
        q: "What should I bring to a sauna in Chicago?",
        a: "Bring a swimsuit, flip-flops, a water bottle, and a sauna hat to regulate head temperature during traditional banya sessions where ambient temperatures can exceed 200°F. Most venues provide towels; some banyas expect you to bring your own.",
      },
    ],
  },

  seattle: {
    intro: [
      "Seattle has one of the fastest-growing sauna scenes in North America, rooted in the Pacific Northwest's Nordic heritage and the region's embrace of cold-water therapy. You'll find traditional Finnish-style wood saunas, Russian banyas serving the large Russian-speaking community, Korean spas, and mobile wood-fired saunas that pop up along the waterfront.",
      "The city's climate and proximity to cold water make contrast bathing feel natural here — many venues pair sauna sessions with plunges into Puget Sound or glacier-fed cold tubs. Expect day passes from $35 for public Nordic-style sessions up to $90 for full bathhouse experiences.",
    ],
    faqs: [
      {
        q: "How much does a sauna session cost in Seattle?",
        a: "Seattle sauna prices range from around $35 for public waterfront Nordic saunas to $90 for full spa-style bathhouse experiences. Mobile wood-fired saunas are often the most affordable entry point, while Korean spas and modern bathhouses sit at the higher end.",
      },
      {
        q: "Are there waterfront saunas in Seattle?",
        a: "Yes — Seattle has a growing scene of mobile and floating wood-fired saunas along Puget Sound, Lake Washington, and Lake Union. These often offer plunges directly into the cold water, which is the core of the Nordic sauna tradition.",
      },
      {
        q: "What's a Finnish-style sauna and where can I find one in Seattle?",
        a: "A Finnish sauna is a wood-lined room heated by a stove (often wood-fired) where you pour water on hot stones to raise the humidity — called löyly. Seattle has several venues offering authentic Finnish-style sessions, often with cold plunges into natural water.",
      },
      {
        q: "Are Seattle saunas coed?",
        a: "Modern bathhouses and most mobile wood-fired saunas in Seattle are coed and require a swimsuit. Korean spas have single-gender bathing areas with coed common rooms. Traditional Russian banyas follow the same pattern with separate men's and women's zones.",
      },
      {
        q: "What should I bring to a sauna in Seattle?",
        a: "Bring a swimsuit, flip-flops, a towel (some mobile saunas don't provide them), a water bottle, and a sauna hat to protect your head during hotter sessions. For waterfront saunas with natural cold plunges, an extra towel and warm layers for after are a good idea.",
      },
    ],
  },

  la: {
    intro: [
      "Los Angeles has one of the largest Korean spa scenes in North America, centered in Koreatown, where 24-hour jjimjilbangs offer themed rooms, communal bathing, scrub treatments, and overnight stays. Beyond Koreatown, the city also has mineral hot spring spas, infrared sauna studios, and a growing number of Nordic-inspired contrast bathing venues on the Westside.",
      "LA's year-round warm climate makes sauna feel more like a recovery ritual than a winter necessity. Expect Korean spas around $30–$60 for all-day access, infrared studios at $40–$60 per session, and modern contrast bathhouses at $60–$90.",
    ],
    faqs: [
      {
        q: "How much does a Korean spa cost in Los Angeles?",
        a: "Korean spa day passes in Los Angeles typically run from $30 to $60 for all-day access, with most Koreatown venues at the lower end. This usually includes hot and cold pools, dry and wet saunas, themed jjimjilbang rooms, and use of basic amenities. Scrub treatments and massages are priced separately.",
      },
      {
        q: "What's the best Korean spa in LA?",
        a: "LA has several long-running Korean spas in Koreatown, most open 24 hours. The best one depends on what you want — some focus on the full jjimjilbang experience with many themed rooms, while others emphasize larger pools or more extensive scrub and massage menus. Koreatown within about a one-mile radius has the highest concentration.",
      },
      {
        q: "Are Korean spas in LA coed?",
        a: "Korean spas are single-gender in the pool and sauna areas, where bathing is nude. They're coed in the jjimjilbang common room, where everyone wears provided shorts and a t-shirt. Families can meet up in the common room between bathing sessions.",
      },
      {
        q: "Can you sleep at a Korean spa in LA?",
        a: "Yes — most 24-hour Korean spas in Koreatown allow overnight stays for the price of a day pass. People sleep in the jjimjilbang common room on provided mats. It's a common budget-friendly option, though amenities and sleep quality vary by venue.",
      },
      {
        q: "What should I bring to a Korean spa in LA?",
        a: "Korean spas provide towels, jjimjilbang uniform shorts and t-shirt, soap, and shampoo. You'll want to bring a water bottle, flip-flops for the walk between bathing and common areas, and a sauna hat if you plan on longer sessions in the hotter themed rooms.",
      },
    ],
  },

  minneapolis: {
    intro: [
      "Minneapolis-St. Paul has the strongest Nordic sauna heritage of any major US metro area, a legacy of Finnish, Swedish, and Norwegian immigration to the region. You'll find traditional wood-fired saunas, public lakeside sauna cooperatives, mobile tow-behind saunas, and a number of newer social bathhouses — plus Korean spas in the suburbs.",
      "Sauna here isn't trendy — it's generational. Many Minnesotans grew up with a basement or cabin sauna, and the Twin Cities' recent wave of public venues is more of a return than a new arrival. Expect day passes from $25 for cooperative lakeside sessions up to $80 for full bathhouse experiences.",
    ],
    faqs: [
      {
        q: "How much does a sauna session cost in Minneapolis?",
        a: "Minneapolis sauna prices are some of the most accessible in the country, starting around $25 for public lakeside cooperative sessions and mobile wood-fired saunas. Modern bathhouses and Korean spas range from $50 to $80 for day passes.",
      },
      {
        q: "Are there public saunas on Minneapolis lakes?",
        a: "Yes — Minneapolis and the surrounding area have several mobile and fixed wood-fired saunas operating on or near the city's lakes, especially during the cold months when plunging through the ice is part of the tradition. These are often run as cooperatives or pop-up sessions.",
      },
      {
        q: "What's a Finnish-style sauna and why is Minneapolis known for it?",
        a: "A Finnish sauna is a wood-lined room heated by a stove where water is poured on hot stones to create löyly, a burst of humid heat. Minneapolis has deep Finnish and Scandinavian roots, and sauna culture has been continuous here for over a century, making it one of the most authentic Nordic sauna cities outside Finland.",
      },
      {
        q: "Can you plunge through the ice after a sauna in Minnesota?",
        a: "Yes — during winter, many lakeside and cooperative saunas cut a hole in the ice for cold plunges. This traditional Finnish avanto is the ultimate form of contrast therapy and a defining part of Minnesota sauna culture.",
      },
      {
        q: "What should I bring to a sauna in Minneapolis?",
        a: "Bring a swimsuit, flip-flops, a towel (some mobile saunas don't supply them), a water bottle, and a sauna hat to keep your head cooler during longer sessions. For winter ice plunges, bring warm layers and dry socks for after.",
      },
    ],
  },

  portland: {
    intro: [
      "Portland's sauna scene blends Nordic, Japanese, and wellness-studio traditions, reflecting the Pacific Northwest's broader relationship with natural therapies. You'll find Finnish-style wood saunas, Japanese onsen-inspired bathhouses, Russian banyas, and a growing number of boutique contrast bathing studios across the east and west sides.",
      "Many Portland venues emphasize quiet, meditative bathing over loud social lounges, and the city's natural surroundings give operators easy access to cold plunges and river-fed cold water. Expect day passes from $40 to $85.",
    ],
    faqs: [
      {
        q: "How much does a sauna session cost in Portland?",
        a: "Portland sauna day passes typically range from $40 to $85. Japanese onsen-style bathhouses and Nordic contrast studios sit at the higher end, while traditional Russian banyas and basic sauna-only venues are more affordable.",
      },
      {
        q: "Are there Japanese-style saunas in Portland?",
        a: "Yes. Portland has a notable Japanese onsen-inspired bathhouse scene with authentic communal bathing and cedar rooms. Expect a quieter, more meditative experience compared to Korean spas or modern social bathhouses.",
      },
      {
        q: "Is Portland good for Finnish-style saunas?",
        a: "Portland has several venues offering authentic Finnish-style wood-heated saunas with löyly (water on hot stones). The Pacific Northwest climate and proximity to cold water make the contrast bathing experience feel natural here.",
      },
      {
        q: "Do Portland saunas offer cold plunges?",
        a: "Most modern Portland bathhouses and Nordic studios pair sauna sessions with cold plunges, typically between 38°F and 50°F. A few venues use river-fed or mineral cold baths for an even more authentic experience.",
      },
      {
        q: "What should I bring to a sauna in Portland?",
        a: "Bring a swimsuit, flip-flops, a water bottle, and a sauna hat to keep your head cooler during longer sessions. Most Portland venues provide towels, robes, and basic toiletries.",
      },
    ],
  },

  denver: {
    intro: [
      "Denver's sauna scene has grown quickly in the last few years, driven by the wellness and outdoor recovery communities that see contrast bathing as a complement to hiking, skiing, and altitude training. The city now has Nordic-style contrast studios, Russian banyas, Korean spas, and infrared studios, with more natural hot springs accessible within a short drive.",
      "The high altitude and dry climate change how sauna feels in Denver — sessions often feel more intense, and hydration matters more than at sea level. Expect day passes from $40 to $90, and a wealth of natural hot springs options within 1–2 hours outside the city.",
    ],
    faqs: [
      {
        q: "How much does a sauna cost in Denver?",
        a: "Denver sauna and bathhouse day passes typically run from $40 to $90. Infrared studios and basic Korean spas are cheaper, while modern contrast bathing studios and wellness bathhouses sit at the top of the range.",
      },
      {
        q: "Are there hot springs near Denver?",
        a: "Yes — several natural hot springs are within a 1–2 hour drive of Denver, including well-known resort and mineral hot springs scattered throughout the Rocky Mountain foothills. Many locals pair a day trip there with their in-city sauna routine.",
      },
      {
        q: "Does altitude affect sauna sessions in Denver?",
        a: "Yes. Denver's elevation (~5,280 ft) and dry climate can make sauna sessions feel more dehydrating than at sea level. Drink extra water before and after, and limit first sessions to shorter durations if you're not acclimated.",
      },
      {
        q: "Are there Russian banyas in Denver?",
        a: "Yes — Denver has a growing Russian-speaking community and a few traditional banya venues offering platza oak-leaf treatments, wood-fired steam rooms, and cold plunges.",
      },
      {
        q: "What should I bring to a sauna in Denver?",
        a: "Bring a swimsuit, flip-flops, a large water bottle (hydration matters more at altitude), and a sauna hat to regulate head temperature during longer sessions. Most venues provide towels and a locker.",
      },
    ],
  },

  houston: {
    intro: [
      "Houston's sauna scene reflects its role as one of the most internationally diverse cities in the US. Korean spas are the largest category, centered in the city's sizeable Korean community, followed by hotel spas, infrared studios, and a small number of traditional banyas and modern contrast bathhouses.",
      "The heat and humidity of the Gulf Coast change how sauna feels in Houston — many locals use infrared or cooler dry sessions rather than high-temperature steam. Korean spas remain the best value for first-timers, with all-day access typically running $30–$60.",
    ],
    faqs: [
      {
        q: "How much does a Korean spa cost in Houston?",
        a: "Korean spa day passes in Houston generally run from $30 to $60 for all-day access, including hot and cold pools, saunas, steam rooms, and themed jjimjilbang common rooms. Scrub treatments and massages are priced separately.",
      },
      {
        q: "What's the best Korean spa in Houston?",
        a: "Houston has several large Korean spas serving the Southwest's largest Korean community. The best depends on whether you prioritize pool and sauna variety, food service, overnight stays, or treatment menus. Most Houston-area Korean spas are open 24 hours.",
      },
      {
        q: "Are there infrared saunas in Houston?",
        a: "Yes — Houston has a growing number of infrared sauna studios offering individual or small-group sessions at lower temperatures than traditional saunas. These are popular for recovery and are generally cheaper on a per-session basis.",
      },
      {
        q: "Are Korean spas in Houston coed?",
        a: "Korean spas in Houston are single-gender in the pool and sauna areas (nude bathing) and coed in the jjimjilbang common room where everyone wears provided shorts and a t-shirt. Families meet up in the common room between bathing.",
      },
      {
        q: "What should I bring to a sauna in Houston?",
        a: "Korean spas provide towels, jjimjilbang uniforms, and basic toiletries. Bring a water bottle, flip-flops, and a sauna hat for longer sessions in the hotter themed rooms. For infrared studios, you often just need a towel and a change of clothes.",
      },
    ],
  },

  vancouver: {
    intro: [
      "Vancouver's sauna scene is shaped by the Pacific Northwest's Nordic and Japanese influences, the large Korean community in Metro Vancouver, and the city's proximity to the mountains. You'll find Korean spas with jjimjilbang common rooms, modern Scandinavian-inspired bathhouses, Japanese onsen-style venues, and infrared studios — plus full Nordic spa experiences within a short drive in the North Shore and Whistler corridor.",
      "Expect Korean spas in the CAD $35–$60 range for all-day access, and modern Nordic bathhouses at CAD $60–$120 per session. Many of Vancouver's highest-rated sauna experiences are just outside the city in the mountains.",
    ],
    faqs: [
      {
        q: "How much does a sauna cost in Vancouver?",
        a: "Vancouver sauna day passes range from around CAD $35 at Korean spas to CAD $120 at destination Nordic bathhouses. Modern downtown bathhouses and contrast studios typically sit between CAD $60–$90 per session.",
      },
      {
        q: "Are there Scandinavian spas near Vancouver?",
        a: "Yes — the North Shore mountains and the Sea-to-Sky corridor toward Whistler are home to several full Scandinavian-style outdoor spas featuring hot baths, cold plunges, saunas, and relaxation areas in forest settings. These are popular day trips from Vancouver.",
      },
      {
        q: "Are Korean spas popular in Vancouver?",
        a: "Yes — Metro Vancouver has a large Korean community and several Korean spas offering the full jjimjilbang experience, including themed rooms, large communal pools, scrub treatments, and 24-hour access.",
      },
      {
        q: "Do Vancouver saunas have cold plunges?",
        a: "Most modern bathhouses and Scandinavian spas in and around Vancouver pair sauna with cold plunge pools, typically between 4°C and 10°C (39°F–50°F). Traditional Korean spas include separate cold pools as part of their standard facilities.",
      },
      {
        q: "What should I bring to a sauna in Vancouver?",
        a: "Bring a swimsuit, flip-flops, a water bottle, and a sauna hat to regulate head temperature during longer sessions. Most Vancouver bathhouses provide towels and robes; Korean spas provide the jjimjilbang uniform and basic toiletries.",
      },
    ],
  },

  toronto: {
    intro: [
      "Toronto has one of the most dynamic sauna scenes in Canada, with modern contrast bathing studios, Russian banyas, Korean spas serving the large GTA Korean community, and Middle Eastern hammams all operating within the city. The recent wave of social bathhouses has made sauna a mainstream wellness ritual here.",
      "Toronto's cold winters make sauna feel like a natural fit, and the contrast between hot sessions and outdoor cold is a central part of the experience at many venues. Expect day passes from CAD $40 at Korean spas to CAD $100 at modern bathhouses.",
    ],
    faqs: [
      {
        q: "How much does a sauna cost in Toronto?",
        a: "Toronto sauna and bathhouse day passes typically run from CAD $40 at Korean spas to CAD $100 at modern contrast bathing studios. Russian banyas and hammams sit in the middle at CAD $50–$80.",
      },
      {
        q: "What's the best bathhouse in Toronto?",
        a: "Toronto has several highly-rated bathhouses, including modern social bathhouses with full hot-cold circuits, long-running women-only wellness venues, traditional Russian banyas, and Middle Eastern hammams. The best one depends on whether you prioritize social atmosphere, treatments, or traditional bathing.",
      },
      {
        q: "Are there hammams in Toronto?",
        a: "Yes — Toronto has several Middle Eastern and North African hammams offering traditional steam rooms, scrub and soap treatments, and rest areas. These are distinct from Russian banyas or Finnish saunas, with their own ritual around humidity and exfoliation.",
      },
      {
        q: "Are Toronto saunas coed?",
        a: "Most modern bathhouses in Toronto are coed and require a swimsuit. Korean spas, Russian banyas, and some hammams have single-gender bathing areas, often with a coed common room in jjimjilbang-style attire.",
      },
      {
        q: "What should I bring to a sauna in Toronto?",
        a: "Bring a swimsuit, flip-flops, a water bottle, and a sauna hat to keep your head cooler during longer sessions. Most Toronto venues provide towels and robes.",
      },
    ],
  },

  all: {
    intro: [
      "Koriboshi Sauna Finder catalogs the best saunas and bathhouses across major US and Canadian cities, from traditional Russian banyas and Korean jjimjilbangs to Japanese onsen, Finnish wood saunas, and modern Nordic contrast bathing studios. Each listing includes location, price range, amenities, ratings, and the type of bathing tradition it offers.",
      "North America's sauna landscape has expanded rapidly in the last decade. Cities like Minneapolis, Seattle, and Portland lean into Nordic heritage; NYC, LA, and Toronto lead on Korean spa culture; and newer social bathhouses now exist in nearly every major metro. Browse by city below or filter by type to find your next session.",
    ],
    faqs: [
      {
        q: "How much does a sauna session typically cost in North America?",
        a: "Sauna day passes across North American cities generally range from $30 to $100. Korean spas and mobile wood-fired saunas sit at the lower end, while modern social bathhouses and destination Nordic spas occupy the top of the range.",
      },
      {
        q: "What's the difference between a Korean spa, Russian banya, and Finnish sauna?",
        a: "A Korean spa (jjimjilbang) is a multi-room complex with themed heated rooms, pools, and a coed common area. A Russian banya is a high-temperature steam room paired with cold plunges and oak-leaf platza treatments. A Finnish sauna is a wood-lined room heated to 170–200°F where you pour water on hot stones to create löyly, humid burst heat.",
      },
      {
        q: "Do you have to be naked in a sauna?",
        a: "It depends on the venue and tradition. Korean spas, Russian banyas, and Japanese onsen typically have single-gender nude bathing areas. Modern coed bathhouses and most Finnish-style public saunas require a swimsuit. Always check the rules of the specific venue before going.",
      },
      {
        q: "What should I bring to a sauna?",
        a: "A swimsuit, flip-flops, a water bottle, and a sauna hat are the essentials. A sauna hat protects your hair and helps regulate head temperature during longer or hotter sessions — it's standard in Russian and Finnish sauna traditions. Most venues provide towels, and many provide robes and toiletries.",
      },
      {
        q: "How long should a sauna session last?",
        a: "A typical sauna round is 8–15 minutes followed by a cold plunge or cool-down of 1–3 minutes, repeated 2–4 times. Total sessions usually last 60–90 minutes. New sauna-goers should start with shorter rounds and build up over time.",
      },
    ],
  },
};

export function getCityContent(slug) {
  return CITY_CONTENT[slug] || CITY_CONTENT.all;
}

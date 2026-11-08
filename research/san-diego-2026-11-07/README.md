# San Diego sauna dataset — November 7, 2026

Countywide coverage includes San Diego city and surrounding San Diego County communities. Public access includes paid appointments, day passes, treatments, and memberships, with restrictions recorded per venue.

Rechecked 94 candidate locations against official operator pages and exact Google Places matches. Imported 91 operational locations with verified map coordinates. Three candidates were withheld: both Eco Chateau branches and The Recovery Co.; the latter has conflicting website and Places evidence and is conservatively excluded. Verification was online, not by telephone or on-site inspection. Availability can change.

The curated site displays 39 locations. Chain exclusions hide 27 records, including all 16 branches of 24 Hour Fitness removed at the user’s request. A further 25 records are hidden after comparison with the other city collections: 21 gyms or pools with incidental sauna amenities and four spas without confirmed standalone sauna admission. Dedicated recovery suites with separately bookable sauna sessions remain eligible even when hosted within a fitness studio. The underlying research is preserved; `curation.json` records each decision.

Published 63 visually reviewed venue photographs across the full researched dataset, including 13 added in a deeper second pass. Of the 39 curated visible listings, 33 have a photograph and six remain without a confidently matched image. Images may show the venue interior or exterior rather than its sauna. Sources include official operator websites, owner interviews, a branch’s chamber gallery, and location-specific local reporting. Source pages, original image URLs, review notes, attribution, and hosted URLs are recorded in `photo-sources.json`; remaining gaps and reasons are in `photo-exclusions.json`.

`locations.json` is the comprehensive dataset; `place-matches.json` records location matching evidence; `withheld.json` documents exclusions; `summary.json` records counts and validation. `changes.json` contains the publication payload. Historical November 3 price quotations are retained only as research evidence where present, not treated as newly verified prices. Public descriptions and access instructions were refreshed for visitors.

Validation: 91 researched operational records, no duplicate Place IDs, 39 curated discoverable listings, all 33 currently displayed image URLs returned valid image content, 44 regression tests passed, 335 routes prerendered before the 24 Hour Fitness exclusion, and desktop/mobile city selection checked in a browser.

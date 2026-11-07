# San Diego sauna dataset — November 7, 2026

Countywide coverage includes San Diego city and surrounding San Diego County communities. Public access includes paid appointments, day passes, treatments, and memberships, with restrictions recorded per venue.

Rechecked 94 candidate locations against official operator pages and exact Google Places matches. Imported 91 operational locations with verified map coordinates. Three candidates were withheld: both Eco Chateau branches and The Recovery Co.; the latter has conflicting website and Places evidence and is conservatively excluded. Verification was online, not by telephone or on-site inspection. Availability can change.

The site displays 80 locations. Its existing chain policy hides 11 additional records; these remain in the dataset with `visible_on_site: false`.

Added 50 visually reviewed official venue photographs. Images may show the venue interior or exterior rather than its sauna. Thirty visible listings have no approved photograph. Source pages, original image URLs, review notes, and hosted image URLs are recorded in `photo-sources.json`; rejected or unavailable sources are explained in `photo-exclusions.json`.

`locations.json` is the comprehensive dataset; `place-matches.json` records location matching evidence; `withheld.json` documents exclusions; `summary.json` records counts and validation. `changes.json` contains the publication payload. Historical November 3 price quotations are retained only as research evidence where present, not treated as newly verified prices. Public descriptions and access instructions were refreshed for visitors.

Validation: 91 active records read back from the database, no duplicate Place IDs, 80 discoverable listings, all 50 hosted image URLs returned valid image content, 44 regression tests passed, 335 routes prerendered, and desktop/mobile city selection checked in a browser.

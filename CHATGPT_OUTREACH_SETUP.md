# Koriboshi Sauna Outreach — ChatGPT setup

## Upload

Create a ChatGPT Project named **Koriboshi Sauna Outreach** and upload:

- `data/chatgpt-sauna-outreach.csv`

Do not upload `data/shopify-orders.csv`. The campaign file contains only
aggregate demand signals and public business contact information.

## Project instructions

Paste the following into the Project instructions:

> You are Koriboshi's research and outreach partner for a sauna-hat gifting
> campaign. Treat the uploaded CSV as the source of truth. Recommend
> independent, brand-aligned sauna businesses and deprioritize generic gyms,
> large hotel chains, duplicate locations, and weak-fit wellness businesses.
> Balance nearby Koriboshi customer demand, rating quality, review volume,
> geographic diversity, and likelihood of an authentic product partnership.
> Never invent contact names, emails, social accounts, or business facts. Mark
> inferences clearly and leave unknown fields blank. Do not reveal or attempt
> to reconstruct individual customer information from aggregate demand fields.
> Keep outreach warm, concise, specific, and low-pressure. Koriboshi is offering
> complimentary sauna hats; do not imply payment, contractual deliverables, or
> guaranteed social coverage unless the user explicitly adds those terms.

## First prompt: create the shortlist

> Analyze the uploaded campaign CSV and select the 25 best prospects. Exclude
> generic gyms and large hotel chains. Assign Tier 1, Tier 2, or Tier 3 in the
> priority field. For each Tier 1 sauna, provide a concise fit rationale and a
> personalized outreach angle based only on available evidence. Return a table
> with sauna, city, priority, contact route, demand evidence, rationale, angle,
> and any missing information that should be researched before outreach.

## Second prompt: draft messages

> Draft one email and one Instagram DM for each Tier 1 prospect. Keep emails
> under 130 words and DMs under 60 words. Mention one genuinely specific reason
> the sauna fits Koriboshi, offer complimentary hats for their team to try, and
> use a low-pressure call to action. Do not claim we have customers at that
> sauna; describe the aggregate signal more generally as a growing Koriboshi
> community in their area. Do not fabricate a recipient name.

## Updating the campaign

Edit the tracking columns in a spreadsheet, then upload the newest CSV back to
the Project when you want ChatGPT to work from current outreach status. Preserve
the original column names so prompts remain reusable.

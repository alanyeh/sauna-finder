-- Preserve current records; future imports start in the review queue.
BEGIN;
ALTER TABLE public.saunas
  ADD COLUMN IF NOT EXISTS listing_status text NOT NULL DEFAULT 'active'
    CHECK (listing_status IN ('active', 'review', 'hidden', 'duplicate', 'seasonal_closed')),
  ADD COLUMN IF NOT EXISTS access_policy text NOT NULL DEFAULT 'unknown'
    CHECK (access_policy IN ('unknown', 'public', 'day_pass', 'treatment', 'guests_only', 'members_only')),
  ADD COLUMN IF NOT EXISTS access_source_url text,
  ADD COLUMN IF NOT EXISTS access_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_notes text,
  ADD COLUMN IF NOT EXISTS sauna_source_url text,
  ADD COLUMN IF NOT EXISTS sauna_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS duplicate_of bigint REFERENCES public.saunas(id);
ALTER TABLE public.saunas ALTER COLUMN listing_status SET DEFAULT 'review';
COMMENT ON COLUMN public.saunas.access_policy IS 'Applies to sauna access, not pool passes or hotel amenities generally. Public access requires a source URL and checked date.';
COMMENT ON COLUMN public.saunas.listing_status IS 'Reversible publication decision. Review, hidden, duplicate and seasonal_closed records are retained but excluded from public discovery.';
-- Keep admin review access while preventing public queries from returning
-- unpublished listings. Publication decisions are admin-only.
DROP POLICY IF EXISTS "Anyone can read saunas" ON public.saunas;
DROP POLICY IF EXISTS "Public discovery and admin review" ON public.saunas;
CREATE POLICY "Public discovery and admin review" ON public.saunas FOR SELECT TO anon, authenticated
USING (
  lower(coalesce(auth.jwt()->>'email', '')) = 'alnyeh@gmail.com'
  OR (
    listing_status = 'active'
    AND (
      NOT ('Hotel Spa' = ANY(coalesce(types, '{}'::text[])) OR name ~* '\m(hotel|resort)\M')
      OR (access_policy IN ('public', 'day_pass', 'treatment')
          AND access_source_url ~ '^https?://' AND access_checked_at IS NOT NULL
          AND sauna_source_url ~ '^https?://' AND sauna_checked_at IS NOT NULL)
    )
  )
);
DROP POLICY IF EXISTS "Allow authenticated users to update photos" ON public.saunas;
DROP POLICY IF EXISTS "Admin updates listings" ON public.saunas;
CREATE POLICY "Admin updates listings" ON public.saunas FOR UPDATE TO authenticated
USING (lower(coalesce(auth.jwt()->>'email', '')) = 'alnyeh@gmail.com')
WITH CHECK (lower(coalesce(auth.jwt()->>'email', '')) = 'alnyeh@gmail.com');
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.saunas;
DROP POLICY IF EXISTS "Submit for review or admin insert" ON public.saunas;
CREATE POLICY "Submit for review or admin insert" ON public.saunas FOR INSERT TO authenticated
WITH CHECK (
  lower(coalesce(auth.jwt()->>'email', '')) = 'alnyeh@gmail.com'
  OR (listing_status = 'review' AND access_policy = 'unknown'
      AND access_source_url IS NULL AND access_checked_at IS NULL
      AND sauna_source_url IS NULL AND sauna_checked_at IS NULL
      AND duplicate_of IS NULL)
);
NOTIFY pgrst, 'reload schema';
COMMIT;

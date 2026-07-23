-- Add optional onboarding link / detail fields used by Phase 3 step 3
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS linkedin_profile text,
  ADD COLUMN IF NOT EXISTS business_details text;

COMMENT ON COLUMN public.profiles.instagram_handle IS 'Optional Instagram handle from onboarding';
COMMENT ON COLUMN public.profiles.linkedin_profile IS 'Optional LinkedIn profile/path from onboarding';
COMMENT ON COLUMN public.profiles.business_details IS 'Optional free-text business details from onboarding';

-- Wire real thumbnail images into the ethnicity step's Indian/Foreigner
-- options across all 12 templates that have it (steps[0] = ethnicity,
-- options[0] = indian, options[1] = foreigner — consistent shape across
-- every one of them since they were all seeded together).

UPDATE public.templates
SET remix_steps = jsonb_set(
  jsonb_set(
    remix_steps,
    '{steps,0,options,0,thumbnailUrl}',
    '"https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/nationality/Indian/Indian%20Girl.png"'::jsonb
  ),
  '{steps,0,options,1,thumbnailUrl}',
  '"https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/nationality/Foreigner/Foreigner_girl.png"'::jsonb
)
WHERE remix_steps -> 'steps' -> 0 ->> 'id' = 'ethnicity';

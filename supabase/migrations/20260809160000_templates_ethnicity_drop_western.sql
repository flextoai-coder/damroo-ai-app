-- Drop the "(Western)" qualifier from the ethnicity step's "Foreigner"
-- option across all 12 templates that have it (steps[0] = ethnicity,
-- options[1] = foreigner, consistent across every one of them since they
-- were all seeded from the same step shape).

UPDATE public.templates
SET remix_steps = jsonb_set(
  remix_steps,
  '{steps,0,options,1}',
  '{"id": "foreigner", "label": "Foreigner", "promptFragment": "Foreign"}'::jsonb
)
WHERE remix_steps -> 'steps' -> 0 ->> 'id' = 'ethnicity';

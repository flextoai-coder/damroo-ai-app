-- "Model Holding the Product" originally had a "Hands close-up" pose option
-- that cropped the face out entirely ("a close-up crop on just the hands
-- holding the product"). Every pose in this template should keep the
-- model's face in frame, so this swaps it for a tight half-body portrait
-- that still shows both the face and the product.

UPDATE public.templates
SET remix_steps = jsonb_set(
  remix_steps,
  '{steps,2,options,1}',
  '{"id": "closeup", "label": "Close portrait", "promptFragment": "a tight half-body portrait with the product held just below their face, both the model''s face and the product in sharp focus"}'::jsonb
)
WHERE title = 'Model Holding the Product';

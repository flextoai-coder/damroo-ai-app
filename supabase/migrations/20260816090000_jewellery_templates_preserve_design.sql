-- Jewellery templates were letting the model reinterpret the attached
-- piece's design freely. Every jewellery template's base_prompt now
-- explicitly instructs the model to keep the attached jewellery's exact
-- design/shape/details unchanged, matching how product photography
-- templates are meant to behave (the jewellery is the real product being
-- sold, not a starting point for reinterpretation).
UPDATE public.templates
SET base_prompt = 'The attached {jewellery_type}, keeping its exact design, shape, and details unchanged, presented in an open velvet gift box, dramatic spotlight, rich dark backdrop, luxury jewellery advertisement style, macro detail.'
WHERE id = '0eb59ab6-3240-4bbd-b41a-8e81848a4b99'; -- Velvet Box Reveal

UPDATE public.templates
SET base_prompt = 'A {ethnicity} {gender} bridal model wearing the attached jewellery piece, keeping its exact design, shape, and details unchanged, {pose}, {background}, soft romantic lighting, luxury bridal campaign photography, high detail.'
WHERE id = '6c59f7d2-fea5-4916-a0ce-c202b3ddbe8d'; -- Bridal Jewellery Campaign

UPDATE public.templates
SET base_prompt = 'A {ethnicity} {gender} hand model wearing the attached jewellery piece, keeping its exact design, shape, and details unchanged, {pose}, resting on a {background}, macro luxury product photography, soft directional lighting.'
WHERE id = '351ec6d9-54bb-47b3-ace6-4599386ed3cc'; -- Hand Model Wearing Jewellery

UPDATE public.templates
SET base_prompt = 'The attached jewellery piece, keeping its exact design, shape, and details unchanged, presented beside an open luxury gift box with ribbon, elegant neutral backdrop, soft studio lighting, premium gifting advertisement style.'
WHERE id = '6d63f5bf-5c9b-4717-ae7d-eb901ebf6fdb'; -- Luxury Gift Box Presentation

UPDATE public.templates
SET base_prompt = 'A {subject} wearing the attached jewellery piece, keeping its exact design, shape, and details unchanged, {pose}, camera angle {angle}, {background}, luxury jewellery campaign photography, soft directional lighting, high detail on metal and gemstone texture.'
WHERE id = '0ba16b69-d046-46c3-92f5-0589b52ad9b7'; -- Adorned Elegance Portrait

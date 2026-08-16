-- Upgrades the jewellery template catalog:
-- 1. Strengthens the "preserve design" clause everywhere (exact design,
--    shape, metal tone, gemstones, engravings, finish — not just a generic
--    "design, shape, and details").
-- 2. "Adorned Elegance Portrait"'s "Display mannequin" option was hardcoded
--    to always say "a display bust mannequin" regardless of what the
--    attached jewellery actually is — wrong for earrings/bracelets/rings.
--    It now instructs the model to identify the jewellery's type from the
--    reference image and choose the matching display prop (bust mannequin
--    for necklace/pendant, cushion draping for bracelet, SS hanger stand
--    for earrings, display stand for ring). base_prompt is restructured so
--    the subject/verb clause ("wearing"/"showcasing") lives inside each
--    option's own promptFragment instead of the shared template, since a
--    mannequin/cushion doesn't grammatically "wear" jewellery.
-- 3. "Luxury Gift Box Presentation" had no display-prop guidance at all
--    (remix_steps is null, single one-tap remix) — same type-identification
--    instruction added directly to its base_prompt.
-- "Velvet Box Reveal" already has a well-designed, user-selected
-- `jewellery_type` step with per-type positioning — only its preserve-clause
-- wording is strengthened here, no structural change needed.

UPDATE public.templates
SET base_prompt = 'The attached {jewellery_type}, preserving every intrinsic detail — exact design, shape, metal tone, gemstones, engravings, and finish — unchanged, presented in an open velvet gift box, dramatic spotlight, rich dark backdrop, luxury jewellery advertisement style, macro detail.'
WHERE id = '0eb59ab6-3240-4bbd-b41a-8e81848a4b99'; -- Velvet Box Reveal

UPDATE public.templates
SET base_prompt = 'A {ethnicity} {gender} bridal model wearing the attached jewellery piece, preserving every intrinsic detail — exact design, shape, metal tone, gemstones, engravings, and finish — unchanged, {pose}, {background}, soft romantic lighting, luxury bridal campaign photography, high detail.'
WHERE id = '6c59f7d2-fea5-4916-a0ce-c202b3ddbe8d'; -- Bridal Jewellery Campaign

UPDATE public.templates
SET base_prompt = 'A {ethnicity} {gender} hand model wearing the attached jewellery piece, preserving every intrinsic detail — exact design, shape, metal tone, gemstones, engravings, and finish — unchanged, {pose}, resting on a {background}, macro luxury product photography, soft directional lighting.'
WHERE id = '351ec6d9-54bb-47b3-ace6-4599386ed3cc'; -- Hand Model Wearing Jewellery

UPDATE public.templates
SET base_prompt = 'The attached jewellery piece, preserving every intrinsic detail — exact design, shape, metal tone, gemstones, engravings, and finish — unchanged, displayed appropriately for its type: identify from the reference image whether it is a necklace, pendant, bracelet, earrings, or ring, then present it draped elegantly for a necklace or pendant, coiled or gently cushioned for a bracelet, propped upright side-by-side for earrings, or nestled upright for a ring — positioned beside an open luxury gift box with ribbon, elegant neutral backdrop, soft studio lighting, premium gifting advertisement style.'
WHERE id = '6d63f5bf-5c9b-4717-ae7d-eb901ebf6fdb'; -- Luxury Gift Box Presentation

UPDATE public.templates
SET
  base_prompt = '{subject}, preserving every intrinsic detail — exact design, shape, metal tone, gemstones, engravings, and finish — unchanged, {pose}, camera angle {angle}, {background}, luxury jewellery campaign photography, soft directional lighting, high detail on metal and gemstone texture.',
  remix_steps = jsonb_set(
    remix_steps,
    '{steps,0,options}',
    '[
      {"id":"female_model","label":"Female model","promptFragment":"An elegant female model wearing the attached jewellery piece","thumbnailUrl":"https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"},
      {"id":"male_model","label":"Male model","promptFragment":"A refined male model wearing the attached jewellery piece","thumbnailUrl":"https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"},
      {"id":"mannequin","label":"Display mannequin","promptFragment":"A display prop matched to the attached jewellery''s type — identified from the reference image as a necklace, pendant, bracelet, earrings, or ring — using a bust-style mannequin or dress form for a necklace or pendant, a velvet cushion with gentle draping for a bracelet, a stainless steel earring hanger stand for earrings, or an upright display stand or cushion for a ring — showcasing the attached jewellery piece","thumbnailUrl":"https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/Mannequin/jewellery_mannequin.png"}
    ]'::jsonb
  )
WHERE id = '0ba16b69-d046-46c3-92f5-0589b52ad9b7'; -- Adorned Elegance Portrait

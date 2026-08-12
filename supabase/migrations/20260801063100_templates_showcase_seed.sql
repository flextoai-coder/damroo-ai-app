-- New showcase templates: Clothing (model/mannequin shoot), Restaurant (cinematic dish
-- reveal), Jewellery (model/mannequin portrait), Clothing (hanging display). Only
-- "background" steps attach a reference image -- subject/pose/vessel/angle selections
-- are prompt-text only, matching the normalized rule applied in the prior migration.
-- Preview/thumbnail URLs reuse the same verified-valid Unsplash photo IDs already used
-- elsewhere in the seed catalog -- placeholder photography, swap for real assets before
-- production.
INSERT INTO public.templates (
  title, industry, category, source, preview_storage_path, base_prompt,
  default_aspect_ratio, default_quality, is_published, sort_order, remix_steps
) VALUES
(
  'Editorial Wearable Showcase',
  'Clothing',
  'products',
  'official',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
  'A {subject}, {pose}, {background}, high-fashion product photography, sharp focus on garment texture and fabric detail, professional studio-grade lighting.',
  '4:5', '2K', true, 370,
  '{
    "version": 1,
    "steps": [
      { "id": "subject", "title": "Choose how to showcase it",
        "options": [
          { "id": "female_model", "label": "Female model", "promptFragment": "a female model wearing the attached wearable",
            "thumbnailUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80" },
          { "id": "male_model", "label": "Male model", "promptFragment": "a male model wearing the attached wearable",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" },
          { "id": "female_mannequin", "label": "Female mannequin", "promptFragment": "a female-form mannequin dressed in the attached wearable",
            "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80" },
          { "id": "male_mannequin", "label": "Male mannequin", "promptFragment": "a male-form mannequin dressed in the attached wearable",
            "thumbnailUrl": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" }
        ] },
      { "id": "pose", "title": "Choose a pose",
        "options": [
          { "id": "standing", "label": "Standing tall", "promptFragment": "standing tall in a confident straight-on stance",
            "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
          { "id": "walking", "label": "Walking stride", "promptFragment": "captured mid-stride walking toward camera",
            "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80" },
          { "id": "hip", "label": "Hand on hip", "promptFragment": "relaxed pose with one hand resting on the hip",
            "thumbnailUrl": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&q=80" }
        ] },
      { "id": "background", "title": "Choose a backdrop",
        "options": [
          { "id": "studio", "label": "Minimal studio", "promptFragment": "seamless white minimal studio backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80",
            "attachAsReference": true },
          { "id": "urban", "label": "Outdoor urban", "promptFragment": "outdoor urban street backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80",
            "attachAsReference": true },
          { "id": "boutique", "label": "Boutique interior", "promptFragment": "elegant boutique interior backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80",
            "attachAsReference": true }
        ] }
    ]
  }'::jsonb
),
(
  'Cinematic Dish Reveal',
  'Restaurant',
  'products',
  'official',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
  'A cinematic portrait-style shot of the dish served on {vessel}, camera positioned {angle}, set against {background}, mouth-watering food photography, rich textures, natural steam and garnish detail, shallow depth of field.',
  '4:5', '2K', true, 380,
  '{
    "version": 1,
    "steps": [
      { "id": "vessel", "title": "Choose a serving style",
        "options": [
          { "id": "tray", "label": "Tray", "promptFragment": "a rustic wooden serving tray",
            "thumbnailUrl": "https://images.unsplash.com/photo-1583225214464-929dd8b97c87?w=400&q=80" },
          { "id": "ceramic", "label": "Ceramic plate", "promptFragment": "a matte ceramic plate",
            "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80" },
          { "id": "glass", "label": "Glass plate", "promptFragment": "a clear glass plate",
            "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80" },
          { "id": "slate", "label": "Slate stone", "promptFragment": "a dark slate stone board",
            "thumbnailUrl": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" }
        ] },
      { "id": "angle", "title": "Choose a camera angle",
        "options": [
          { "id": "above", "label": "Slightly above", "promptFragment": "just above the horizon of the dish",
            "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
          { "id": "topdown", "label": "Top-down", "promptFragment": "directly overhead in a top-down flat lay angle",
            "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80" },
          { "id": "eyelevel", "label": "Eye-level", "promptFragment": "at eye-level for an intimate close-up",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" }
        ] },
      { "id": "background", "title": "Choose a backdrop",
        "options": [
          { "id": "wood", "label": "Rustic wood table", "promptFragment": "a rustic dark wood table",
            "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80",
            "attachAsReference": true },
          { "id": "marble", "label": "Marble surface", "promptFragment": "a polished marble surface",
            "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&q=80",
            "attachAsReference": true },
          { "id": "moody", "label": "Dark moody", "promptFragment": "a dark moody backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80",
            "attachAsReference": true }
        ] }
    ]
  }'::jsonb
),
(
  'Adorned Elegance Portrait',
  'Jewellery',
  'products',
  'official',
  'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&q=80',
  'A {subject} wearing the attached jewellery piece, {pose}, camera angle {angle}, {background}, luxury jewellery campaign photography, soft directional lighting, high detail on metal and gemstone texture.',
  '4:5', '2K', true, 390,
  '{
    "version": 1,
    "steps": [
      { "id": "subject", "title": "Choose how to showcase it",
        "options": [
          { "id": "female_model", "label": "Female model", "promptFragment": "an elegant female model",
            "thumbnailUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80" },
          { "id": "male_model", "label": "Male model", "promptFragment": "a refined male model",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" },
          { "id": "mannequin", "label": "Display mannequin", "promptFragment": "a display bust mannequin",
            "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80" }
        ] },
      { "id": "pose", "title": "Choose a pose",
        "options": [
          { "id": "closeup", "label": "Close-up portrait", "promptFragment": "close-up portrait pose highlighting the jewellery",
            "thumbnailUrl": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" },
          { "id": "candid", "label": "Candid gesture", "promptFragment": "candid gesture with hand raised gently toward the face",
            "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80" },
          { "id": "profile", "label": "Profile turn", "promptFragment": "a soft profile turn showcasing the piece",
            "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" }
        ] },
      { "id": "angle", "title": "Choose a camera angle",
        "options": [
          { "id": "eyelevel", "label": "Eye-level", "promptFragment": "eye-level close-up",
            "thumbnailUrl": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&q=80" },
          { "id": "macro", "label": "Macro detail", "promptFragment": "macro detail shot",
            "thumbnailUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80" },
          { "id": "threequarter", "label": "Three-quarter", "promptFragment": "three-quarter angle",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" }
        ] },
      { "id": "background", "title": "Choose a backdrop",
        "options": [
          { "id": "velvet", "label": "Velvet backdrop", "promptFragment": "a rich velvet backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80",
            "attachAsReference": true },
          { "id": "bokeh", "label": "Soft bokeh studio", "promptFragment": "a soft bokeh studio backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1583225214464-929dd8b97c87?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1583225214464-929dd8b97c87?w=1200&q=80",
            "attachAsReference": true },
          { "id": "silk", "label": "Silk drape", "promptFragment": "a draped silk fabric backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&q=80",
            "attachAsReference": true }
        ] }
    ]
  }'::jsonb
),
(
  'Boutique Hanger Display',
  'Clothing',
  'products',
  'official',
  'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&q=80',
  'The attached wearable displayed hanging neatly against {background}, clean product photography, soft even lighting, sharp focus on fabric texture and stitching detail, no model.',
  '1:1', '2K', true, 400,
  '{
    "version": 1,
    "steps": [
      { "id": "background", "title": "Choose a backdrop",
        "options": [
          { "id": "wall", "label": "Minimal white wall", "promptFragment": "a minimal white wall",
            "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80",
            "attachAsReference": true },
          { "id": "rail", "label": "Boutique rail", "promptFragment": "a boutique clothing rail",
            "thumbnailUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80",
            "attachAsReference": true },
          { "id": "wooden", "label": "Wooden hanger stand", "promptFragment": "a wooden hanger stand",
            "thumbnailUrl": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80",
            "attachAsReference": true },
          { "id": "outdoor", "label": "Outdoor clothesline", "promptFragment": "an outdoor clothesline",
            "thumbnailUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80",
            "attachAsReference": true }
        ] }
    ]
  }'::jsonb
);

-- Broader demo catalog: 4 template ideas per industry (Cafe/Restaurant, Footwear,
-- Clothing, Home Decor, Jewellery, Beauty). Only templates that inherently feature
-- a person (chef, model, hand model, ...) get a remix_steps wizard (gender -> pose
-- -> background); pure product/scene shots remix directly, same as the existing
-- catalog. Preview/thumbnail URLs reuse the same verified-valid Unsplash photo IDs
-- already used elsewhere in the seed catalog purely so images resolve during
-- testing -- placeholder photography, not real shots, swap before production.
INSERT INTO public.templates (
  title, industry, category, source, preview_storage_path, base_prompt,
  default_aspect_ratio, default_quality, is_published, sort_order, remix_steps
) VALUES
-- ===== Cafe / Restaurants =====
(
  'Floating Hero Dish Splash',
  'Restaurant',
  'products',
  'official',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
  'Dramatic floating hero dish shot for a restaurant menu — the plated dish suspended mid-air with fresh ingredients and sauce splashing around it, dark moody backdrop, professional food photography, high detail, studio lighting.',
  '4:5', '2K', true, 130, NULL
),
(
  'Coffee Steam Cinematic Shot',
  'Cafe',
  'products',
  'official',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  'Cinematic close-up of a coffee cup with rising steam swirling in dramatic side lighting, dark moody background, rich coffee tones, professional beverage photography, shallow depth of field.',
  '1:1', '2K', true, 140, NULL
),
(
  'Chef Serving the Signature Dish',
  'Restaurant',
  'products',
  'official',
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'A {gender} chef in a professional uniform presenting the signature dish, {pose}, {background}, warm editorial restaurant photography, appetizing lighting, high detail.',
  '4:5', '2K', true, 150,
  '{
    "version": 1,
    "steps": [
      { "id": "gender", "title": "Choose a chef",
        "options": [
          { "id": "female", "label": "Female", "promptFragment": "female chef",
            "thumbnailUrl": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" },
          { "id": "male", "label": "Male", "promptFragment": "male chef",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" }
        ] },
      { "id": "pose", "title": "Choose a pose",
        "options": [
          { "id": "plating", "label": "Plating", "promptFragment": "carefully plating the final touch",
            "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&q=80",
            "attachAsReference": true },
          { "id": "presenting", "label": "Presenting", "promptFragment": "proudly presenting the finished plate to camera",
            "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80" }
        ] },
      { "id": "background", "title": "Choose a setting",
        "options": [
          { "id": "kitchen", "label": "Open kitchen", "promptFragment": "busy open kitchen backdrop with warm ambient light",
            "thumbnailUrl": "https://images.unsplash.com/photo-1583225214464-929dd8b97c87?w=400&q=80" },
          { "id": "dining", "label": "Dining room", "promptFragment": "elegant dining room backdrop with soft candlelight",
            "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80" }
        ] }
    ]
  }'::jsonb
),
(
  'Minimal Pastel Menu Poster',
  'Cafe',
  'products',
  'official',
  'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&q=80',
  'Minimal pastel-toned menu poster for a cafe — clean typography, soft pastel color palette, elegant spacing, a single hero menu item illustration, modern boutique cafe aesthetic.',
  '1:1', '2K', true, 160, NULL
),
-- ===== Footwear =====
(
  'Shoe Floating Dust Explosion',
  'Footwear',
  'products',
  'official',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
  'Dynamic product shot of the attached shoe floating mid-air with a colorful dust and powder explosion around it, dark studio background, dramatic rim lighting, high-energy sneaker advertisement style.',
  '1:1', '2K', true, 170, NULL
),
(
  'Streetwear Urban Graffiti Shot',
  'Footwear',
  'products',
  'official',
  'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&q=80',
  'A {gender} model wearing the attached shoes in an urban streetwear outfit, {pose}, standing against a {background}, gritty street photography style, natural daylight, high detail.',
  '4:5', '2K', true, 180,
  '{
    "version": 1,
    "steps": [
      { "id": "gender", "title": "Choose a model",
        "options": [
          { "id": "female", "label": "Female", "promptFragment": "female",
            "thumbnailUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80" },
          { "id": "male", "label": "Male", "promptFragment": "male",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
            "attachAsReference": true }
        ] },
      { "id": "pose", "title": "Choose a pose",
        "options": [
          { "id": "leaning", "label": "Leaning", "promptFragment": "casually leaning against the wall",
            "thumbnailUrl": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&q=80" },
          { "id": "walking", "label": "Walking", "promptFragment": "mid-stride walking toward camera",
            "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
            "attachAsReference": true }
        ] },
      { "id": "background", "title": "Choose a background",
        "options": [
          { "id": "graffiti", "label": "Graffiti wall", "promptFragment": "colorful graffiti-covered brick wall",
            "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80" },
          { "id": "alley", "label": "Urban alley", "promptFragment": "moody urban alleyway",
            "thumbnailUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80" }
        ] }
    ]
  }'::jsonb
),
(
  'Monochrome Premium Catalog Shot',
  'Footwear',
  'products',
  'official',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
  'Premium monochrome catalog shot of the attached shoe on a seamless grey backdrop, crisp studio lighting, sharp product detail, minimal luxury aesthetic, e-commerce ready.',
  '1:1', '2K', true, 190, NULL
),
(
  'Waterproof Water Splash Showcase',
  'Footwear',
  'products',
  'official',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  'Action product shot of the attached shoe with dynamic water splashing around it to showcase waterproof performance, dark dramatic background, frozen high-speed water droplets, studio lighting.',
  '1:1', '2K', true, 200, NULL
),
-- ===== Clothing =====
(
  'Fashion Magazine Cover',
  'Clothing',
  'products',
  'official',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
  'A {gender} model wearing the attached garment styled for a high-fashion magazine cover, {pose}, {background}, editorial studio lighting, glossy premium fashion photography, magazine masthead space at top.',
  '4:5', '2K', true, 210,
  '{
    "version": 1,
    "steps": [
      { "id": "gender", "title": "Choose a model",
        "options": [
          { "id": "female", "label": "Female", "promptFragment": "female",
            "thumbnailUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
            "attachAsReference": true },
          { "id": "male", "label": "Male", "promptFragment": "male",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" }
        ] },
      { "id": "pose", "title": "Choose a pose",
        "options": [
          { "id": "confident", "label": "Confident", "promptFragment": "confident direct-to-camera pose",
            "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80" },
          { "id": "dynamic", "label": "Dynamic", "promptFragment": "dynamic fabric-in-motion pose",
            "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" }
        ] },
      { "id": "background", "title": "Choose a backdrop",
        "options": [
          { "id": "studio", "label": "Bold studio", "promptFragment": "bold solid color studio backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80" },
          { "id": "gradient", "label": "Editorial gradient", "promptFragment": "soft editorial gradient backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80" }
        ] }
    ]
  }'::jsonb
),
(
  'Seasonal Campaign Shoot',
  'Clothing',
  'products',
  'official',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  'A {gender} model wearing the attached garment for a {background} seasonal campaign, {pose}, natural outdoor lighting, lifestyle fashion photography, high detail.',
  '4:5', '2K', true, 220,
  '{
    "version": 1,
    "steps": [
      { "id": "gender", "title": "Choose a model",
        "options": [
          { "id": "female", "label": "Female", "promptFragment": "female",
            "thumbnailUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80" },
          { "id": "male", "label": "Male", "promptFragment": "male",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" }
        ] },
      { "id": "pose", "title": "Choose a pose",
        "options": [
          { "id": "walking", "label": "Walking", "promptFragment": "relaxed walking pose",
            "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
          { "id": "sitting", "label": "Sitting", "promptFragment": "relaxed seated pose",
            "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80" }
        ] },
      { "id": "background", "title": "Choose a season",
        "options": [
          { "id": "summer", "label": "Summer", "promptFragment": "bright summer beach",
            "thumbnailUrl": "https://images.unsplash.com/photo-1583225214464-929dd8b97c87?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1583225214464-929dd8b97c87?w=1200&q=80",
            "attachAsReference": true },
          { "id": "winter", "label": "Winter", "promptFragment": "snowy winter street",
            "thumbnailUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80" }
        ] }
    ]
  }'::jsonb
),
(
  'Flat-Lay With Matching Accessories',
  'Clothing',
  'products',
  'official',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  'Elegant flat-lay of the attached garment styled with matching accessories — shoes, bag, jewellery — arranged on a neutral textured surface, soft overhead lighting, editorial styling, top-down view.',
  '1:1', '2K', true, 230, NULL
),
(
  'Lifestyle Coffee Shop Outfit Scene',
  'Clothing',
  'products',
  'official',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  'A {gender} model wearing the attached garment in a cozy coffee shop setting, {pose}, {background}, natural window light, candid lifestyle fashion photography.',
  '4:5', '2K', true, 240,
  '{
    "version": 1,
    "steps": [
      { "id": "gender", "title": "Choose a model",
        "options": [
          { "id": "female", "label": "Female", "promptFragment": "female",
            "thumbnailUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80" },
          { "id": "male", "label": "Male", "promptFragment": "male",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" }
        ] },
      { "id": "pose", "title": "Choose a pose",
        "options": [
          { "id": "sipping", "label": "Sipping coffee", "promptFragment": "sitting and sipping a coffee",
            "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
            "attachAsReference": true },
          { "id": "standing", "label": "At the counter", "promptFragment": "standing by the counter, relaxed pose",
            "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80" }
        ] },
      { "id": "background", "title": "Choose a backdrop",
        "options": [
          { "id": "window", "label": "Window table", "promptFragment": "sunlit window-side table",
            "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80" },
          { "id": "counter", "label": "Counter", "promptFragment": "rustic wooden counter backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1583225214464-929dd8b97c87?w=400&q=80" }
        ] }
    ]
  }'::jsonb
),
-- ===== Home Decor =====
(
  'Luxury Living Room Showcase',
  'Home Decor',
  'products',
  'official',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  'The attached decor product staged in a luxury living room — plush furniture, warm ambient lighting, tasteful styling, high-end interior photography, magazine-quality composition.',
  '4:5', '2K', true, 250, NULL
),
(
  'Boho Aesthetic Setup',
  'Home Decor',
  'products',
  'official',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
  'The attached decor product styled in a boho aesthetic setting — natural textures, woven materials, warm earthy tones, soft daylight, relaxed bohemian interior styling.',
  '4:5', '2K', true, 260, NULL
),
(
  'Festive Decorated Home',
  'Home Decor',
  'festival',
  'official',
  'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80',
  'The attached decor product showcased in a festively decorated home — string lights, seasonal ornaments, warm celebratory glow, cozy festive interior photography.',
  '4:5', '2K', true, 270, NULL
),
(
  'Floating Décor With Shadows',
  'Home Decor',
  'products',
  'official',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
  'The attached decor product floating against a soft neutral backdrop with elegant long shadows, clean minimal styling, premium product photography, subtle gradient lighting.',
  '1:1', '2K', true, 280, NULL
),
-- ===== Jewellery =====
(
  'Velvet Box Reveal',
  'Jewellery',
  'products',
  'official',
  'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&q=80',
  'The attached jewellery piece presented in an open velvet gift box, dramatic spotlight, rich dark backdrop, luxury jewellery advertisement style, macro detail.',
  '1:1', '2K', true, 290, NULL
),
(
  'Bridal Jewellery Campaign',
  'Jewellery',
  'products',
  'official',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
  'A {gender} bridal model wearing the attached jewellery piece, {pose}, {background}, soft romantic lighting, luxury bridal campaign photography, high detail.',
  '4:5', '2K', true, 300,
  '{
    "version": 1,
    "steps": [
      { "id": "gender", "title": "Choose a look",
        "options": [
          { "id": "bride", "label": "Bride", "promptFragment": "elegant bride",
            "thumbnailUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
            "attachAsReference": true },
          { "id": "groom", "label": "Groom", "promptFragment": "elegant groom",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" }
        ] },
      { "id": "pose", "title": "Choose a pose",
        "options": [
          { "id": "closeup", "label": "Close-up portrait", "promptFragment": "close-up portrait pose highlighting the jewellery",
            "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80" },
          { "id": "candid", "label": "Candid moment", "promptFragment": "candid joyful moment pose",
            "thumbnailUrl": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" }
        ] },
      { "id": "background", "title": "Choose a backdrop",
        "options": [
          { "id": "floral", "label": "Floral", "promptFragment": "soft floral bridal backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1583225214464-929dd8b97c87?w=400&q=80" },
          { "id": "silk", "label": "Golden silk", "promptFragment": "golden silk fabric backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80" }
        ] }
    ]
  }'::jsonb
),
(
  'Hand Model Wearing Jewellery',
  'Jewellery',
  'products',
  'official',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  'A {gender} hand model wearing the attached jewellery piece, {pose}, resting on a {background}, macro luxury product photography, soft directional lighting.',
  '1:1', '2K', true, 310,
  '{
    "version": 1,
    "steps": [
      { "id": "gender", "title": "Choose a hand model",
        "options": [
          { "id": "female", "label": "Female", "promptFragment": "elegant female hand",
            "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80" },
          { "id": "male", "label": "Male", "promptFragment": "refined male hand",
            "thumbnailUrl": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" }
        ] },
      { "id": "pose", "title": "Choose a pose",
        "options": [
          { "id": "ringclose", "label": "Ring close-up", "promptFragment": "close-up finger pose highlighting a ring",
            "thumbnailUrl": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200&q=80",
            "attachAsReference": true },
          { "id": "wristdrape", "label": "Wrist drape", "promptFragment": "relaxed wrist drape highlighting a bracelet",
            "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80" }
        ] },
      { "id": "background", "title": "Choose a surface",
        "options": [
          { "id": "marble", "label": "Marble", "promptFragment": "polished marble surface",
            "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80" },
          { "id": "silk", "label": "Draped silk", "promptFragment": "draped silk fabric",
            "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80" }
        ] }
    ]
  }'::jsonb
),
(
  'Luxury Gift Box Presentation',
  'Jewellery',
  'products',
  'official',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
  'The attached jewellery piece presented beside an open luxury gift box with ribbon, elegant neutral backdrop, soft studio lighting, premium gifting advertisement style.',
  '1:1', '2K', true, 320, NULL
),
-- ===== Skin Care & Beauty =====
(
  'Floating Bottle Water Splash',
  'Beauty',
  'products',
  'official',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
  'The attached skincare bottle floating mid-air with a fresh water splash around it, clean white backdrop, bright studio lighting, crisp product photography.',
  '1:1', '2K', true, 330, NULL
),
(
  'Morning Skincare Routine',
  'Beauty',
  'products',
  'official',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  'A {gender} model applying the attached skincare product as part of a morning routine, {pose}, {background}, soft natural morning light, clean beauty photography.',
  '4:5', '2K', true, 340,
  '{
    "version": 1,
    "steps": [
      { "id": "gender", "title": "Choose a model",
        "options": [
          { "id": "female", "label": "Female", "promptFragment": "female",
            "thumbnailUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
            "attachAsReference": true },
          { "id": "male", "label": "Male", "promptFragment": "male",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" }
        ] },
      { "id": "pose", "title": "Choose a pose",
        "options": [
          { "id": "applying", "label": "Applying product", "promptFragment": "applying the product to their face",
            "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80" },
          { "id": "holding", "label": "Holding product", "promptFragment": "holding the product up to camera, smiling softly",
            "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80" }
        ] },
      { "id": "background", "title": "Choose a setting",
        "options": [
          { "id": "bathroom", "label": "Bathroom mirror", "promptFragment": "bright modern bathroom mirror",
            "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80" },
          { "id": "bedroom", "label": "Vanity", "promptFragment": "sunlit bedroom vanity",
            "thumbnailUrl": "https://images.unsplash.com/photo-1583225214464-929dd8b97c87?w=400&q=80" }
        ] }
    ]
  }'::jsonb
),
(
  'Before & After Concept',
  'Beauty',
  'products',
  'official',
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'A {gender} model''s face shown in a before-and-after skincare transformation using the attached product, {pose}, {background}, clean clinical beauty photography, split comparison composition.',
  '1:1', '2K', true, 350,
  '{
    "version": 1,
    "steps": [
      { "id": "gender", "title": "Choose a model",
        "options": [
          { "id": "female", "label": "Female", "promptFragment": "female",
            "thumbnailUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80" },
          { "id": "male", "label": "Male", "promptFragment": "male",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" }
        ] },
      { "id": "pose", "title": "Choose a focus",
        "options": [
          { "id": "closeup", "label": "Close-up face", "promptFragment": "close-up face-focused pose",
            "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80" },
          { "id": "halfbody", "label": "Half-body portrait", "promptFragment": "half-body portrait pose",
            "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" }
        ] },
      { "id": "background", "title": "Choose a backdrop",
        "options": [
          { "id": "clinical", "label": "Clinical white", "promptFragment": "clean clinical white backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80" },
          { "id": "soft", "label": "Soft bathroom", "promptFragment": "soft neutral bathroom backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80" }
        ] }
    ]
  }'::jsonb
),
(
  'Pastel Cosmetic Flat-Lay',
  'Beauty',
  'products',
  'official',
  'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&q=80',
  'Elegant flat-lay of the attached cosmetic product styled with pastel props — flowers, ribbons, soft fabric — on a light pastel surface, soft overhead lighting, top-down beauty editorial styling.',
  '1:1', '2K', true, 360, NULL
);

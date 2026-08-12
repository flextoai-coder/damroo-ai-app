-- Template prompt audit + ethnicity guided step + Grocery category templates.
--
-- 1. A handful of restaurant/cafe base_prompts didn't explicitly anchor to
--    "the attached" product, leaving room for the model to invent its own
--    dish/cup instead of using the user's uploaded product photo.
-- 2. Templates with a plain gender step gain a new "ethnicity" step, asked
--    first, so the guided flow can steer toward an Indian or Western model
--    appearance before gender/pose/background.
-- 3. Two new "Grocery" templates for packaged product showcases.

-- Floating Hero Dish Splash
UPDATE public.templates SET base_prompt = 'Dramatic floating hero dish shot for a restaurant menu — the attached plated dish suspended mid-air with fresh ingredients and sauce splashing around it, dark moody backdrop, professional food photography, high detail, studio lighting.' WHERE id = '5668115d-5c95-4549-aa93-c4647287663e';

-- Coffee Steam Cinematic Shot
UPDATE public.templates SET base_prompt = 'Cinematic close-up of the attached coffee cup with rising steam swirling in dramatic side lighting, dark moody background, rich coffee tones, professional beverage photography, shallow depth of field.' WHERE id = 'da671ef8-596d-45dc-a317-cdd24801cb23';

-- Chef Serving the Signature Dish
UPDATE public.templates SET base_prompt = 'A {ethnicity} {gender} chef in a professional uniform presenting the attached signature dish, {pose}, {background}, warm editorial restaurant photography, appetizing lighting, high detail.', remix_steps = '{"version": 1, "steps": [{"id": "ethnicity", "title": "Choose ethnicity", "subtitle": "What should the model''s ethnicity look like?", "options": [{"id": "indian", "label": "Indian", "promptFragment": "Indian"}, {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}]}, {"id": "gender", "options": [{"id": "female", "label": "Female", "promptFragment": "female", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"}, {"id": "male", "label": "Male", "promptFragment": "male", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"}], "title": "Choose a chef"}, {"id": "pose", "options": [{"id": "plating", "label": "Plating", "promptFragment": "carefully plating the final touch", "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"}, {"id": "presenting", "label": "Presenting", "promptFragment": "proudly presenting the finished plate to camera", "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"}], "title": "Choose a pose"}, {"id": "background", "options": [{"id": "kitchen", "label": "Open kitchen", "promptFragment": "busy open kitchen backdrop with warm ambient light", "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80"}, {"id": "dining", "label": "Dining room", "promptFragment": "elegant dining room backdrop with soft candlelight", "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80"}], "title": "Choose a setting"}]}'::jsonb WHERE id = 'ea704fa9-0940-441e-98eb-3a31aefbbd5c';

-- Minimal Pastel Menu Poster
UPDATE public.templates SET base_prompt = 'Minimal pastel-toned menu poster for a cafe — clean typography, soft pastel color palette, elegant spacing, a single hero illustration of the attached menu item, modern boutique cafe aesthetic.' WHERE id = '2163f431-73f4-48f7-9523-2a5f72fa6192';

-- Cinematic Dish Reveal
UPDATE public.templates SET base_prompt = 'A cinematic portrait-style shot of the attached dish served on {vessel}, camera positioned {angle}, set against {background}, mouth-watering food photography, rich textures, natural steam and garnish detail, shallow depth of field.' WHERE id = '2690a883-6353-42f8-8e0c-8f0277bbaf11';

-- Model Walking on Runway
UPDATE public.templates SET base_prompt = 'A {ethnicity} {gender} fashion model walking on a runway wearing the attached garment, {pose} stance, {background} backdrop, editorial fashion photography, dramatic lighting, high detail.', remix_steps = '{"version": 1, "steps": [{"id": "ethnicity", "title": "Choose ethnicity", "subtitle": "What should the model''s ethnicity look like?", "options": [{"id": "indian", "label": "Indian", "promptFragment": "Indian"}, {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}]}, {"id": "gender", "options": [{"id": "female", "label": "Female", "promptFragment": "female", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"}, {"id": "male", "label": "Male", "promptFragment": "male", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"}], "subtitle": "Who should wear the garment?", "title": "Choose a model"}, {"id": "pose", "options": [{"id": "walking", "label": "Walking", "promptFragment": "confident mid-stride walking", "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80"}, {"id": "static", "label": "Static pose", "promptFragment": "static hero pose", "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80"}], "title": "Choose a pose"}, {"id": "background", "options": [{"id": "runway", "label": "Runway", "promptFragment": "spotlit runway with a blurred audience", "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"}, {"id": "studio", "label": "Studio", "promptFragment": "seamless white studio backdrop", "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"}], "title": "Choose a background"}]}'::jsonb WHERE id = 'c364362c-339c-492c-90b0-e1e79259c793';

-- Athlete Mid-Air Wearing Shoes
UPDATE public.templates SET base_prompt = 'An athletic {ethnicity} {gender} model captured mid-air in a {pose} wearing the attached shoes, {background} setting, high-energy sports photography, frozen action, sharp focus.', remix_steps = '{"version": 1, "steps": [{"id": "ethnicity", "title": "Choose ethnicity", "subtitle": "What should the model''s ethnicity look like?", "options": [{"id": "indian", "label": "Indian", "promptFragment": "Indian"}, {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}]}, {"id": "gender", "options": [{"id": "female", "label": "Female", "promptFragment": "female", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"}, {"id": "male", "label": "Male", "promptFragment": "male", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"}], "title": "Choose an athlete"}, {"id": "pose", "options": [{"id": "jump", "label": "Mid-air jump", "promptFragment": "jump", "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80"}, {"id": "running", "label": "Running stride", "promptFragment": "dynamic running stride", "thumbnailUrl": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&q=80"}], "title": "Choose a pose"}, {"id": "background", "options": [{"id": "stadium", "label": "Stadium lights", "promptFragment": "stadium floodlights at night", "thumbnailUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80"}, {"id": "studio", "label": "Studio gradient", "promptFragment": "seamless studio gradient backdrop", "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80"}], "title": "Choose a background"}]}'::jsonb WHERE id = '0fa9b420-4dd0-4d53-bec7-8975112b4e9e';

-- Streetwear Urban Graffiti Shot
UPDATE public.templates SET base_prompt = 'A {ethnicity} {gender} model wearing the attached shoes in an urban streetwear outfit, {pose}, standing against a {background}, gritty street photography style, natural daylight, high detail.', remix_steps = '{"version": 1, "steps": [{"id": "ethnicity", "title": "Choose ethnicity", "subtitle": "What should the model''s ethnicity look like?", "options": [{"id": "indian", "label": "Indian", "promptFragment": "Indian"}, {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}]}, {"id": "gender", "options": [{"id": "female", "label": "Female", "promptFragment": "female", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"}, {"id": "male", "label": "Male", "promptFragment": "male", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"}], "title": "Choose a model"}, {"id": "pose", "options": [{"id": "leaning", "label": "Leaning", "promptFragment": "casually leaning against the wall", "thumbnailUrl": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&q=80"}, {"id": "walking", "label": "Walking", "promptFragment": "mid-stride walking toward camera", "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80"}], "title": "Choose a pose"}, {"id": "background", "options": [{"id": "graffiti", "label": "Graffiti wall", "promptFragment": "colorful graffiti-covered brick wall", "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80"}, {"id": "alley", "label": "Urban alley", "promptFragment": "moody urban alleyway", "thumbnailUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80"}], "title": "Choose a background"}]}'::jsonb WHERE id = '3df5f046-1f61-4734-bbfa-5964ad51f9ec';

-- Fashion Magazine Cover
UPDATE public.templates SET base_prompt = 'A {ethnicity} {gender} model wearing the attached garment styled for a high-fashion magazine cover, {pose}, {background}, editorial studio lighting, glossy premium fashion photography, magazine masthead space at top.', remix_steps = '{"version": 1, "steps": [{"id": "ethnicity", "title": "Choose ethnicity", "subtitle": "What should the model''s ethnicity look like?", "options": [{"id": "indian", "label": "Indian", "promptFragment": "Indian"}, {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}]}, {"id": "gender", "options": [{"id": "female", "label": "Female", "promptFragment": "female", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"}, {"id": "male", "label": "Male", "promptFragment": "male", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"}], "title": "Choose a model"}, {"id": "pose", "options": [{"id": "confident", "label": "Confident", "promptFragment": "confident direct-to-camera pose", "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80"}, {"id": "dynamic", "label": "Dynamic", "promptFragment": "dynamic fabric-in-motion pose", "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80"}], "title": "Choose a pose"}, {"id": "background", "options": [{"id": "studio", "label": "Bold studio", "promptFragment": "bold solid color studio backdrop", "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"}, {"id": "gradient", "label": "Editorial gradient", "promptFragment": "soft editorial gradient backdrop", "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"}], "title": "Choose a backdrop"}]}'::jsonb WHERE id = 'ac49b7f3-5d6d-4545-b79c-2d14cf51ba79';

-- Seasonal Campaign Shoot
UPDATE public.templates SET base_prompt = 'A {ethnicity} {gender} model wearing the attached garment for a {background} seasonal campaign, {pose}, natural outdoor lighting, lifestyle fashion photography, high detail.', remix_steps = '{"version": 1, "steps": [{"id": "ethnicity", "title": "Choose ethnicity", "subtitle": "What should the model''s ethnicity look like?", "options": [{"id": "indian", "label": "Indian", "promptFragment": "Indian"}, {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}]}, {"id": "gender", "options": [{"id": "female", "label": "Female", "promptFragment": "female", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"}, {"id": "male", "label": "Male", "promptFragment": "male", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"}], "title": "Choose a model"}, {"id": "pose", "options": [{"id": "walking", "label": "Walking", "promptFragment": "relaxed walking pose", "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80"}, {"id": "sitting", "label": "Sitting", "promptFragment": "relaxed seated pose", "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80"}], "title": "Choose a pose"}, {"id": "background", "options": [{"attachAsReference": true, "id": "summer", "label": "Summer", "promptFragment": "bright summer beach", "referenceImageUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80", "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80"}, {"id": "winter", "label": "Winter", "promptFragment": "snowy winter street", "thumbnailUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80"}], "title": "Choose a season"}]}'::jsonb WHERE id = '60641b22-cf4a-4f22-906c-31ca3cadb5d7';

-- Lifestyle Coffee Shop Outfit Scene
UPDATE public.templates SET base_prompt = 'A {ethnicity} {gender} model wearing the attached garment in a cozy coffee shop setting, {pose}, {background}, natural window light, candid lifestyle fashion photography.', remix_steps = '{"version": 1, "steps": [{"id": "ethnicity", "title": "Choose ethnicity", "subtitle": "What should the model''s ethnicity look like?", "options": [{"id": "indian", "label": "Indian", "promptFragment": "Indian"}, {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}]}, {"id": "gender", "options": [{"id": "female", "label": "Female", "promptFragment": "female", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"}, {"id": "male", "label": "Male", "promptFragment": "male", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"}], "title": "Choose a model"}, {"id": "pose", "options": [{"id": "sipping", "label": "Sipping coffee", "promptFragment": "sitting and sipping a coffee", "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80"}, {"id": "standing", "label": "At the counter", "promptFragment": "standing by the counter, relaxed pose", "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80"}], "title": "Choose a pose"}, {"id": "background", "options": [{"id": "window", "label": "Window table", "promptFragment": "sunlit window-side table", "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"}, {"id": "counter", "label": "Counter", "promptFragment": "rustic wooden counter backdrop", "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80"}], "title": "Choose a backdrop"}]}'::jsonb WHERE id = '4e3ce061-534d-47c4-8bf3-83fd9b22b0ef';

-- Bridal Jewellery Campaign
UPDATE public.templates SET base_prompt = 'A {ethnicity} {gender} bridal model wearing the attached jewellery piece, {pose}, {background}, soft romantic lighting, luxury bridal campaign photography, high detail.', remix_steps = '{"version": 1, "steps": [{"id": "ethnicity", "title": "Choose ethnicity", "subtitle": "What should the model''s ethnicity look like?", "options": [{"id": "indian", "label": "Indian", "promptFragment": "Indian"}, {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}]}, {"id": "gender", "options": [{"id": "bride", "label": "Bride", "promptFragment": "bride", "thumbnailUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80"}, {"id": "groom", "label": "Groom", "promptFragment": "groom", "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80"}], "title": "Choose a look"}, {"id": "pose", "options": [{"id": "closeup", "label": "Close-up portrait", "promptFragment": "close-up portrait pose highlighting the jewellery", "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80"}, {"id": "candid", "label": "Candid moment", "promptFragment": "candid joyful moment pose", "thumbnailUrl": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80"}], "title": "Choose a pose"}, {"id": "background", "options": [{"id": "floral", "label": "Floral", "promptFragment": "soft floral bridal backdrop", "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80"}, {"id": "silk", "label": "Golden silk", "promptFragment": "golden silk fabric backdrop", "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80"}], "title": "Choose a backdrop"}]}'::jsonb WHERE id = '6c59f7d2-fea5-4916-a0ce-c202b3ddbe8d';

-- Hand Model Wearing Jewellery
UPDATE public.templates SET base_prompt = 'A {ethnicity} {gender} hand model wearing the attached jewellery piece, {pose}, resting on a {background}, macro luxury product photography, soft directional lighting.', remix_steps = '{"version": 1, "steps": [{"id": "ethnicity", "title": "Choose ethnicity", "subtitle": "What should the model''s ethnicity look like?", "options": [{"id": "indian", "label": "Indian", "promptFragment": "Indian"}, {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}]}, {"id": "gender", "options": [{"id": "female", "label": "Female", "promptFragment": "elegant female", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"}, {"id": "male", "label": "Male", "promptFragment": "refined male", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"}], "title": "Choose a hand model"}, {"id": "pose", "options": [{"id": "ringclose", "label": "Ring close-up", "promptFragment": "close-up finger pose highlighting a ring", "thumbnailUrl": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&q=80"}, {"id": "wristdrape", "label": "Wrist drape", "promptFragment": "relaxed wrist drape highlighting a bracelet", "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"}], "title": "Choose a pose"}, {"id": "background", "options": [{"id": "marble", "label": "Marble", "promptFragment": "polished marble surface", "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"}, {"id": "silk", "label": "Draped silk", "promptFragment": "draped silk fabric", "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80"}], "title": "Choose a surface"}]}'::jsonb WHERE id = '351ec6d9-54bb-47b3-ace6-4599386ed3cc';

-- Morning Skincare Routine
UPDATE public.templates SET base_prompt = 'A {ethnicity} {gender} model applying the attached skincare product as part of a morning routine, {pose}, {background}, soft natural morning light, clean beauty photography.', remix_steps = '{"version": 1, "steps": [{"id": "ethnicity", "title": "Choose ethnicity", "subtitle": "What should the model''s ethnicity look like?", "options": [{"id": "indian", "label": "Indian", "promptFragment": "Indian"}, {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}]}, {"id": "gender", "options": [{"id": "female", "label": "Female", "promptFragment": "female", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"}, {"id": "male", "label": "Male", "promptFragment": "male", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"}], "title": "Choose a model"}, {"id": "pose", "options": [{"id": "applying", "label": "Applying product", "promptFragment": "applying the product to their face", "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80"}, {"id": "holding", "label": "Holding product", "promptFragment": "holding the product up to camera, smiling softly", "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80"}], "title": "Choose a pose"}, {"id": "background", "options": [{"id": "bathroom", "label": "Bathroom mirror", "promptFragment": "bright modern bathroom mirror", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/backdrops/backdrop_bathroom_mirror.png"}, {"id": "bedroom", "label": "Vanity", "promptFragment": "sunlit bedroom vanity", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/backdrops/backdrop_vanity.png"}], "title": "Choose a setting"}]}'::jsonb WHERE id = '17f99e18-2ab5-4675-8b90-22c603e525f5';

-- Before & After Concept
UPDATE public.templates SET base_prompt = 'A {ethnicity} {gender} model''s face shown in a before-and-after skincare transformation using the attached product, {pose}, {background}, clean clinical beauty photography, split comparison composition.', remix_steps = '{"version": 1, "steps": [{"id": "ethnicity", "title": "Choose ethnicity", "subtitle": "What should the model''s ethnicity look like?", "options": [{"id": "indian", "label": "Indian", "promptFragment": "Indian"}, {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}]}, {"id": "gender", "options": [{"id": "female", "label": "Female", "promptFragment": "female", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"}, {"id": "male", "label": "Male", "promptFragment": "male", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"}], "title": "Choose a model"}, {"id": "pose", "options": [{"id": "closeup", "label": "Close-up face", "promptFragment": "close-up face-focused pose", "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80"}, {"id": "halfbody", "label": "Half-body portrait", "promptFragment": "half-body portrait pose", "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80"}], "title": "Choose a focus"}, {"id": "background", "options": [{"id": "clinical", "label": "Clinical white", "promptFragment": "clean clinical white backdrop", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/backdrops/backdrop_clinical_white.png"}, {"id": "soft", "label": "Soft bathroom", "promptFragment": "soft neutral bathroom backdrop", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/backdrops/backdrop_soft_bathroom.png"}], "title": "Choose a backdrop"}]}'::jsonb WHERE id = 'c2b41fff-2905-4737-b46a-4acc13d6a583';
INSERT INTO public.templates (
  title, industry, category, source, is_published, sort_order,
  preview_storage_path, base_prompt, default_aspect_ratio, default_quality, remix_steps
) VALUES (
  'Grocery Shelf Display',
  'Grocery',
  'products',
  'official',
  true,
  410,
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80',
  'The attached packaged product displayed on {shelf}, camera angle {angle}, {lighting}, sharp label and packaging detail, professional grocery product photography, e-commerce ready.',
  '4:5',
  '2K',
  '{
    "version": 1,
    "steps": [
      {
        "id": "shelf",
        "title": "Choose a shelf setting",
        "options": [
          {"id": "supermarket", "label": "Supermarket aisle", "promptFragment": "a fully stocked supermarket aisle shelf", "thumbnailUrl": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&q=80"},
          {"id": "convenience", "label": "Convenience store", "promptFragment": "a compact convenience store shelf", "thumbnailUrl": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80"},
          {"id": "minimal", "label": "Minimal display", "promptFragment": "a single minimal display shelf with a softly blurred background"}
        ]
      },
      {
        "id": "angle",
        "title": "Choose a camera angle",
        "options": [
          {"id": "eyelevel", "label": "Eye-level", "promptFragment": "eye-level, straight-on"},
          {"id": "above", "label": "Slightly above", "promptFragment": "slightly from above"},
          {"id": "closeup", "label": "Label close-up", "promptFragment": "a close-up focused on the label"}
        ]
      },
      {
        "id": "lighting",
        "title": "Choose a lighting mood",
        "options": [
          {"id": "bright", "label": "Bright retail", "promptFragment": "bright, even retail lighting"},
          {"id": "warm", "label": "Warm ambient", "promptFragment": "warm ambient store lighting with soft shadows"}
        ]
      }
    ]
  }'::jsonb
);

INSERT INTO public.templates (
  title, industry, category, source, is_published, sort_order,
  preview_storage_path, base_prompt, default_aspect_ratio, default_quality, remix_steps
) VALUES (
  'Ingredient Flat-Lay Spread',
  'Grocery',
  'products',
  'official',
  true,
  420,
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&q=80',
  'The attached packaged product placed on {surface}, surrounded by {ingredients}, arranged in a natural flat-lay, top-down view, soft directional lighting, editorial grocery product photography.',
  '1:1',
  '2K',
  '{
    "version": 1,
    "steps": [
      {
        "id": "surface",
        "title": "Choose a surface",
        "options": [
          {"id": "wood", "label": "Rustic wood", "promptFragment": "a rustic light wood table"},
          {"id": "marble", "label": "Marble", "promptFragment": "a light marble surface"},
          {"id": "linen", "label": "Linen fabric", "promptFragment": "a natural linen fabric backdrop"}
        ]
      },
      {
        "id": "ingredients",
        "title": "Choose surrounding ingredients",
        "subtitle": "What should be arranged around the product?",
        "options": [
          {"id": "natural", "label": "Natural ingredients", "promptFragment": "the product''s key natural ingredients (grains, spices, or fresh produce matching what it contains)", "thumbnailUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80"},
          {"id": "minimal", "label": "Minimal props", "promptFragment": "minimal complementary props only, kept clean and uncluttered"}
        ]
      }
    ]
  }'::jsonb
);

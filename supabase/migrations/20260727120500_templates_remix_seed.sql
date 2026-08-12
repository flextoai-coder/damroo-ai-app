-- Demo/dev seed rows exercising the new guided remix wizard (remix_steps).
-- Preview/thumbnail URLs reuse the same verified-valid Unsplash photo IDs already
-- used elsewhere in the seed catalog (20260719090000_...) purely so images resolve
-- during testing -- these are placeholder photography, not real product/model
-- shots, and should be swapped for real assets before this reaches production.
INSERT INTO public.templates (
  title, industry, category, source, preview_storage_path, base_prompt,
  default_aspect_ratio, default_quality, is_published, sort_order, remix_steps
) VALUES
(
  'Model Walking on Runway',
  'Clothing',
  'products',
  'official',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
  'A {gender} fashion model walking on a runway wearing the attached garment, {pose} stance, {background} backdrop, editorial fashion photography, dramatic lighting, high detail.',
  '4:5',
  '2K',
  true,
  110,
  '{
    "version": 1,
    "steps": [
      {
        "id": "gender",
        "title": "Choose a model",
        "subtitle": "Who should wear the garment?",
        "options": [
          {
            "id": "female",
            "label": "Female",
            "promptFragment": "female",
            "thumbnailUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
            "attachAsReference": true
          },
          {
            "id": "male",
            "label": "Male",
            "promptFragment": "male",
            "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80"
          }
        ]
      },
      {
        "id": "pose",
        "title": "Choose a pose",
        "options": [
          {
            "id": "walking",
            "label": "Walking",
            "promptFragment": "confident mid-stride walking",
            "thumbnailUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
            "attachAsReference": true
          },
          {
            "id": "static",
            "label": "Static pose",
            "promptFragment": "static hero pose",
            "thumbnailUrl": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80"
          }
        ]
      },
      {
        "id": "background",
        "title": "Choose a background",
        "options": [
          {
            "id": "runway",
            "label": "Runway",
            "promptFragment": "spotlit runway with a blurred audience",
            "thumbnailUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"
          },
          {
            "id": "studio",
            "label": "Studio",
            "promptFragment": "seamless white studio backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"
          }
        ]
      }
    ]
  }'::jsonb
),
(
  'Athlete Mid-Air Wearing Shoes',
  'Footwear',
  'products',
  'official',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
  'An athletic {gender} model captured mid-air in a {pose} wearing the attached shoes, {background} setting, high-energy sports photography, frozen action, sharp focus.',
  '4:5',
  '2K',
  true,
  120,
  '{
    "version": 1,
    "steps": [
      {
        "id": "gender",
        "title": "Choose an athlete",
        "options": [
          {
            "id": "female",
            "label": "Female",
            "promptFragment": "female",
            "thumbnailUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80"
          },
          {
            "id": "male",
            "label": "Male",
            "promptFragment": "male",
            "thumbnailUrl": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80",
            "attachAsReference": true
          }
        ]
      },
      {
        "id": "pose",
        "title": "Choose a pose",
        "options": [
          {
            "id": "jump",
            "label": "Mid-air jump",
            "promptFragment": "mid-air jump",
            "thumbnailUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80",
            "referenceImageUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&q=80",
            "attachAsReference": true
          },
          {
            "id": "running",
            "label": "Running stride",
            "promptFragment": "dynamic running stride",
            "thumbnailUrl": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&q=80"
          }
        ]
      },
      {
        "id": "background",
        "title": "Choose a background",
        "options": [
          {
            "id": "stadium",
            "label": "Stadium lights",
            "promptFragment": "stadium floodlights at night",
            "thumbnailUrl": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80"
          },
          {
            "id": "studio",
            "label": "Studio gradient",
            "promptFragment": "seamless studio gradient backdrop",
            "thumbnailUrl": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400&q=80"
          }
        ]
      }
    ]
  }'::jsonb
);

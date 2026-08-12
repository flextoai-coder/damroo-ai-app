-- Third Grocery template: a model holding the attached packaged product in
-- their hands. Follows the same guided-flow shape as the other 11 templates
-- that ask about a model — ethnicity asked first, then gender, then pose and
-- background — added in 20260809130000_templates_style_audit_ethnicity_grocery.sql.

INSERT INTO public.templates (
  title, industry, category, source, is_published, sort_order,
  preview_storage_path, base_prompt, default_aspect_ratio, default_quality, remix_steps
) VALUES (
  'Model Holding the Product',
  'Grocery',
  'products',
  'official',
  true,
  430,
  'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=1200&q=80',
  'A {ethnicity} {gender} model holding the attached packaged product in their hands, {pose}, {background}, natural editorial grocery photography, soft flattering lighting, high detail on hands and packaging.',
  '4:5',
  '2K',
  '{
    "version": 1,
    "steps": [
      {
        "id": "ethnicity",
        "title": "Choose ethnicity",
        "subtitle": "What should the model''s ethnicity look like?",
        "options": [
          {"id": "indian", "label": "Indian", "promptFragment": "Indian"},
          {"id": "foreigner", "label": "Foreigner (Western)", "promptFragment": "Western"}
        ]
      },
      {
        "id": "gender",
        "title": "Choose a model",
        "options": [
          {"id": "female", "label": "Female", "promptFragment": "female", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/female/female.png"},
          {"id": "male", "label": "Male", "promptFragment": "male", "thumbnailUrl": "https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/public/templates/genders/male/male.png"}
        ]
      },
      {
        "id": "pose",
        "title": "Choose a pose",
        "options": [
          {"id": "presenting", "label": "Presenting", "promptFragment": "holding the product up toward camera at chest height, presenting it with a warm smile"},
          {"id": "closeup", "label": "Hands close-up", "promptFragment": "a close-up crop on just the hands holding the product"},
          {"id": "candid", "label": "Candid", "promptFragment": "casually holding the product while looking off to the side, candid lifestyle moment"}
        ]
      },
      {
        "id": "background",
        "title": "Choose a background",
        "options": [
          {"id": "kitchen", "label": "Kitchen counter", "promptFragment": "a bright modern kitchen counter backdrop"},
          {"id": "outdoor", "label": "Outdoor market", "promptFragment": "a sunny outdoor market backdrop"},
          {"id": "studio", "label": "Minimal studio", "promptFragment": "a clean minimal studio backdrop"}
        ]
      }
    ]
  }'::jsonb
);

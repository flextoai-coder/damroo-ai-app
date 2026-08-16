-- Publish every remaining draft template so the full catalog is visible
-- in the app (Chef Serving the Signature Dish, the two remaining Jewellery
-- guided-flow templates, Cinematic Dish Reveal, Adorned Elegance Portrait,
-- Boutique Hanger Display).
UPDATE public.templates
SET is_published = true
WHERE is_published = false;

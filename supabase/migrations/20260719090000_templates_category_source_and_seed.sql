-- Category filter chips + Official/Creator ribbon for Templates screen
CREATE TYPE public.template_category AS ENUM ('festival', 'offers', 'products', 'video');
CREATE TYPE public.template_source AS ENUM ('official', 'creator');

ALTER TABLE public.templates
  ADD COLUMN category public.template_category NOT NULL DEFAULT 'offers',
  ADD COLUMN source public.template_source NOT NULL DEFAULT 'official';

CREATE INDEX templates_category_published_idx
  ON public.templates (category, is_published, sort_order);

INSERT INTO public.templates (
  title, industry, category, source, preview_storage_path, base_prompt,
  default_aspect_ratio, default_quality, is_published, sort_order
) VALUES
(
  'Diwali Dhamaka Sale',
  'Retail',
  'festival',
  'official',
  'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80',
  'Festive Diwali poster for an Indian retail store — warm golden diyas, marigold garlands, bold Hindi-English sale headline, premium brand composition, space for logo.',
  '4:5',
  '2K',
  true,
  10
),
(
  'Holi Color Burst',
  'Cafe',
  'festival',
  'official',
  'https://images.unsplash.com/photo-1583225214464-929dd8b97c87?w=800&q=80',
  'Vibrant Holi celebration cafe promo — powder color splash, joyful mood, menu offer callout, Instagram-ready portrait layout.',
  '4:5',
  '2K',
  true,
  20
),
(
  'Weekend Brunch Special',
  'Cafe',
  'offers',
  'official',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  'Sunny weekend brunch offer poster for a cafe — plated avocado toast and coffee, soft daylight, elegant typography with price badge.',
  '1:1',
  '2K',
  true,
  30
),
(
  'Flash Sale Banner',
  'Ecommerce',
  'offers',
  'creator',
  'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&q=80',
  'High-energy ecommerce flash sale banner — bold discount percentage, urgency countdown feel, clean product silhouette, brand-safe colors.',
  '16:9',
  '2K',
  true,
  40
),
(
  'New Menu Drop',
  'Restaurant',
  'products',
  'official',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
  'New menu launch poster for a restaurant — hero dish close-up, appetizing lighting, modern sans typography announcing the drop.',
  '4:5',
  '2K',
  true,
  50
),
(
  'Product Spotlight',
  'Ecommerce',
  'products',
  'creator',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  'Minimal product spotlight creative — single hero product on soft gradient, premium packaging detail, short tagline space.',
  '1:1',
  '2K',
  true,
  60
),
(
  'Rakhi Gift Offer',
  'Retail',
  'festival',
  'official',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
  'Raksha Bandhan gift offer poster — festive threads, gift boxes, warm family tone, clear offer strip for retail.',
  '4:5',
  '2K',
  true,
  70
),
(
  'Happy Hour Deal',
  'Restaurant',
  'offers',
  'creator',
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'Happy hour drinks deal poster for a restaurant bar — moody evening lighting, cocktail glass hero, bold time window callout.',
  '9:16',
  '2K',
  true,
  80
),
(
  'Skincare Launch',
  'Beauty',
  'products',
  'official',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
  'Clean beauty product launch creative — soft pastel backdrop, skincare bottle hero, refined typography, spa-like calm.',
  '4:5',
  '2K',
  true,
  90
),
(
  'Independence Day Promo',
  'Retail',
  'festival',
  'official',
  'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&q=80',
  'India Independence Day retail promo — tricolor inspired palette (tasteful), patriotic pride tone, sale headline.',
  '1:1',
  '2K',
  true,
  100
),
(
  'Video Story Template',
  'Retail',
  'video',
  'official',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80',
  'Coming soon video story template placeholder.',
  '9:16',
  '2K',
  false,
  999
);

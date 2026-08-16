-- DB-only field for manually soft-disabling a template (e.g. via the Supabase
-- dashboard) without deleting it. No client/UI surfaces this — it's a
-- backend toggle only. Defaults every existing and future row to 'active'.
CREATE TYPE public.template_status AS ENUM ('active', 'inactive');

ALTER TABLE public.templates
  ADD COLUMN status public.template_status NOT NULL DEFAULT 'active';

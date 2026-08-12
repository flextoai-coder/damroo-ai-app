-- Optional guided configuration steps (e.g. gender -> pose -> background) for
-- select templates. NULL = template remixes directly today, unchanged.
ALTER TABLE public.templates
  ADD COLUMN remix_steps jsonb;

COMMENT ON COLUMN public.templates.remix_steps IS
  'Optional guided remix wizard config, client-validated (not DB-enforced). Shape: '
  '{ "version": 1, "steps": [ { "id": string, "title": string, "subtitle"?: string, '
  '"options": [ { "id": string, "label": string, "promptFragment": string, '
  '"thumbnailUrl"?: string, "referenceImageUrl"?: string, "attachAsReference"?: boolean } ] } ] }. '
  'NULL/absent = direct one-tap remix (no wizard shown). step.id is substituted into '
  'base_prompt as a literal {id} token -- {} is reserved syntax in base_prompt going forward.';

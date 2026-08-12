-- Reference images are only ever attached from a "background" step now — gender/pose/
-- camera-angle/etc. selections are prompt-text only (they were inconsistently attaching
-- images in earlier seed data). Strip `attachAsReference`/`referenceImageUrl` from every
-- option belonging to a non-"background" step, for every existing published template.
DO $$
DECLARE
  rec RECORD;
  steps_arr jsonb;
  new_steps jsonb;
  step jsonb;
  new_step jsonb;
  opts_arr jsonb;
  new_opts jsonb;
  opt jsonb;
  i int;
  j int;
BEGIN
  FOR rec IN SELECT id, remix_steps FROM public.templates WHERE remix_steps IS NOT NULL LOOP
    steps_arr := rec.remix_steps -> 'steps';
    new_steps := '[]'::jsonb;

    FOR i IN 0 .. jsonb_array_length(steps_arr) - 1 LOOP
      step := steps_arr -> i;

      IF step ->> 'id' = 'background' THEN
        new_steps := new_steps || jsonb_build_array(step);
      ELSE
        opts_arr := step -> 'options';
        new_opts := '[]'::jsonb;
        FOR j IN 0 .. jsonb_array_length(opts_arr) - 1 LOOP
          opt := (opts_arr -> j) - 'attachAsReference' - 'referenceImageUrl';
          new_opts := new_opts || jsonb_build_array(opt);
        END LOOP;
        new_step := jsonb_set(step, '{options}', new_opts);
        new_steps := new_steps || jsonb_build_array(new_step);
      END IF;
    END LOOP;

    UPDATE public.templates
    SET remix_steps = jsonb_set(rec.remix_steps, '{steps}', new_steps)
    WHERE id = rec.id;
  END LOOP;
END $$;

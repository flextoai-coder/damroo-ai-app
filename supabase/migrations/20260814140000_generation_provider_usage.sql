-- Tracks per-generation provider cost/usage so it can be tallied later
-- (e.g. "how many tokens has GPT Image 2 burned this month"). `provider_usage`
-- stores whatever `usage` object the provider's response included, verbatim —
-- GPT Image 2 and Seedream don't report the same shape, so this stays
-- schema-flexible rather than pinning specific columns to one provider's
-- fields. Both are nullable/best-effort: never block a generation from
-- completing just because usage reporting is missing or shaped differently
-- than expected.
ALTER TABLE public.generations
  ADD COLUMN provider_model text,
  ADD COLUMN provider_usage jsonb;

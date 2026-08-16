-- Supports the daily purge cron's and the client's "expiring soon" query,
-- both of which filter completed generations by created_at. Neither existing
-- index (user_id-first, or status-only) covers this combination.
CREATE INDEX generations_expiry_sweep_idx
  ON public.generations (status, created_at)
  WHERE status = 'completed';

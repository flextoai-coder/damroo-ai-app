import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';
import { removeAllUnderPrefix } from '../_shared/storage-cleanup.ts';

/**
 * Scheduled job: generated images are retained for 7 days. This sweep deletes
 * the actual Storage objects + `generation_assets` rows once a generation
 * crosses that age, but deliberately leaves the `generations` row itself
 * (prompt, credits_charged, timestamps) untouched — the app keeps it visible
 * as a grayed-out placeholder rather than dropping it from history entirely.
 *
 * Runs daily so every generation's own 7-day window is honored regardless of
 * when in the week it was created (a literal once-a-week batch would let an
 * image live anywhere from ~1-13 days depending on timing).
 *
 * Idempotent by construction: `generation_assets!inner(id)` only matches
 * generations that still have at least one asset row, so a generation drops
 * out of this query the moment its assets are gone — no separate "purged"
 * flag needed, safe to retry/re-run.
 *
 * Protect with CRON_SECRET header when invoked from Supabase cron / external
 * scheduler, same as cron-expire-subscriptions / cron-expire-stuck-generations.
 */

const RETENTION_MS = 7 * 24 * 60 * 60_000;

/**
 * Kill switch — generations are being kept as a full record (Storage image
 * + generation_assets row) for now instead of being purged after 7 days.
 * Flip back to `true` to resume the normal sweep; no other code changes
 * needed.
 */
const PURGE_ENABLED = false;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST' && req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret') ?? '';
    if (provided !== cronSecret) {
      return errorResponse('Unauthorized', 401);
    }
  }

  if (!PURGE_ENABLED) {
    return jsonResponse({ ok: true, purged_count: 0, disabled: true });
  }

  try {
    const service = getServiceClient();
    const cutoff = new Date(Date.now() - RETENTION_MS).toISOString();

    const { data: candidates, error: selectError } = await service
      .from('generations')
      .select('id, user_id, generation_assets!inner(id)')
      .eq('status', 'completed')
      .lt('created_at', cutoff);

    if (selectError) return errorResponse(selectError.message, 500);

    const rows = candidates ?? [];

    for (const row of rows) {
      try {
        await removeAllUnderPrefix(service, 'generations', `${row.user_id}/${row.id}`);
      } catch (e) {
        // Best-effort — still proceed to drop the generation_assets rows below
        // so the placeholder UI activates even if a storage delete partially
        // failed (matching delete-account's tolerance for partial failures).
        console.error(`cron-purge-expired-generations: storage cleanup failed for ${row.id}`, e);
      }

      await service.from('generation_assets').delete().eq('generation_id', row.id);
    }

    return jsonResponse({ ok: true, purged_count: rows.length });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Cron failed', 500);
  }
});

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient, requireUser } from '../_shared/supabase.ts';
import { removeAllUnderPrefix } from '../_shared/storage-cleanup.ts';

/**
 * Every bucket that stores files under a top-level `{userId}/...` prefix.
 * DB rows cascade automatically via `profiles.id -> auth.users.id ON DELETE CASCADE`
 * (and every user-owned table cascading from `profiles`), so only Storage —
 * which foreign keys don't reach — needs explicit cleanup here.
 */
const STORAGE_BUCKETS = ['generations', 'references', 'brand-assets', 'avatars'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  let userId: string;
  try {
    ({ userId } = await requireUser(req));
  } catch (res) {
    if (res instanceof Response) return res;
    return errorResponse('Unauthorized', 401);
  }

  const service = getServiceClient();

  try {
    // Best-effort storage cleanup — non-fatal per bucket so one failure
    // doesn't block the account deletion the user asked for.
    for (const bucket of STORAGE_BUCKETS) {
      try {
        await removeAllUnderPrefix(service, bucket, userId);
      } catch (e) {
        console.error(`delete-account: failed clearing bucket "${bucket}" for ${userId}`, e);
      }
    }

    // Deleting the auth user cascades every DB row owned by this user
    // (profiles, generations, generation_assets, conversations, chat_messages,
    // captions, credit_ledger, brand_kits, subscriptions).
    const { error: deleteError } = await service.auth.admin.deleteUser(userId);
    if (deleteError) {
      return errorResponse(deleteError.message ?? 'Failed to delete account', 500);
    }

    return jsonResponse({ deleted: true });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Failed to delete account', 500);
  }
});

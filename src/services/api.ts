import { FunctionsHttpError } from '@supabase/supabase-js';

import { toUserErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

/**
 * Thin helpers for authenticated Edge Function calls.
 * Secrets stay on the server — the client only sends the user JWT.
 */
export async function invokeFunction<TResponse>(
  name: string,
  body?: Record<string, unknown>,
): Promise<TResponse> {
  try {
    const { data, error } = await supabase.functions.invoke<TResponse>(name, {
      body: body ?? {},
    });

    if (error) {
      if (error instanceof FunctionsHttpError) {
        try {
          const payload = (await error.context.json()) as {
            error?: string;
            code?: string;
          };
          throw new Error(payload.error ?? error.message);
        } catch (inner) {
          if (inner instanceof Error && inner.message !== error.message) {
            throw new Error(toUserErrorMessage(inner, error.message));
          }
        }
      }
      throw new Error(toUserErrorMessage(error));
    }

    if (
      data &&
      typeof data === 'object' &&
      'error' in data &&
      (data as { error?: string }).error
    ) {
      throw new Error(toUserErrorMessage((data as { error: string }).error));
    }

    return data as TResponse;
  } catch (e) {
    throw new Error(toUserErrorMessage(e));
  }
}

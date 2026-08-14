import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, type Query } from '@tanstack/react-query';
import type { Persister } from '@tanstack/react-query-persist-client';

/** How long a persisted cache entry may be reused after an offline app restart. */
const PERSIST_MAX_AGE = 24 * 60 * 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Must stay >= PERSIST_MAX_AGE, otherwise restored entries are garbage
      // collected before the persister ever gets to reuse them.
      gcTime: PERSIST_MAX_AGE,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'damroo-query-cache',
});

/**
 * Excluded from disk persistence:
 * - Unbounded feeds (infinite-scroll pagination) — they'd grow forever on disk.
 * - Queries whose result embeds a Supabase Storage *signed* URL (an expiring
 *   token baked into the string, not just an ID we can re-resolve later).
 *   Persisting one across a cold start means the UI can show/attach an
 *   already-stale link, which then gets frozen into a chat attachment's
 *   `uri` forever once selected — the underlying bug behind broken
 *   "My Uploads" thumbnails in the playground composer. `public_url`
 *   generation images and the raw `brand_kits` row (its logo is signed
 *   separately, outside the query) don't have this problem.
 */
function isPersistable(query: Query): boolean {
  const [entity, scope] = query.queryKey as [string?, string?];
  if (entity === 'generations' && scope === 'infinite') return false;
  if (entity === 'reference-uploads') return false;
  return true;
}

export const queryPersistOptions = {
  persister: asyncStoragePersister as Persister,
  maxAge: PERSIST_MAX_AGE,
  buster: 'v1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) =>
      query.state.status === 'success' && isPersistable(query),
  },
} satisfies {
  persister: Persister;
  maxAge: number;
  buster: string;
  dehydrateOptions: { shouldDehydrateQuery: (query: Query) => boolean };
};

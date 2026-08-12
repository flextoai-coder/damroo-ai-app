/**
 * Map provider / network failures to short user-facing copy.
 */
export function toUserErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : fallback;

  const lower = raw.toLowerCase();

  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('offline')
  ) {
    return 'You’re offline. Check your connection and try again.';
  }

  if (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('429') ||
    lower.includes('quota')
  ) {
    return 'You’re generating too quickly. Wait a moment and try again.';
  }

  if (lower.includes('insufficient_credits') || lower.includes('insufficient credits')) {
    return 'Not enough credits. Upgrade your plan to keep creating.';
  }

  if (
    lower.includes('no_active_subscription') ||
    lower.includes('no active subscription')
  ) {
    return 'No active plan. Choose a plan to unlock generation.';
  }

  if (lower.includes('unauthorized') || lower.includes('jwt')) {
    return 'Session expired. Sign in again to continue.';
  }

  // Unrecognized error — never surface the raw provider/network/stack text to the user.
  return fallback;
}

/** Credit / subscription blockers that should open the plans sheet. */
export function isPlanUpgradeError(error: unknown): boolean {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const lower = raw.toLowerCase();
  return (
    lower.includes('insufficient_credits') ||
    lower.includes('insufficient credits') ||
    lower.includes('not enough credits') ||
    lower.includes('no_active_subscription') ||
    lower.includes('no active subscription') ||
    lower.includes('no active plan') ||
    lower.includes('402')
  );
}

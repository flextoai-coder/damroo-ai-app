import {
  emptyToNull,
  hasCompletedRequiredOnboardingSteps,
  resolveIndustry,
} from '@/lib/onboarding';
import { updateProfile } from '@/services/profile';
import { useAuthStore } from '@/stores/auth-store';
import type { OnboardingDraft } from '@/stores/onboarding-store';

function authErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    if (message.trim()) return message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

async function persistAndSync(userId: string, patch: Parameters<typeof updateProfile>[1]) {
  const profile = await updateProfile(userId, patch);
  useAuthStore.getState().setProfile(profile);
  return profile;
}

/** Step 1 Continue — persist name + business name. */
export async function saveOnboardingStep1(
  userId: string,
  draft: Pick<OnboardingDraft, 'fullName' | 'businessName'>,
) {
  try {
    return await persistAndSync(userId, {
      full_name: draft.fullName.trim(),
      business_name: draft.businessName.trim(),
    });
  } catch (error) {
    throw new Error(authErrorMessage(error, 'Could not save your profile'));
  }
}

/** Step 2 Continue — persist industry (and keep step-1 fields in sync). */
export async function saveOnboardingStep2(
  userId: string,
  draft: Pick<
    OnboardingDraft,
    'fullName' | 'businessName' | 'businessTypeId' | 'customBusinessType'
  >,
) {
  const industry = resolveIndustry(draft.businessTypeId, draft.customBusinessType);
  if (!industry) {
    throw new Error('Choose a business type to continue.');
  }

  try {
    return await persistAndSync(userId, {
      full_name: draft.fullName.trim(),
      business_name: draft.businessName.trim(),
      industry,
    });
  } catch (error) {
    throw new Error(authErrorMessage(error, 'Could not save your profile'));
  }
}

/**
 * Step 3 Skip / Finish — persist optional links and mark onboarding complete
 * only when steps 1 + 2 (2/3) are already satisfied.
 */
export async function completeOnboarding(
  userId: string,
  draft: OnboardingDraft,
  options: { includeOptionalLinks: boolean },
) {
  if (!hasCompletedRequiredOnboardingSteps(draft)) {
    throw new Error(
      'Complete your name, business, and industry first (2 of 3 steps).',
    );
  }

  const industry = resolveIndustry(draft.businessTypeId, draft.customBusinessType);
  if (!industry) {
    throw new Error('Choose a business type to continue.');
  }

  const optional = options.includeOptionalLinks
    ? {
        website: emptyToNull(draft.website),
        instagram_handle: emptyToNull(draft.instagramHandle),
        linkedin_profile: emptyToNull(draft.linkedinProfile),
        business_details: emptyToNull(draft.businessDetails),
      }
    : {};

  try {
    return await persistAndSync(userId, {
      full_name: draft.fullName.trim(),
      business_name: draft.businessName.trim(),
      industry,
      ...optional,
      onboarding_completed: true,
    });
  } catch (error) {
    throw new Error(authErrorMessage(error, 'Could not save your profile'));
  }
}

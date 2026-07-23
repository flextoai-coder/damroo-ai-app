import { BUSINESS_TYPES, type BusinessTypeId } from '@/constants/business-types';
import type { OnboardingDraft } from '@/stores/onboarding-store';

export function resolveIndustry(
  businessTypeId: BusinessTypeId | null,
  customBusinessType: string,
): string | null {
  if (!businessTypeId) return null;
  if (businessTypeId === 'others') {
    const custom = customBusinessType.trim();
    return custom.length > 0 ? custom : null;
  }
  return BUSINESS_TYPES.find((t) => t.id === businessTypeId)?.label ?? null;
}

/** Map a stored industry label back to the business-type picker state. */
export function industryToBusinessType(industry: string | null | undefined): {
  businessTypeId: BusinessTypeId | null;
  customBusinessType: string;
} {
  const value = industry?.trim() ?? '';
  if (!value) {
    return { businessTypeId: null, customBusinessType: '' };
  }

  const match = BUSINESS_TYPES.find(
    (t) => t.id !== 'others' && t.label.toLowerCase() === value.toLowerCase(),
  );
  if (match) {
    return { businessTypeId: match.id, customBusinessType: '' };
  }

  return { businessTypeId: 'others', customBusinessType: value };
}

/** Steps 1 + 2 are the required pair (2/3) before onboarding can complete. */
export function hasCompletedRequiredOnboardingSteps(draft: OnboardingDraft): boolean {
  const nameOk = draft.fullName.trim().length > 0;
  const businessOk = draft.businessName.trim().length > 0;
  const industry = resolveIndustry(draft.businessTypeId, draft.customBusinessType);
  return nameOk && businessOk && Boolean(industry);
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

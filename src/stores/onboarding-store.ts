import { create } from 'zustand';

import type { BusinessTypeId } from '@/constants/business-types';

export type OnboardingDraft = {
  fullName: string;
  businessName: string;
  businessTypeId: BusinessTypeId | null;
  customBusinessType: string;
  website: string;
  instagramHandle: string;
  linkedinProfile: string;
  businessDetails: string;
};

type OnboardingState = OnboardingDraft & {
  setField: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  hydrateFromProfile: (partial: Partial<OnboardingDraft>) => void;
  reset: () => void;
};

const initialDraft: OnboardingDraft = {
  fullName: '',
  businessName: '',
  businessTypeId: null,
  customBusinessType: '',
  website: '',
  instagramHandle: '',
  linkedinProfile: '',
  businessDetails: '',
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialDraft,
  setField: (key, value) => set({ [key]: value }),
  hydrateFromProfile: (partial) => set((state) => ({ ...state, ...partial })),
  reset: () => set({ ...initialDraft }),
}));

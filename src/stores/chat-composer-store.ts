import { create } from 'zustand';

import { DEFAULT_FORMAT_ID, DEFAULT_MODEL_ID } from '@/constants/playground';

export type ImageQuality = '2K' | '4K';

export type AttachmentKind = 'reference' | 'template';

export type AttachmentStatus = 'uploading' | 'ready' | 'error';

export type ComposerAttachment = {
  /** Remote URL once uploaded; local file/data URI only while status is 'uploading'. */
  uri: string;
  /** Stable id for list keys / removal */
  id: string;
  kind: AttachmentKind;
  title: string;
  /** Reference images upload to Storage immediately on attach — generation never depends on local files. */
  status: AttachmentStatus;
};

type ChatComposerState = {
  prompt: string;
  aspectRatio: string;
  quality: ImageQuality;
  imageCount: number;
  modelId: string;
  /** Order is sacred — Seedream receives images in this array order. */
  attachments: ComposerAttachment[];
  templateId: string | null;
  /** Whether to attach the brand kit logo as a reference image. */
  useBrandLogo: boolean;
  /** Whether to mention the business name in the generation prompt. */
  useBrandName: boolean;
  /** Whether to apply the brand kit color palette to the generation prompt. */
  useBrandColors: boolean;
  setPrompt: (prompt: string) => void;
  setAspectRatio: (aspectRatio: string) => void;
  setQuality: (quality: ImageQuality) => void;
  setImageCount: (imageCount: number) => void;
  setModelId: (modelId: string) => void;
  addAttachment: (attachment: ComposerAttachment) => void;
  updateAttachment: (id: string, patch: Partial<ComposerAttachment>) => void;
  removeAttachment: (id: string) => void;
  reorderAttachments: (attachments: ComposerAttachment[]) => void;
  setTemplateId: (templateId: string | null) => void;
  setUseBrandLogo: (value: boolean) => void;
  setUseBrandName: (value: boolean) => void;
  setUseBrandColors: (value: boolean) => void;
  reset: () => void;
};

const initialState = {
  prompt: '',
  aspectRatio: DEFAULT_FORMAT_ID,
  quality: '2K' as ImageQuality,
  imageCount: 1,
  modelId: DEFAULT_MODEL_ID,
  attachments: [] as ComposerAttachment[],
  templateId: null as string | null,
  useBrandLogo: true,
  useBrandName: true,
  useBrandColors: true,
};

export const useChatComposerStore = create<ChatComposerState>((set) => ({
  ...initialState,
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setQuality: (quality) => set({ quality }),
  setImageCount: (imageCount) => set({ imageCount: Math.min(15, Math.max(1, imageCount)) }),
  setModelId: (modelId) => set({ modelId }),
  addAttachment: (attachment) =>
    set((state) => ({
      attachments:
        state.attachments.length >= 14
          ? state.attachments
          : [...state.attachments, attachment],
    })),
  updateAttachment: (id, patch) =>
    set((state) => ({
      attachments: state.attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),
  removeAttachment: (id) =>
    set((state) => ({
      attachments: state.attachments.filter((a) => a.id !== id),
    })),
  reorderAttachments: (attachments) => set({ attachments }),
  setTemplateId: (templateId) => set({ templateId }),
  setUseBrandLogo: (useBrandLogo) => set({ useBrandLogo }),
  setUseBrandName: (useBrandName) => set({ useBrandName }),
  setUseBrandColors: (useBrandColors) => set({ useBrandColors }),
  reset: () => set({ ...initialState }),
}));

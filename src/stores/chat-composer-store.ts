import { create } from 'zustand';

import { DEFAULT_FORMAT_ID, DEFAULT_MODEL_ID } from '@/constants/playground';

export type ImageQuality = '2K' | '4K';

export type AttachmentKind = 'reference' | 'template';

export type ComposerAttachment = {
  /** Local URI or remote URL */
  uri: string;
  /** Stable id for list keys / removal */
  id: string;
  kind: AttachmentKind;
  title: string;
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
  setPrompt: (prompt: string) => void;
  setAspectRatio: (aspectRatio: string) => void;
  setQuality: (quality: ImageQuality) => void;
  setImageCount: (imageCount: number) => void;
  setModelId: (modelId: string) => void;
  addAttachment: (attachment: ComposerAttachment) => void;
  removeAttachment: (id: string) => void;
  reorderAttachments: (attachments: ComposerAttachment[]) => void;
  setTemplateId: (templateId: string | null) => void;
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
  removeAttachment: (id) =>
    set((state) => ({
      attachments: state.attachments.filter((a) => a.id !== id),
    })),
  reorderAttachments: (attachments) => set({ attachments }),
  setTemplateId: (templateId) => set({ templateId }),
  reset: () => set({ ...initialState }),
}));

import { create } from 'zustand';

import {
  DEFAULT_FORMAT_ID,
  DEFAULT_MODEL_ID,
  DEFAULT_VARIATION_ID,
  MAX_IMAGE_COUNT,
  MIN_IMAGE_COUNT,
} from '@/constants/playground';

export type ImageQuality = '2K' | '4K';

/** How different each image in a multi-image batch should look — meaningless (ignored) when imageCount is 1. */
export type ImageVariation = 'subtle' | 'balanced' | 'bold';

export type AttachmentKind = 'product' | 'reference' | 'template' | 'template-option';

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

/**
 * Attachments that should actually be sent to the model as image references,
 * in the order Seedream should receive them. Excludes `'template'` — the
 * template's own cover/demo shot, added purely so the composer can show a
 * "remixing X" chip. Its style already lives in the prompt text
 * (`interpolateTemplatePrompt`); sending the photo itself made Seedream copy
 * the template's stock image instead of the user's product. `'product'` and
 * `'template-option'` attachments stay in.
 *
 * `'product'`-kind items are sorted first (the primary subject), ahead of
 * everything else — a stable sort, so relative order within each group is
 * preserved exactly as attached. The underlying store array itself is never
 * reordered; this only affects what gets sent to the model.
 */
export function modelReferenceAttachments(
  attachments: ComposerAttachment[],
): ComposerAttachment[] {
  const rank = (kind: AttachmentKind) => (kind === 'product' ? 0 : 1);
  return attachments
    .filter((a) => a.kind !== 'template')
    .map((a, index) => ({ a, index }))
    .sort((x, y) => rank(x.a.kind) - rank(y.a.kind) || x.index - y.index)
    .map(({ a }) => a);
}

type ChatComposerState = {
  prompt: string;
  aspectRatio: string;
  quality: ImageQuality;
  imageCount: number;
  variation: ImageVariation;
  modelId: string;
  /** Order is sacred — Seedream receives images in this array order. */
  attachments: ComposerAttachment[];
  templateId: string | null;
  /**
   * The template's guided-flow selections, interpolated into instruction
   * text — set once when a template is applied, kept out of the editable
   * `prompt` field entirely so it can't be silently edited away. Sent to the
   * server separately and given priority over free-text `prompt` there.
   */
  templateLockedPrompt: string | null;
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
  setVariation: (variation: ImageVariation) => void;
  setModelId: (modelId: string) => void;
  /** Returns false (and no-ops) if the 14-attachment cap is already reached. */
  addAttachment: (attachment: ComposerAttachment) => boolean;
  updateAttachment: (id: string, patch: Partial<ComposerAttachment>) => void;
  removeAttachment: (id: string) => void;
  reorderAttachments: (attachments: ComposerAttachment[]) => void;
  /** Clears attachments + template once they've been handed off to a generation. */
  clearAttachments: () => void;
  /**
   * Replaces every `'ready'` attachment of one kind with a new ordered set —
   * used by the picker sheet's confirm step, which manages a zone's full
   * selection (adds and removes) in one go rather than only ever appending.
   * Attachments of other kinds, and any of this kind still `'uploading'`/
   * `'error'` (mid-flight, not yet part of the sheet's selection), are left
   * untouched.
   */
  replaceReadyAttachments: (kind: AttachmentKind, attachments: ComposerAttachment[]) => void;
  setTemplateId: (templateId: string | null) => void;
  setTemplateLockedPrompt: (value: string | null) => void;
  /** Drops the template lock and its template-origin attachments, leaving product/reference images and free text untouched. */
  clearTemplateLock: () => void;
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
  variation: DEFAULT_VARIATION_ID as ImageVariation,
  modelId: DEFAULT_MODEL_ID,
  attachments: [] as ComposerAttachment[],
  templateId: null as string | null,
  templateLockedPrompt: null as string | null,
  // Off by default — the user opts in per generation from the Brand Kit popover.
  useBrandLogo: false,
  useBrandName: false,
  useBrandColors: false,
};

export const useChatComposerStore = create<ChatComposerState>((set) => ({
  ...initialState,
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setQuality: (quality) => set({ quality }),
  setImageCount: (imageCount) =>
    set({ imageCount: Math.min(MAX_IMAGE_COUNT, Math.max(MIN_IMAGE_COUNT, imageCount)) }),
  setVariation: (variation) => set({ variation }),
  setModelId: (modelId) => set({ modelId }),
  addAttachment: (attachment) => {
    let added = false;
    set((state) => {
      if (state.attachments.length >= 14) return state;
      added = true;
      return { attachments: [...state.attachments, attachment] };
    });
    return added;
  },
  updateAttachment: (id, patch) =>
    set((state) => ({
      attachments: state.attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),
  removeAttachment: (id) =>
    set((state) => ({
      attachments: state.attachments.filter((a) => a.id !== id),
    })),
  reorderAttachments: (attachments) => set({ attachments }),
  clearAttachments: () => set({ attachments: [], templateId: null, templateLockedPrompt: null }),
  replaceReadyAttachments: (kind, next) =>
    set((state) => {
      const untouched = state.attachments.filter(
        (a) => a.kind !== kind || a.status !== 'ready',
      );
      const capped = next.slice(0, Math.max(0, 14 - untouched.length));
      return { attachments: [...untouched, ...capped] };
    }),
  setTemplateId: (templateId) => set({ templateId }),
  setTemplateLockedPrompt: (templateLockedPrompt) => set({ templateLockedPrompt }),
  clearTemplateLock: () =>
    set((state) => ({
      templateId: null,
      templateLockedPrompt: null,
      attachments: state.attachments.filter(
        (a) => a.kind !== 'template' && a.kind !== 'template-option',
      ),
    })),
  setUseBrandLogo: (useBrandLogo) => set({ useBrandLogo }),
  setUseBrandName: (useBrandName) => set({ useBrandName }),
  setUseBrandColors: (useBrandColors) => set({ useBrandColors }),
  reset: () => set({ ...initialState }),
}));

import { File } from 'expo-file-system';

import { invokeFunction } from '@/services/api';
import { supabase } from '@/lib/supabase';
import {
  modelReferenceAttachments,
  type ComposerAttachment,
  type ImageQuality,
  type ImageVariation,
} from '@/stores/chat-composer-store';

type EnhanceResponse = {
  prompt?: string;
  enhanced_prompt?: string;
};

type GenerateImageResponse = {
  generation_id: string;
  conversation_id: string;
  status: string;
  error?: string;
};

export type GenerationOutcome = {
  status: 'completed' | 'failed';
  imageUrls: string[];
  errorMessage: string | null;
};

const POLL_INTERVAL_MS = 2500;
/**
 * Generous ceiling — both providers normally finish well under a minute
 * (GPT Image 2 is pinned to 'medium' effort for every quality tier, see
 * gpt-image.ts), this just leaves headroom for a slow multi-image batch or
 * network variance. The server has its own stuck-generation sweep
 * (cron-expire-stuck-generations) that refunds credits if something never
 * finishes at all — this timeout is purely about not leaving the UI
 * spinning forever in that case, not about matching a real provider ceiling.
 */
const POLL_TIMEOUT_MS = 6 * 60_000;

/**
 * Calls the enhance-prompt Edge Function (OpenAI, vision-capable). Considers
 * whichever context is actually available — the minimal prompt, any
 * reference image(s), the target aspect ratio, and whichever brand kit
 * toggles are on. Falls back to a light local rewrite if the function is
 * unavailable.
 */
export async function enhancePrompt(params: {
  prompt: string;
  aspectRatio?: string;
  referenceImages?: string[];
  useBrandLogo?: boolean;
  useBrandName?: boolean;
  useBrandColors?: boolean;
}): Promise<string> {
  const trimmed = params.prompt.trim();
  if (!trimmed) return trimmed;

  try {
    const data = await invokeFunction<EnhanceResponse>('enhance-prompt', {
      prompt: trimmed,
      aspect_ratio: params.aspectRatio,
      reference_images: params.referenceImages ?? [],
      use_brand_logo: params.useBrandLogo ?? false,
      use_brand_name: params.useBrandName ?? false,
      use_brand_colors: params.useBrandColors ?? false,
    });
    return (data.enhanced_prompt ?? data.prompt ?? trimmed).trim();
  } catch {
    return localEnhance(trimmed);
  }
}

function localEnhance(prompt: string): string {
  const suffix =
    'Cinematic lighting, premium brand composition, crisp typography hierarchy, high-detail product photography style.';
  if (prompt.toLowerCase().includes('cinematic')) return prompt;
  return `${prompt.replace(/\.*$/, '')}. ${suffix}`;
}

function extensionForContentType(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('heic') || contentType.includes('heif')) return 'heic';
  return 'jpg';
}

/** Best-effort content type from the file path when the caller doesn't already know it. */
function guessContentTypeFromUri(uri: string): string {
  const path = uri.split('?')[0].toLowerCase();
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.heic') || path.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

/**
 * Uploads one local file/data URI to the private references bucket and
 * returns a signed URL. Remote URLs pass through unchanged. Called eagerly
 * as soon as an image is attached, so generation never depends on a local
 * file still being present on the device.
 *
 * Reads the file via `expo-file-system`'s `File` (bytes, not a Blob) — React
 * Native's `fetch(uri).blob()` is a well-known unreliable path for uploading
 * local files through the Supabase JS client; it frequently produces
 * corrupted or empty uploads. Passing raw bytes sidesteps that entirely.
 */
export async function uploadReferenceImage(
  userId: string,
  uri: string,
  mimeType?: string | null,
): Promise<string> {
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  const contentType = mimeType || guessContentTypeFromUri(uri);
  const ext = extensionForContentType(contentType);
  const bytes = await new File(uri).bytes();
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('references')
    .upload(path, bytes, {
      contentType,
      upsert: true,
    });
  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('references')
    .createSignedUrl(path, 60 * 60);
  if (signError || !signed?.signedUrl) {
    throw new Error(signError?.message ?? 'Failed to sign reference URL');
  }
  return signed.signedUrl;
}

/**
 * Resolves every attachment to a remote URL. Attachments are uploaded
 * eagerly on attach, so this is normally a no-op pass-through — kept as a
 * defensive fallback in case anything ever reaches send still unresolved.
 */
export async function resolveReferenceUrls(
  userId: string,
  attachments: ComposerAttachment[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const attachment of attachments) {
    urls.push(await uploadReferenceImage(userId, attachment.uri));
  }
  return urls;
}

export async function generateImage(params: {
  userId: string;
  prompt: string;
  /**
   * Interpolated text from a template's guided-flow selections, if any —
   * sent separately from `prompt` so the server can give it priority and it
   * can never be silently overridden by free-text additions.
   */
  lockedPrompt?: string | null;
  aspectRatio: string;
  quality?: ImageQuality;
  imageCount?: number;
  /** How different each image in the batch should look — ignored server-side unless imageCount > 1. */
  variation?: ImageVariation;
  attachments?: ComposerAttachment[];
  conversationId?: string | null;
  templateId?: string | null;
  enhancedPrompt?: string | null;
  /** Attach the brand kit logo as a reference image. Off by default. */
  useBrandLogo?: boolean;
  /** Mention the business name in the generation prompt. Off by default. */
  useBrandName?: boolean;
  /** Apply the brand kit color palette to the generation prompt. Off by default. */
  useBrandColors?: boolean;
  /** Which generation model to use — defaults to Seedream 4.5 server-side. */
  modelId?: string;
}): Promise<{
  generationId: string;
  conversationId: string;
}> {
  const modelAttachments = modelReferenceAttachments(params.attachments ?? []);
  const referenceImages = await resolveReferenceUrls(params.userId, modelAttachments);
  // `modelReferenceAttachments` already sorts product-kind items first — the
  // server uses this count to know how many leading `reference_images` are
  // the product (vs. supporting reference/style images) without needing a
  // separate per-image role field.
  const productReferenceCount = modelAttachments.filter((a) => a.kind === 'product').length;

  // The edge function only does the fast, synchronous part inline (content
  // checks, credit debit, row creation) and returns immediately — the actual
  // provider call runs in the background (see generate-image/index.ts's
  // `EdgeRuntime.waitUntil`), so this resolves in roughly a second regardless
  // of how long the image itself takes. `waitForGeneration` below picks up
  // from here.
  const data = await invokeFunction<GenerateImageResponse>('generate-image', {
    prompt: params.prompt,
    locked_prompt: params.lockedPrompt ?? null,
    enhanced_prompt: params.enhancedPrompt ?? null,
    aspect_ratio: params.aspectRatio,
    quality: params.quality ?? '2K',
    image_count: params.imageCount ?? 1,
    variation: params.variation ?? 'balanced',
    reference_images: referenceImages,
    product_reference_count: productReferenceCount,
    conversation_id: params.conversationId ?? null,
    template_id: params.templateId ?? null,
    use_brand_logo: params.useBrandLogo ?? false,
    use_brand_name: params.useBrandName ?? false,
    use_brand_colors: params.useBrandColors ?? false,
    model: params.modelId,
  });

  return {
    generationId: data.generation_id,
    conversationId: data.conversation_id,
  };
}

/**
 * Polls a generation row until the background provider call finishes, one
 * way or another. A single failed/network-flaky poll doesn't give up early —
 * it keeps retrying until `POLL_TIMEOUT_MS`, since the generation itself is
 * still running server-side regardless of whether any one read succeeds.
 */
export async function waitForGeneration(generationId: string): Promise<GenerationOutcome> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const { data, error } = await supabase
        .from('generations')
        .select('status, error_message, generation_assets(public_url, sort_order)')
        .eq('id', generationId)
        .single();

      if (!error && data) {
        if (data.status === 'completed') {
          const imageUrls = [...(data.generation_assets ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((a) => a.public_url)
            .filter((u): u is string => Boolean(u));
          return { status: 'completed', imageUrls, errorMessage: null };
        }
        if (data.status === 'failed') {
          return {
            status: 'failed',
            imageUrls: [],
            errorMessage: data.error_message ?? 'Generation failed',
          };
        }
      }
    } catch {
      // Transient network blip — the generation keeps running server-side
      // either way, so just retry on the next tick instead of giving up.
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return {
    status: 'failed',
    imageUrls: [],
    errorMessage: 'This is taking longer than expected — check back in a moment.',
  };
}

export async function generateCaption(params: {
  generationId?: string;
  prompt?: string;
  businessName?: string;
}): Promise<string> {
  const data = await invokeFunction<{ caption: string }>('generate-caption', {
    generation_id: params.generationId,
    prompt: params.prompt,
    business_name: params.businessName,
  });
  return data.caption;
}

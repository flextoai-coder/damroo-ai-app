import { File } from 'expo-file-system';

import { invokeFunction } from '@/services/api';
import { supabase } from '@/lib/supabase';
import type { ComposerAttachment } from '@/stores/chat-composer-store';
import type { ImageQuality } from '@/stores/chat-composer-store';

type EnhanceResponse = {
  prompt?: string;
  enhanced_prompt?: string;
};

type GenerateImageResponse = {
  generation: {
    id: string;
    status: string;
    generation_assets?: Array<{
      public_url: string | null;
      storage_path: string;
      sort_order: number;
    }>;
  };
  conversation_id: string;
  assets?: Array<{ public_url: string | null }>;
  error?: string;
};

/**
 * Calls the enhance-prompt Edge Function (OpenAI).
 * Falls back to a light local rewrite if the function is unavailable.
 */
export async function enhancePrompt(prompt: string): Promise<string> {
  const trimmed = prompt.trim();
  if (!trimmed) return trimmed;

  try {
    const data = await invokeFunction<EnhanceResponse>('enhance-prompt', {
      prompt: trimmed,
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
  aspectRatio: string;
  quality?: ImageQuality;
  imageCount?: number;
  attachments?: ComposerAttachment[];
  conversationId?: string | null;
  templateId?: string | null;
  enhancedPrompt?: string | null;
  /** Attach the brand kit logo as a reference image. Defaults to true. */
  useBrandLogo?: boolean;
  /** Mention the business name in the generation prompt. Defaults to true. */
  useBrandName?: boolean;
  /** Apply the brand kit color palette to the generation prompt. Defaults to true. */
  useBrandColors?: boolean;
  /** Which generation model to use — defaults to Seedream 4.5 server-side. */
  modelId?: string;
}): Promise<{
  imageUrl: string | null;
  generationId: string;
  conversationId: string;
  imageUrls: string[];
}> {
  const referenceImages = await resolveReferenceUrls(
    params.userId,
    params.attachments ?? [],
  );

  const data = await invokeFunction<GenerateImageResponse>('generate-image', {
    prompt: params.prompt,
    enhanced_prompt: params.enhancedPrompt ?? null,
    aspect_ratio: params.aspectRatio,
    quality: params.quality ?? '2K',
    image_count: params.imageCount ?? 1,
    reference_images: referenceImages,
    conversation_id: params.conversationId ?? null,
    template_id: params.templateId ?? null,
    use_brand_logo: params.useBrandLogo ?? true,
    use_brand_name: params.useBrandName ?? true,
    use_brand_colors: params.useBrandColors ?? true,
    model: params.modelId,
  });

  const assets = data.assets ?? data.generation?.generation_assets ?? [];
  const imageUrls = assets
    .map((a) => a.public_url)
    .filter((u): u is string => Boolean(u));

  return {
    imageUrl: imageUrls[0] ?? null,
    generationId: data.generation.id,
    conversationId: data.conversation_id,
    imageUrls,
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

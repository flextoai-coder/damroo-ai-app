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

/** Upload local file URIs to the private references bucket; keep remote URLs as-is. */
export async function resolveReferenceUrls(
  userId: string,
  attachments: ComposerAttachment[],
): Promise<string[]> {
  const urls: string[] = [];

  for (const attachment of attachments) {
    if (
      attachment.uri.startsWith('http://') ||
      attachment.uri.startsWith('https://')
    ) {
      urls.push(attachment.uri);
      continue;
    }

    const response = await fetch(attachment.uri);
    const blob = await response.blob();
    const ext = blob.type.includes('png')
      ? 'png'
      : blob.type.includes('webp')
        ? 'webp'
        : 'jpg';
    const path = `${userId}/${Date.now()}_${attachment.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('references')
      .upload(path, blob, {
        contentType: blob.type || 'image/jpeg',
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
    urls.push(signed.signedUrl);
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

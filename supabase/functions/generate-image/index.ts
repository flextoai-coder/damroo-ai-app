import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { loadBrandPromptContext, withBrandContext } from '../_shared/brand-context.ts';
import { checkPromptContent } from '../_shared/content-filter.ts';
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { callGptImage } from '../_shared/gpt-image.ts';
import { callSeedream } from '../_shared/seedream.ts';
import { getServiceClient, requireUser } from '../_shared/supabase.ts';

type GenerateBody = {
  prompt?: string;
  enhanced_prompt?: string | null;
  aspect_ratio?: string;
  quality?: '2K' | '4K';
  image_count?: number;
  /** Ordered reference image URLs (http/https or storage paths resolved by client). */
  reference_images?: string[];
  conversation_id?: string | null;
  template_id?: string | null;
  /** Per-generation brand kit toggles. Default to true when omitted. */
  use_brand_logo?: boolean;
  use_brand_name?: boolean;
  use_brand_colors?: boolean;
  /** Which generation model to use — defaults to Seedream 4.5 for anything else. */
  model?: string;
};

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  let userId: string;
  try {
    ({ userId } = await requireUser(req));
  } catch (res) {
    if (res instanceof Response) return res;
    return errorResponse('Unauthorized', 401);
  }

  const service = getServiceClient();
  let generationId: string | null = null;

  try {
    const body = (await req.json()) as GenerateBody;
    const prompt = body.prompt?.trim() ?? '';
    if (!prompt) return errorResponse('prompt is required');

    const aspectRatio = body.aspect_ratio?.trim() || '1:1';
    const quality = body.quality === '4K' ? '4K' : '2K';
    const imageCount = Math.min(15, Math.max(1, Number(body.image_count ?? 1) || 1));
    const references = (body.reference_images ?? []).filter(Boolean).slice(0, 14);
    const enhanced = body.enhanced_prompt?.trim() || null;

    const promptCheck = checkPromptContent(prompt);
    const enhancedCheck = enhanced ? checkPromptContent(enhanced) : { blocked: false };
    if (promptCheck.blocked || enhancedCheck.blocked) {
      return errorResponse(
        (promptCheck.blocked ? promptCheck.reason : enhancedCheck.reason) ??
          'This prompt cannot be generated.',
        422,
        { code: 'explicit_content' },
      );
    }

    const useBrandLogo = body.use_brand_logo !== false;
    const useBrandName = body.use_brand_name !== false;
    const useBrandColors = body.use_brand_colors !== false;

    let conversationId = body.conversation_id ?? null;
    if (conversationId) {
      const { data: conv } = await service
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .maybeSingle();
      if (!conv) return errorResponse('conversation not found', 404);
    } else {
      const { data: conv, error: convError } = await service
        .from('conversations')
        .insert({
          user_id: userId,
          title: prompt.slice(0, 80),
        })
        .select('id')
        .single();
      if (convError || !conv) {
        return errorResponse(convError?.message ?? 'Failed to create conversation', 500);
      }
      conversationId = conv.id;
    }

    const { data: generation, error: genError } = await service
      .from('generations')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        template_id: body.template_id ?? null,
        prompt,
        enhanced_prompt: enhanced,
        aspect_ratio: aspectRatio,
        quality,
        image_count: imageCount,
        reference_image_paths: references,
        status: 'pending',
        credits_charged: 0,
      })
      .select('*')
      .single();

    if (genError || !generation) {
      return errorResponse(genError?.message ?? 'Failed to create generation', 500);
    }
    generationId = generation.id;

    const { error: debitError } = await service.rpc('debit_credits_for_generation', {
      p_user_id: userId,
      p_generation_id: generationId,
      p_amount: imageCount,
    });

    if (debitError) {
      const msg = debitError.message ?? 'Credit debit failed';
      await service
        .from('generations')
        .update({ status: 'failed', error_message: msg })
        .eq('id', generationId);

      if (msg.includes('insufficient_credits')) {
        return errorResponse('Insufficient credits', 402, { code: 'insufficient_credits' });
      }
      if (msg.includes('no_active_subscription')) {
        return errorResponse('No active subscription', 402, { code: 'no_active_subscription' });
      }
      return errorResponse(msg, 400);
    }

    await service.from('chat_messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'user',
      content: prompt,
      generation_id: generationId,
      attachments: references.map((uri, i) => ({ uri, order: i })),
    });

    const brandContext = await loadBrandPromptContext(service, userId, {
      includeName: useBrandName,
      includeColors: useBrandColors,
      includeLogo: useBrandLogo,
    });
    const seedreamPrompt = withBrandContext(enhanced || prompt, brandContext);

    // Brand logo first (if any and enabled), then user reference images in attachment order.
    let referenceImages = references;
    if (useBrandLogo) {
      const { data: kit } = await service
        .from('brand_kits')
        .select('logo_storage_path')
        .eq('user_id', userId)
        .maybeSingle();
      if (kit?.logo_storage_path) {
        const { data: signed } = await service.storage
          .from('brand-assets')
          .createSignedUrl(kit.logo_storage_path, 60 * 30);
        if (signed?.signedUrl) {
          referenceImages = [signed.signedUrl, ...references].slice(0, 14);
        }
      }
    }

    const useGptImage = body.model === 'gpt-image-2';

    let rawAssets: Array<{ bytes: Uint8Array; contentType: string }>;
    if (useGptImage) {
      const { assets: gptAssets } = await callGptImage({
        prompt: seedreamPrompt,
        aspectRatio,
        quality,
        imageCount,
        referenceImages,
      });
      rawAssets = gptAssets.map((a) => ({
        bytes: base64ToUint8Array(a.base64),
        contentType: a.contentType,
      }));
    } else {
      const { urls } = await callSeedream({
        prompt: seedreamPrompt,
        aspectRatio,
        quality,
        imageCount,
        referenceImages,
      });
      rawAssets = [];
      for (let i = 0; i < urls.length; i++) {
        const downloaded = await fetch(urls[i]);
        if (!downloaded.ok) {
          throw new Error(`Failed to download Seedream asset ${i + 1} (status ${downloaded.status})`);
        }
        const contentType = downloaded.headers.get('content-type') ?? 'image/jpeg';
        if (!contentType.startsWith('image/')) {
          // Seedream's CDN occasionally serves a non-image response (e.g. a
          // transient error page) with a 200 status — fail clearly here
          // instead of letting Storage reject it later with an opaque error.
          throw new Error(
            `Seedream asset ${i + 1} came back as "${contentType}" instead of an image. Please try again.`,
          );
        }
        rawAssets.push({
          bytes: new Uint8Array(await downloaded.arrayBuffer()),
          contentType,
        });
      }
    }

    const assets: Array<{
      generation_id: string;
      storage_path: string;
      public_url: string;
      sort_order: number;
    }> = [];

    for (let i = 0; i < rawAssets.length; i++) {
      const { bytes, contentType } = rawAssets[i];
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const storagePath = `${userId}/${generationId}/${i}.${ext}`;

      const { error: uploadError } = await service.storage
        .from('generations')
        .upload(storagePath, bytes, { contentType, upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { data: signed, error: signError } = await service.storage
        .from('generations')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
      if (signError || !signed?.signedUrl) {
        throw new Error(signError?.message ?? 'Failed to sign storage URL');
      }

      assets.push({
        generation_id: generationId,
        storage_path: storagePath,
        public_url: signed.signedUrl,
        sort_order: i,
      });
    }

    const { error: assetError } = await service.from('generation_assets').insert(assets);
    if (assetError) throw new Error(assetError.message);

    const { data: completed, error: completeError } = await service
      .from('generations')
      .update({ status: 'completed', error_message: null })
      .eq('id', generationId)
      .select('*, generation_assets(*)')
      .single();
    if (completeError) throw new Error(completeError.message);

    await service.from('chat_messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'assistant',
      content: `Generated ${assets.length} image(s)`,
      generation_id: generationId,
      attachments: assets.map((a) => ({ uri: a.public_url, storage_path: a.storage_path })),
    });

    const sorted = {
      ...completed,
      generation_assets: [...(completed.generation_assets ?? [])].sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
      ),
    };

    return jsonResponse({
      generation: sorted,
      conversation_id: conversationId,
      assets: sorted.generation_assets,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Generation failed';
    if (generationId) {
      await service.rpc('refund_credits_for_generation', {
        p_user_id: userId,
        p_generation_id: generationId,
      });
      await service
        .from('generations')
        .update({ status: 'failed', error_message: message })
        .eq('id', generationId);
    }
    return errorResponse(message, 500, {
      generation_id: generationId,
      refunded: Boolean(generationId),
    });
  }
});

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { loadBrandPromptContext, withBrandContext } from '../_shared/brand-context.ts';
import { checkPromptContent } from '../_shared/content-filter.ts';
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient, requireUser } from '../_shared/supabase.ts';

type EnhanceBody = {
  prompt?: string;
  aspect_ratio?: string;
  /** Ordered reference image URLs — the enhancer sees these, it doesn't just read their captions. */
  reference_images?: string[];
  /** Per-generation brand kit toggles. Off by default when omitted. */
  use_brand_logo?: boolean;
  use_brand_name?: boolean;
  use_brand_colors?: boolean;
};

type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

const MAX_VISION_IMAGES = 4;

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

  try {
    const body = (await req.json()) as EnhanceBody;
    const trimmed = body.prompt?.trim() ?? '';
    if (!trimmed) return errorResponse('prompt is required');

    const contentCheck = checkPromptContent(trimmed);
    if (contentCheck.blocked) {
      return errorResponse(contentCheck.reason ?? 'This prompt cannot be processed.', 422, {
        code: 'explicit_content',
      });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return errorResponse('OPENAI_API_KEY is not configured', 500);

    const aspectRatio = body.aspect_ratio?.trim() || null;
    const referenceImages = (body.reference_images ?? []).filter(Boolean).slice(0, MAX_VISION_IMAGES);
    const useBrandLogo = body.use_brand_logo === true;
    const useBrandName = body.use_brand_name === true;
    const useBrandColors = body.use_brand_colors === true;

    const service = getServiceClient();
    const brandContext = await loadBrandPromptContext(service, userId, {
      includeName: useBrandName,
      includeColors: useBrandColors,
      includeLogo: useBrandLogo,
    });

    let textBlock = trimmed;
    if (aspectRatio) {
      textBlock += `\n\nTarget aspect ratio: ${aspectRatio}.`;
    }
    if (referenceImages.length > 0) {
      textBlock += `\n\n${referenceImages.length} reference image(s) are attached below — use them as visual guidance (style, subject, composition) when enhancing the prompt.`;
    }
    textBlock = withBrandContext(textBlock, brandContext);

    const contentParts: ChatContentPart[] = [{ type: 'text', text: textBlock }];
    for (const url of referenceImages) {
      contentParts.push({ type: 'image_url', image_url: { url } });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_ENHANCE_MODEL') ?? 'gpt-4o-mini',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              "You enhance image-generation prompts for Indian SMB marketing creatives (posters, stories, offers). Use whatever context is given — the user's minimal prompt, any attached reference image(s), the target aspect ratio, and any brand kit instructions — to write a single, richer prompt. Keep the user's core intent. If reference images are attached, describe how the new image should relate to them (style, subject, composition) rather than ignoring them. If brand kit instructions are present, weave them in exactly as specified — do not invent additional brand details beyond what's given. Add lighting, composition, and material/texture detail appropriate for a premium marketing creative. Return only the improved prompt text — no quotes, no preamble, no explanation.",
          },
          { role: 'user', content: contentParts },
        ],
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      const msg = json?.error?.message ?? `OpenAI error ${res.status}`;
      return errorResponse(msg, 502);
    }

    const enhanced = json?.choices?.[0]?.message?.content?.trim() || trimmed;

    return jsonResponse({ enhanced_prompt: enhanced, prompt: enhanced });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Enhance failed', 500);
  }
});

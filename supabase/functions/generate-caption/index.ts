import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient, requireUser } from '../_shared/supabase.ts';

/** Strips emoji/emoticon characters the model may add despite the prompt instruction. */
function stripEmojis(text: string): string {
  return text
    .replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +\n/g, '\n')
    .trim();
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

  try {
    const body = (await req.json()) as {
      generation_id?: string;
      prompt?: string;
      business_name?: string;
    };

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return errorResponse('OPENAI_API_KEY is not configured', 500);

    const service = getServiceClient();
    let prompt = body.prompt?.trim() ?? '';
    let generationId = body.generation_id ?? null;

    if (generationId) {
      const { data: gen, error } = await service
        .from('generations')
        .select('id, prompt, user_id')
        .eq('id', generationId)
        .maybeSingle();
      if (error || !gen || gen.user_id !== userId) {
        return errorResponse('Generation not found', 404);
      }
      prompt = prompt || gen.prompt;
    }

    if (!prompt) return errorResponse('prompt or generation_id is required');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_CAPTION_MODEL') ?? 'gpt-4o-mini',
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content:
              'Write a short Instagram-ready caption for an Indian small-business marketing image. Include 4–8 relevant hashtags. Do not use any emojis, emoticons, or decorative symbols anywhere in the caption or hashtags. Return plain text only.',
          },
          {
            role: 'user',
            content: [
              body.business_name ? `Business: ${body.business_name}` : null,
              `Image prompt: ${prompt}`,
            ]
              .filter(Boolean)
              .join('\n'),
          },
        ],
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      return errorResponse(json?.error?.message ?? `OpenAI error ${res.status}`, 502);
    }

    const rawText = json?.choices?.[0]?.message?.content?.trim();
    if (!rawText) return errorResponse('Empty caption from model', 502);
    const text = stripEmojis(rawText);
    if (!text) return errorResponse('Empty caption from model', 502);

    if (generationId) {
      const { data: caption, error } = await service
        .from('captions')
        .insert({ generation_id: generationId, user_id: userId, text })
        .select('*')
        .single();
      if (error) return errorResponse(error.message, 500);
      return jsonResponse({ caption: text, record: caption });
    }

    return jsonResponse({ caption: text });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Caption failed', 500);
  }
});

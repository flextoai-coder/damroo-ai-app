import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { loadBrandPromptContext, withBrandContext } from '../_shared/brand-context.ts';
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient, requireUser } from '../_shared/supabase.ts';

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
    const { prompt } = (await req.json()) as { prompt?: string };
    const trimmed = prompt?.trim() ?? '';
    if (!trimmed) return errorResponse('prompt is required');

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return errorResponse('OPENAI_API_KEY is not configured', 500);

    const service = getServiceClient();
    const brandContext = await loadBrandPromptContext(service, userId);
    const promptWithBrand = withBrandContext(trimmed, brandContext);

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
              'You enhance image-generation prompts for Indian SMB marketing creatives (posters, stories, offers). Keep the user intent, weave in the brand kit colors/tone/typography when provided, and add lighting, composition, and brand-safe detail. Return only the improved prompt text — no quotes or preamble.',
          },
          { role: 'user', content: promptWithBrand },
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

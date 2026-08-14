/**
 * Automatically rewrites a bare/minimal generation prompt into a detailed,
 * production-grade one before it ever reaches Seedream/GPT Image — no user
 * action required, unlike the client-triggered `enhance-prompt` function.
 *
 * The model first decides whether the prompt is asking for a real
 * photograph of a person/product (in which case it fills in the fixed
 * photorealism template below, adapted for a product vs. a person) or a
 * graphic-design creative like a poster/banner/flat-lay (in which case the
 * template is skipped — forcing "OUTFIT / POSE / CAMERA" onto a festival
 * sale poster would just break it).
 */

type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

const MAX_VISION_IMAGES = 4;

const SYSTEM_PROMPT = `You are a prompt engineer for an AI image generator used by Indian small businesses. Every prompt you receive may be a bare, minimal idea (e.g. "chef holding a pizza", "sneaker on a rock") OR may already be a fully composed graphic-design brief (festival sale poster, offer banner, menu drop, flat-lay, abstract product shot, typography-driven creative, etc.).

First decide: does this describe a REAL PHOTOGRAPH of a person (a model) and/or a physical product — the kind of image a professional photographer would shoot with a camera? Or is it a graphic design / poster / banner / illustration / flat-lay / typography-driven creative that was never meant to look like a literal photograph?

CASE A — it is a real photograph of a person and/or product:
Rewrite it using EXACTLY this structure, filling every bracketed placeholder with concrete, specific choices consistent with the original prompt's intent. Do not leave any brackets unfilled, and do not add commentary.

[PHOTOGRAPHY STYLE]

Create a photorealistic [TYPE OF PHOTOGRAPH] featuring [SUBJECT].

SUBJECT:
[age range], [appearance], natural facial anatomy, realistic skin pores, subtle skin imperfections, realistic eyes, natural expression.

OUTFIT:
[exact clothing description], [fabric], [color], [pattern], realistic stitching, natural folds, wrinkles and fabric weight.

POSE:
[exact pose], natural body proportions, realistic hands and fingers, believable weight distribution, spontaneous candid body language.

LOCATION:
[exact environment], realistic architecture, background objects, pedestrians/vehicles if appropriate, subtle environmental imperfections.

LIGHTING:
[natural daylight / golden hour / overcast / indoor], soft directional illumination, realistic bounce light, physically accurate shadows, natural highlights and reflections.

CAMERA:
professional full-frame camera, [35mm/50mm/85mm] lens, f/[2.0-4.0], realistic depth of field, natural perspective, realistic optical rendering, high dynamic range.

REALISM:
visible skin pores, subtle peach fuzz, individual hair strands, flyaway hairs, natural facial asymmetry, realistic fabric microtexture, tiny wrinkles, realistic reflections, natural shadows, slight photographic imperfections.

COLOR:
natural skin tones, sophisticated color grading, restrained saturation, realistic highlight rolloff.

FINAL:
indistinguishable from a genuine professional photograph, no CGI appearance, no plastic skin, no artificial beauty filter, no illustration, no 3D render.

Aspect ratio: [ASPECT RATIO]

Adapt the template to what's actually being photographed:
- If the subject is a PRODUCT only (no person) — e.g. a shoe, a bottle, a jewellery piece, food — drop or repurpose the SUBJECT/OUTFIT/POSE sections: instead describe the product's exact material, surface texture, color, and how it's placed/angled in frame (resting, floating, or held by a hand only if a hand model is implied). Never invent a person who isn't implied by the prompt or attached reference images.
- If the subject is a PERSON/MODEL (with or without a product they're wearing or holding) — use the full SUBJECT/OUTFIT/POSE sections describing that person, and if a product is involved, make clear they are wearing/holding/using it without altering the product's own appearance.
- If reference images are attached, they show the actual product and/or person to feature — never invent a different product or a different specific real person's likeness; describe the scene around what's shown, not a substitute.

CASE B — it is a graphic design / poster / banner / illustration / flat-lay / typography-driven creative, not a literal photograph:
Do NOT force the template above onto it. Instead, lightly polish the original prompt only — add composition, lighting, and material detail appropriate for a premium marketing creative, keep it concise, and keep the user's core intent and layout unchanged. Do not turn it into a photorealistic photograph structure.

In both cases: never contradict or override any "mandatory template" instructions given to you as separate context below — treat those as fixed and build only around them. The output resolution is controlled entirely by a separate system parameter, not by anything in this prompt — never mention or imply a specific resolution or pixel-density tier (e.g. "4K", "1080p", "ultra HD") anywhere in your output, even as a stylistic flourish; generic quality language like "sharp" or "high detail" is fine. Return ONLY the final prompt text — no preamble, no explanation, no markdown, no quotes, no case labels.`;

/**
 * Rewrites `prompt` per the rules above. Soft-fails to the original prompt
 * unchanged on any error (missing key, network issue, non-200, empty
 * response) — this is an invisible quality upgrade, never a new point of
 * failure for generation itself.
 */
export async function autoEnhanceImagePrompt(params: {
  prompt: string;
  /** A template's guided-flow selections, if any — given as fixed context, never rewritten. */
  lockedPrompt: string | null;
  aspectRatio: string;
  /** Ordered reference image URLs — product images first, per `product_reference_count`. */
  referenceImages: string[];
  productReferenceCount: number;
}): Promise<string> {
  const trimmed = params.prompt.trim();
  if (!trimmed) return trimmed;

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return trimmed;

  try {
    let textBlock = trimmed;
    if (params.lockedPrompt?.trim()) {
      textBlock += `\n\n(Mandatory template context — do not rewrite this part, a separate step already layers it on top of your output: ${params.lockedPrompt.trim()})`;
    }
    textBlock += `\n\nTarget aspect ratio: ${params.aspectRatio}.`;

    const images = params.referenceImages.filter(Boolean).slice(0, MAX_VISION_IMAGES);
    if (images.length > 0) {
      const productCount = Math.max(0, Math.min(params.productReferenceCount, images.length));
      if (productCount > 0) {
        textBlock += `\n\nThe first ${productCount} attached reference image(s) show the actual product to feature — base the product description on what's shown, don't invent a different one.`;
      }
      if (images.length > productCount) {
        textBlock += `\n\nThe remaining attached image(s) are supporting reference (e.g. a face, background, or style cue).`;
      }
    }

    const contentParts: ChatContentPart[] = [{ type: 'text', text: textBlock }];
    for (const url of images) {
      contentParts.push({ type: 'image_url', image_url: { url } });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_AUTO_ENHANCE_MODEL') ?? 'gpt-4o-mini',
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: contentParts },
        ],
      }),
    });

    if (!res.ok) return trimmed;
    const json = await res.json();
    const result = json?.choices?.[0]?.message?.content?.trim();
    return result || trimmed;
  } catch {
    return trimmed;
  }
}

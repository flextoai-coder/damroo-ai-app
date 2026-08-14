const GENERATIONS_URL = 'https://api.openai.com/v1/images/generations';
const EDITS_URL = 'https://api.openai.com/v1/images/edits';
const DEFAULT_MODEL = 'gpt-image-2';

/**
 * Pixel sizes for GPT Image 2 by aspect ratio, within OpenAI's constraints:
 * both edges must be multiples of 16px, max edge <= 3840px, long:short ratio
 * <= 3:1, and total pixels between 655,360 and 8,294,400.
 */
export function sizeForAspectGptImage(aspectRatio: string, quality: '2K' | '4K'): string {
  const table2k: Record<string, string> = {
    '1:1': '2048x2048',
    '4:5': '1664x2080',
    '3:4': '1536x2048',
    '9:16': '1152x2048',
    '16:9': '2048x1152',
    '4:3': '2048x1536',
  };
  const table4k: Record<string, string> = {
    '1:1': '2880x2880',
    '4:5': '2560x3200',
    '3:4': '2448x3264',
    '9:16': '2160x3840',
    '16:9': '3840x2160',
    '4:3': '3264x2448',
  };
  const table = quality === '4K' ? table4k : table2k;
  return table[aspectRatio] ?? (quality === '4K' ? '2880x2880' : '2048x2048');
}

export type GptImageAsset = {
  base64: string;
  contentType: string;
};

export type GptImageResult = {
  assets: GptImageAsset[];
};

export async function callGptImage(params: {
  prompt: string;
  aspectRatio: string;
  quality: '2K' | '4K';
  imageCount: number;
  /** Ordered reference image URLs — order is sacred. */
  referenceImages?: string[];
}): Promise<GptImageResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const model = Deno.env.get('OPENAI_IMAGE_MODEL') ?? DEFAULT_MODEL;
  // 'high' regularly takes ~180s per image. `generate-image/index.ts` runs
  // this via `EdgeRuntime.waitUntil`, which on paid Supabase plans gets a
  // 400s background-task ceiling (180s fits fine) — but on the Free plan
  // that ceiling is only 150s, so a 'high'-quality run gets silently killed
  // mid-flight: no error, no refund, the generation row just sits at
  // 'pending' forever. Stay on 'medium' (~50s, well inside 150s) for both
  // quality tiers until this project is confirmed on a paid plan — the 4K
  // *pixel size* (sizeForAspectGptImage below) is unaffected either way,
  // this only trades OpenAI's internal render effort. `OPENAI_IMAGE_QUALITY`
  // remains an override for whoever re-enables 'high' after upgrading.
  const renderQuality = Deno.env.get('OPENAI_IMAGE_QUALITY') ?? 'medium';
  const size = sizeForAspectGptImage(params.aspectRatio, params.quality);
  const prompt = `${params.prompt}\n\nAspect ratio: ${params.aspectRatio}.`;

  let res: Response;

  if (params.referenceImages?.length) {
    // Image edits endpoint — takes reference images as multipart form data.
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', size);
    form.append('quality', renderQuality);
    form.append('n', String(params.imageCount));

    for (let i = 0; i < params.referenceImages.length; i++) {
      const refRes = await fetch(params.referenceImages[i]);
      if (!refRes.ok) {
        throw new Error(`Failed to fetch reference image ${i + 1} (status ${refRes.status})`);
      }
      const refContentType = refRes.headers.get('content-type') ?? '';
      if (!refContentType.startsWith('image/')) {
        throw new Error(
          `Reference image ${i + 1} came back as "${refContentType || 'unknown type'}" instead of an image.`,
        );
      }
      const blob = await refRes.blob();
      form.append('image[]', blob, `reference-${i}.png`);
    }

    res = await fetch(EDITS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } else {
    res = await fetch(GENERATIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        size,
        quality: renderQuality,
        n: params.imageCount,
      }),
    });
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { error?: { message?: string } })?.error?.message ?? `GPT Image error ${res.status}`;
    throw new Error(msg);
  }

  const data = (json as { data?: Array<{ b64_json?: string }> }).data ?? [];
  const assets = data
    .filter((d): d is { b64_json: string } => Boolean(d.b64_json))
    .map((d) => ({ base64: d.b64_json, contentType: 'image/png' }));

  if (assets.length === 0) {
    throw new Error('GPT Image returned no image data');
  }

  return { assets };
}

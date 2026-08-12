const DEFAULT_BASE = 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';
const DEFAULT_MODEL = 'seedream-4-5-251128';

/** Pixel sizes for Seedream 4.5 (2K / 4K) by aspect ratio. */
export function sizeForAspect(aspectRatio: string, quality: '2K' | '4K'): string {
  const table2k: Record<string, string> = {
    '1:1': '2048x2048',
    '4:5': '1728x2160',
    '3:4': '1728x2304',
    '9:16': '1600x2848',
    '16:9': '2848x1600',
    '4:3': '2304x1728',
  };
  const table4k: Record<string, string> = {
    '1:1': '4096x4096',
    '4:5': '3456x4320',
    '3:4': '3520x4704',
    '9:16': '3040x5504',
    '16:9': '5504x3040',
    '4:3': '4704x3520',
  };
  const table = quality === '4K' ? table4k : table2k;
  return table[aspectRatio] ?? (quality === '4K' ? '4096x4096' : '2048x2048');
}

export type SeedreamResult = {
  urls: string[];
};

export async function callSeedream(params: {
  prompt: string;
  aspectRatio: string;
  quality: '2K' | '4K';
  imageCount: number;
  /** Ordered reference image URLs — order is sacred. */
  referenceImages?: string[];
}): Promise<SeedreamResult> {
  const apiKey = Deno.env.get('ARK_API_KEY');
  if (!apiKey) throw new Error('ARK_API_KEY is not configured');

  const base = Deno.env.get('ARK_BASE_URL') ?? DEFAULT_BASE;
  const model = Deno.env.get('ARK_MODEL') ?? DEFAULT_MODEL;
  const size = sizeForAspect(params.aspectRatio, params.quality);

  // Ark's `sequential_image_generation` mode lets the model decide how to
  // satisfy a multi-image request — without a blunt, front-loaded directive
  // it can "satisfy" the count by packing several looks into one collaged
  // frame instead of returning N independent images. Stating the count in
  // plain terms right at the start of the prompt (highest-attention
  // position) fixes that; `withVariationContext` restates it again near the
  // end for redundancy, but this is the instruction that actually lands.
  const sequentialDirective =
    params.imageCount > 1
      ? `Generate exactly ${params.imageCount} separate images for this one request — each a complete, independent, single full-frame image. Do not combine them into one collage, grid, split-screen, or side-by-side comparison frame.\n\n`
      : '';

  const body: Record<string, unknown> = {
    model,
    prompt: `${sequentialDirective}${params.prompt}\n\nAspect ratio: ${params.aspectRatio}.`,
    size,
    response_format: 'url',
    watermark: false,
    stream: false,
  };

  if (params.imageCount > 1) {
    body.sequential_image_generation = 'auto';
    body.sequential_image_generation_options = { max_images: params.imageCount };
  } else {
    body.sequential_image_generation = 'disabled';
  }

  if (params.referenceImages?.length) {
    // Preserve attachment order for Seedream.
    body.image =
      params.referenceImages.length === 1
        ? params.referenceImages[0]
        : params.referenceImages;
  }

  const res = await fetch(base, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { error?: { message?: string }; message?: string })?.error?.message ??
      (json as { message?: string })?.message ??
      `Seedream error ${res.status}`;
    throw new Error(msg);
  }

  const data = (json as { data?: Array<{ url?: string; b64_json?: string }> }).data ?? [];
  const urls = data.map((d) => d.url).filter((u): u is string => Boolean(u));
  if (urls.length === 0) {
    throw new Error('Seedream returned no image URLs');
  }
  return { urls };
}

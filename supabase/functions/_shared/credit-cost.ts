/** Mirrors `creditsPerImage` in src/constants/playground.ts — keep in sync. */
export function creditsPerImage(model: string | undefined, quality: '2K' | '4K'): number {
  if (model === 'gpt-image-2') {
    return quality === '4K' ? 60 : 25;
  }
  // Seedream 4.5 (default model).
  return quality === '4K' ? 50 : 20;
}

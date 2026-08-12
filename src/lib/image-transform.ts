import { PixelRatio } from 'react-native';

/** Caps how much device pixel density inflates the requested size — a thumbnail never needs 3x/4x. */
const MAX_SCALE = 2;

const WESERV_ENDPOINT = 'https://images.weserv.nl/';

export type ImageResizeSize = {
  /** Display width in logical points (not device pixels). */
  width: number;
  /** Display height in logical points. Omit for proportional width-only scaling. */
  height?: number;
};

/**
 * Rewrites any http(s) image URL (Supabase Storage — signed or public —
 * Unsplash fallbacks, anything) through images.weserv.nl's free resizing
 * proxy, so the device downloads/decodes an appropriately-sized image
 * instead of the full 2-4MB generated/uploaded file. This is what was
 * causing slow first-loads in lists, grids, and chat bubbles.
 *
 * Supabase's own Storage image-transform endpoint would be the first-party
 * alternative, but it returns 403 FeatureNotEnabled on this project's plan
 * (a Pro-tier add-on) — weserv.nl needs no plan upgrade and works today.
 *
 * Falls back to the untouched source URL for anything that isn't an
 * http(s) URL (e.g. a local file:// URI mid-upload) — always safe to call.
 */
export function resizedImageUrl(sourceUrl: string, size: ImageResizeSize): string;
export function resizedImageUrl(
  sourceUrl: string | null | undefined,
  size: ImageResizeSize,
): string | null | undefined;
export function resizedImageUrl(
  sourceUrl: string | null | undefined,
  size: ImageResizeSize,
): string | null | undefined {
  if (!sourceUrl) return sourceUrl;
  if (!sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://')) return sourceUrl;

  const scale = Math.min(PixelRatio.get(), MAX_SCALE);
  const params = new URLSearchParams({
    url: sourceUrl,
    w: String(Math.round(size.width * scale)),
    q: '70',
    output: 'webp',
  });
  if (size.height) {
    params.set('h', String(Math.round(size.height * scale)));
    params.set('fit', 'cover');
  }

  return `${WESERV_ENDPOINT}?${params.toString()}`;
}

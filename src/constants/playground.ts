export type PlaygroundModel = {
  id: string;
  name: string;
  description: string;
};

export type PlaygroundFormat = {
  id: string;
  label: string;
  /** width / height */
  ratio: number;
  swatchW: number;
  swatchH: number;
};

export const PLAYGROUND_MODELS: PlaygroundModel[] = [
  {
    id: 'seedream-4.5',
    name: 'Seedream 4.5',
    description: 'ByteDance flagship for branded posters & product shots',
  },
  {
    id: 'gpt-image-2',
    name: 'GPT Image 2',
    description: 'OpenAI’s latest — strong text rendering & instruction-following',
  },
];

export const DEFAULT_MODEL_ID = PLAYGROUND_MODELS[0].id;

export const PLAYGROUND_FORMATS: PlaygroundFormat[] = [
  { id: '1:1', label: '1:1', ratio: 1, swatchW: 36, swatchH: 36 },
  { id: '4:5', label: '4:5', ratio: 4 / 5, swatchW: 30, swatchH: 38 },
  { id: '3:4', label: '3:4', ratio: 3 / 4, swatchW: 30, swatchH: 40 },
  { id: '9:16', label: '9:16', ratio: 9 / 16, swatchW: 24, swatchH: 42 },
  { id: '16:9', label: '16:9', ratio: 16 / 9, swatchW: 44, swatchH: 25 },
  { id: '4:3', label: '4:3', ratio: 4 / 3, swatchW: 40, swatchH: 30 },
];

export const DEFAULT_FORMAT_ID = '1:1';

export type PlaygroundQuality = {
  id: '2K' | '4K';
  label: string;
  description: string;
};

export const PLAYGROUND_QUALITIES: PlaygroundQuality[] = [
  { id: '2K', label: '2K', description: 'Fast — great for most posts' },
  { id: '4K', label: '4K', description: 'Sharper detail, takes a bit longer' },
];

export const MIN_IMAGE_COUNT = 1;
export const MAX_IMAGE_COUNT = 4;

export type PlaygroundVariation = {
  id: 'subtle' | 'balanced' | 'bold';
  label: string;
  description: string;
};

/**
 * How different each image in a multi-image batch should look from the
 * others — only meaningful when generating more than one image at once.
 * The product/reference subject's identity is never part of what varies;
 * this only affects style, pose, camera angle, and composition.
 */
export const PLAYGROUND_VARIATIONS: PlaygroundVariation[] = [
  { id: 'subtle', label: 'Subtle', description: 'Same look, minor tweaks' },
  { id: 'balanced', label: 'Balanced', description: 'Different pose & angle' },
  { id: 'bold', label: 'Bold', description: 'Distinct style each time' },
];

export const DEFAULT_VARIATION_ID: PlaygroundVariation['id'] = 'balanced';

/** Rotating inspiration text shown on the empty Playground screen — not clickable. */
export const PLAYGROUND_PROMPT_TIPS = [
  'Diwali offer poster for my cafe',
  'New menu launch story',
  'Weekend brunch Instagram post',
  'Festive sale banner',
] as const;

export function formatById(id: string): PlaygroundFormat {
  return PLAYGROUND_FORMATS.find((f) => f.id === id) ?? PLAYGROUND_FORMATS[0];
}

export function modelById(id: string): PlaygroundModel {
  return PLAYGROUND_MODELS.find((m) => m.id === id) ?? PLAYGROUND_MODELS[0];
}

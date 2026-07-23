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
    id: 'seedream-4.5-fast',
    name: 'Seedream Fast',
    description: 'Quicker drafts when you are iterating on layout',
  },
  {
    id: 'seedream-4.5-detail',
    name: 'Seedream Detail',
    description: 'Higher fidelity textures for hero creatives',
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

export const SUGGESTION_CHIPS = [
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

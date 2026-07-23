export type BusinessTypeId =
  | 'ecommerce'
  | 'retail'
  | 'gym'
  | 'cafe'
  | 'restaurant'
  | 'others';

export type BusinessType = {
  id: BusinessTypeId;
  label: string;
  icon: 'globe' | 'tag' | 'heart' | 'sparkles' | 'star' | 'grid';
};

export const BUSINESS_TYPES: BusinessType[] = [
  { id: 'ecommerce', label: 'Ecommerce', icon: 'globe' },
  { id: 'retail', label: 'Retail Shop', icon: 'tag' },
  { id: 'gym', label: 'Gym', icon: 'heart' },
  { id: 'cafe', label: 'Cafe', icon: 'sparkles' },
  { id: 'restaurant', label: 'Restaurant', icon: 'star' },
  { id: 'others', label: 'Others', icon: 'grid' },
];

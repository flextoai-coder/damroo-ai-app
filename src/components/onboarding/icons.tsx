import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function PersonIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={1.8} />
      <Path
        d="M5.5 19.5c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function StarIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.8l2.2 4.6 5 .7-3.6 3.5.9 5.1L12 15.4 7.5 17.7l.9-5.1L4.8 9.1l5-.7L12 3.8z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GlobeIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={1.8} />
      <Path
        d="M4.5 12h15M12 4.5c2.2 2.4 3.3 4.8 3.3 7.5S14.2 17.1 12 19.5C9.8 17.1 8.7 14.7 8.7 12S9.8 6.9 12 4.5z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TagIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.8 12.2V4.8h7.4l8.2 8.2-7.4 7.4L3.8 12.2z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Circle cx="8.2" cy="8.2" r="1.2" fill={color} />
    </Svg>
  );
}

export function HeartIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19.2s-6.8-4.2-6.8-9A3.8 3.8 0 0112 7.2a3.8 3.8 0 016.8 3c0 4.8-6.8 9-6.8 9z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SparklesIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5l1.2 4.2L17.5 9 13.2 10.3 12 14.5l-1.2-4.2L6.5 9l4.3-1.3L12 3.5z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GridIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4.5" y="4.5" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.7} />
      <Rect x="13.5" y="4.5" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.7} />
      <Rect x="4.5" y="13.5" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.7} />
      <Rect x="13.5" y="13.5" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function InstagramIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="4.5" stroke={color} strokeWidth={1.7} />
      <Circle cx="12" cy="12" r="3.6" stroke={color} strokeWidth={1.7} />
      <Circle cx="17.2" cy="6.8" r="1" fill={color} />
    </Svg>
  );
}

export function LinkedInIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth={1.7} />
      <Path d="M8 10.2V16.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="8" cy="7.8" r="1" fill={color} />
      <Path
        d="M11.2 16.5v-3.6c0-1.5.9-2.4 2.2-2.4 1.2 0 2 .8 2 2.3v3.7"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function EditIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.2 5.8l4 4M5.5 18.5l1.8-6.4L16.6 2.8l4.6 4.6-9.3 9.3-6.4 1.8z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CheckIcon({ size = 14, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5l4.5 4.5L19 7"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 20, color = '#334155' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5.5L8.5 12 15 18.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

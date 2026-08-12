import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

export function SettingsGearIcon({ size = 18, color = '#0F172A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M19.4 13a7.7 7.7 0 000-2l2-1.5-2-3.5-2.4 1a7.6 7.6 0 00-1.7-1L15 3h-6l-.3 2.9a7.6 7.6 0 00-1.7 1l-2.4-1-2 3.5L4.6 11a7.7 7.7 0 000 2l-2 1.5 2 3.5 2.4-1a7.6 7.6 0 001.7 1L9 21h6l.3-2.9a7.6 7.6 0 001.7-1l2.4 1 2-3.5-2-1.5z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EditPencilIcon({ size = 16, color = '#0F172A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M12.5 7l4.5 4.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 16, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CrownIcon({ size = 18, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 17l2.5-10L9.5 12 12 5l2.5 7L18.5 7 21 17H3z"
        fill={color}
        opacity={0.95}
      />
      <Rect x="4" y="17" width="16" height="3" rx="1" fill={color} />
    </Svg>
  );
}

export function CheckIcon({ size = 12, color = '#FFFFFF' }: IconProps) {
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

export function PaletteIcon({ size = 18, color = '#EA580C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a9 9 0 00-1.5 17.9c.8.1 1.3-.4 1.3-1.1v-.7c0-.7.5-1.3 1.2-1.4A7 7 0 1012 3z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Circle cx="7.5" cy="10" r="1.2" fill={color} />
      <Circle cx="10.5" cy="7" r="1.2" fill={color} />
      <Circle cx="14.5" cy="7.5" r="1.2" fill={color} />
      <Circle cx="16.5" cy="11" r="1.2" fill={color} />
    </Svg>
  );
}

export function PersonIcon({ size = 16, color = '#EA580C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={1.8} />
      <Path
        d="M5 19.5c1.5-3.2 4-4.8 7-4.8s5.5 1.6 7 4.8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BuildingIcon({ size = 16, color = '#EA580C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth={1.8} />
      <Path d="M9 21v-6h6v6" stroke={color} strokeWidth={1.8} />
      <Path d="M8 8h2M14 8h2M8 12h2M14 12h2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function GlobeIcon({ size = 16, color = '#EA580C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={1.8} />
      <Path d="M4 12h16M12 4c2.5 2.8 2.5 13.2 0 16M12 4c-2.5 2.8-2.5 13.2 0 16" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export function CardIcon({ size = 16, color = '#EA580C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth={1.8} />
      <Path d="M3 10h18" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function CancelSubscriptionIcon({ size = 16, color = '#DC2626' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
      <Path d="M9 9l6 6M15 9l-6 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ReceiptIcon({ size = 16, color = '#EA580C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3h10v18l-2-1.2L13 21l-2-1.2L9 21l-2-1.2V3z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M10 8h4M10 12h4M10 16h2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function InstagramIcon({ size = 16, color = '#E1306C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke={color} strokeWidth={1.8} />
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={1.8} />
      <Circle cx="17.2" cy="6.8" r="1" fill={color} />
    </Svg>
  );
}

export function FacebookIcon({ size = 16, color = '#1877F2' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.5l.5-3H13v-2c0-.6.4-1 1-1z"
        fill={color}
      />
    </Svg>
  );
}

export function LinkedInIcon({ size = 16, color = '#0A66C2' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="3.5" width="17" height="17" rx="2.5" stroke={color} strokeWidth={1.7} />
      <Path d="M8 10.5V17M8 7.5v.1" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M12 17v-3.8c0-1.4.9-2.2 2.1-2.2 1.1 0 1.9.7 1.9 2.1V17"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SparkPlanIcon({ size = 16, color = '#EA580C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z"
        fill={color}
      />
    </Svg>
  );
}

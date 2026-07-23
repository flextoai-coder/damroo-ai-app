import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function HomeTabIcon({ size = 23, color = '#9CA3AF', strokeWidth = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 10.8L12 4.5l7.5 6.3V19a1.5 1.5 0 01-1.5 1.5h-3.5v-5.2h-5V20.5H6A1.5 1.5 0 014.5 19v-8.2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TemplatesTabIcon({
  size = 23,
  color = '#9CA3AF',
  strokeWidth = 1.7,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="6.5" height="6.5" rx="1.4" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" stroke={color} strokeWidth={strokeWidth} />
      <Rect
        x="13.5"
        y="13.5"
        width="6.5"
        height="6.5"
        rx="1.4"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function BrandKitTabIcon({
  size = 23,
  color = '#9CA3AF',
  strokeWidth = 1.7,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 7.5h9.2a2.3 2.3 0 012.3 2.3V18H7.8A2.3 2.3 0 015.5 15.7V7.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M8.2 7.5V6.2A1.7 1.7 0 019.9 4.5h5.8A1.7 1.7 0 0117.4 6.2v1.3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path d="M9.2 12h5.2M9.2 15h3.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileTabIcon({
  size = 23,
  color = '#9CA3AF',
  strokeWidth = 1.7,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.2" r="3.4" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M5.2 19.2c1.1-3 3.4-4.5 6.8-4.5s5.7 1.5 6.8 4.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size = 26, color = '#FFFFFF', strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ImageChipIcon({ size = 16, color = '#F97316' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5" width="17" height="14" rx="3" stroke={color} strokeWidth={1.8} />
      <Circle cx="9" cy="10" r="1.6" fill={color} />
      <Path
        d="M4.5 16.5l4.8-4.2 3.2 2.6 3.4-3.4 3.6 5"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CaptionChipIcon({ size = 16, color = '#F97316' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 6.5h14v9.2a2 2 0 01-2 2H10l-3.8 2.4V17.7H7a2 2 0 01-2-2V6.5z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M8.5 10h7M8.5 13.2h4.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function ImageModeIcon({ size = 14, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5" width="17" height="14" rx="3" stroke={color} strokeWidth={1.8} />
      <Path
        d="M4.8 16.2l4.4-3.8 2.8 2.2 3.2-3.1 4 4.7"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function VideoModeIcon({ size = 14, color = '#9CA3AF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="6" width="12.5" height="12" rx="2.4" stroke={color} strokeWidth={1.7} />
      <Path
        d="M16 10.2l4.5-2.4v8.4L16 13.8v-3.6z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

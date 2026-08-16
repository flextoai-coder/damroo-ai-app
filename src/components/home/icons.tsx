import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

export function TimerIcon({ size = 12, color = '#CA8A04' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth={2} />
      <Path d="M12 9v4l3 2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 2h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

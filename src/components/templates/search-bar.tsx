import { BlurView } from 'expo-blur';
import { StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { brand } from '@/constants/brand';

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function TemplateSearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <View style={styles.wrap}>
      <BlurView intensity={40} tint="light" style={styles.pill}>
        <SearchIcon />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search festivals, offers, products…"
          placeholderTextColor={brand.mutedSoft}
          style={styles.input}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </BlurView>
    </View>
  );
}

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.5" stroke={brand.muted} strokeWidth={1.8} />
      <Path
        d="M16.2 16.2L20 20"
        stroke={brand.muted}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    paddingHorizontal: 22,
  },
  pill: {
    height: 48,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: brand.ink,
    paddingVertical: 0,
  },
});

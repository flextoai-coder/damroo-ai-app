import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import {
  buildIndustryFilterChips,
  type TemplateIndustryFilter,
} from '@/constants/templates';

type FilterChipsProps = {
  active: TemplateIndustryFilter;
  industries: readonly string[];
  onChange: (id: TemplateIndustryFilter) => void;
};

export function TemplateFilterChips({ active, industries, onChange }: FilterChipsProps) {
  const chips = buildIndustryFilterChips(industries);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.rail}>
      {chips.map((chip) => {
        const isActive =
          active === 'all'
            ? chip.id === 'all'
            : chip.id !== 'all' && active.toLowerCase() === chip.id.toLowerCase();

        return (
          <Pressable
            key={chip.id}
            onPress={() => onChange(chip.id)}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipIdle]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}>
            {isActive ? (
              <LinearGradient
                colors={[brand.orange, brand.orangeDeep]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.chipFill}
              />
            ) : null}
            <Text style={isActive ? styles.activeLabel : styles.idleLabel}>{chip.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    marginTop: 14,
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    paddingHorizontal: 22,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    shadowColor: brand.orange,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  chipIdle: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  chipFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  idleLabel: {
    color: brand.ink,
    fontSize: 13,
    fontWeight: '700',
  },
});

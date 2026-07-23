import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorPickerSheet } from '@/components/brand-kit/color-picker-sheet';
import { brand } from '@/constants/brand';
import { normalizeHexColor } from '@/constants/brand-kit';

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const swatch = normalizeHexColor(value) ?? brand.border;
  const display = normalizeHexColor(value) ?? (value.trim() || 'Tap to choose');

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Choose ${label} color`}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        <View style={[styles.preview, { backgroundColor: swatch }]} />
        <View style={styles.copy}>
          <Text style={styles.value} numberOfLines={1}>
            {display}
          </Text>
          <Text style={styles.hint}>HEX · RGB picker</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <ColorPickerSheet
        visible={pickerOpen}
        label={label}
        value={value}
        onClose={() => setPickerOpen(false)}
        onSelect={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    paddingHorizontal: 12,
  },
  rowPressed: {
    opacity: 0.92,
  },
  preview: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.15)',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.ink,
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
    color: brand.mutedSoft,
  },
  chevron: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '300',
    color: brand.mutedSoft,
    marginTop: -2,
  },
});

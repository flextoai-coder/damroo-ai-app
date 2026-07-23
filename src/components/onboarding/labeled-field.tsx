import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { brand } from '@/constants/brand';

type LabeledFieldProps = TextInputProps & {
  label: string;
  icon: ReactNode;
};

export function LabeledField({ label, icon, style, ...inputProps }: LabeledFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        <View style={styles.iconSlot}>{icon}</View>
        <TextInput
          {...inputProps}
          style={[styles.input, style]}
          placeholderTextColor={brand.mutedSoft}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.muted,
  },
  field: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconSlot: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: brand.ink,
    paddingVertical: 14,
  },
});

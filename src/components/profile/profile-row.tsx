import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/profile/icons';
import { brand } from '@/constants/brand';

type ProfileRowProps = {
  icon: ReactNode;
  iconTone?: string;
  label: string;
  value: string;
  onPress?: () => void;
  trailing?: ReactNode;
  showChevron?: boolean;
  last?: boolean;
};

export function ProfileRow({
  icon,
  iconTone = brand.orangeSoft,
  label,
  value,
  onPress,
  trailing,
  showChevron = true,
  last = false,
}: ProfileRowProps) {
  const content = (
    <>
      <View style={[styles.iconChip, { backgroundColor: iconTone }]}>{icon}</View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {trailing}
      {showChevron && !trailing ? <ChevronRightIcon /> : null}
    </>
  );

  return (
    <View>
      {onPress ? (
        <Pressable
          onPress={onPress}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value}`}>
          {content}
        </Pressable>
      ) : (
        <View style={styles.row}>{content}</View>
      )}
      {!last ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: brand.muted,
  },
  value: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '700',
    color: brand.ink,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148,163,184,0.35)',
    marginLeft: 62,
  },
});

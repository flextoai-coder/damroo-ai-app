import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/profile/glass-card';
import { brand } from '@/constants/brand';

type ProfileSectionProps = {
  title: string;
  children: ReactNode;
};

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <GlassCard>{children}</GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    paddingHorizontal: 22,
  },
  title: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '800',
    color: brand.muted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';

type SectionHeadProps = {
  title: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
};

export function SectionHead({
  title,
  onViewAll,
  viewAllLabel = 'View all',
}: SectionHeadProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {onViewAll ? (
        <Pressable
          onPress={onViewAll}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${viewAllLabel} ${title}`}>
          <Text style={styles.link}>{viewAllLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 22,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.3,
    marginRight: 12,
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.orange,
  },
});

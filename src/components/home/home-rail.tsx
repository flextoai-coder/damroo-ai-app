import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

type HomeRailProps = {
  children: ReactNode;
};

/** Edge-bleeding horizontal rail with no scrollbar. */
export function HomeRail({ children }: HomeRailProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.rail}
      decelerationRate="fast">
      {children}
      <View style={styles.endPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    marginBottom: 28,
  },
  content: {
    paddingLeft: 22,
    gap: 12,
    alignItems: 'flex-start',
  },
  endPad: {
    width: 10,
  },
});

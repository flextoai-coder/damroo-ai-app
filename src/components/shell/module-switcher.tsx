import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ImageModeIcon, VideoModeIcon } from '@/components/shell/tab-icons';
import { brand } from '@/constants/brand';
import { useModuleStore } from '@/stores/module-store';

/** Compact Image | Video (SOON) segmented control for the Home header. */
export function ModuleSwitcher() {
  const module = useModuleStore((s) => s.module);

  return (
    <View style={styles.shell} accessibilityRole="tablist">
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: module === 'image' }}
        accessibilityLabel="Image mode"
        onPress={() => useModuleStore.getState().setModule('image')}
        style={styles.segmentHit}>
        {module === 'image' ? (
          <LinearGradient
            colors={[brand.orange, brand.orangeDeep]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.segment, styles.segmentActive]}>
            <ImageModeIcon size={13} color="#FFFFFF" />
            <Text style={styles.activeLabel}>Image</Text>
          </LinearGradient>
        ) : (
          <View style={styles.segment}>
            <ImageModeIcon size={13} color={brand.muted} />
            <Text style={styles.idleLabel}>Image</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.segmentHit}>
        <View style={[styles.segment, styles.segmentDisabled]} accessibilityState={{ disabled: true }}>
          <VideoModeIcon size={13} color={brand.mutedSoft} />
          <Text style={styles.disabledLabel}>Video</Text>
        </View>
        <View style={styles.soonBadge} pointerEvents="none">
          <Text style={styles.soonText}>SOON</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  segmentHit: {
    position: 'relative',
  },
  segment: {
    minWidth: 72,
    height: 32,
    borderRadius: 11,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  segmentActive: {
    shadowColor: brand.orange,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  segmentDisabled: {
    opacity: 0.55,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  idleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: brand.muted,
  },
  disabledLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: brand.mutedSoft,
  },
  soonBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: brand.ink,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
  },
  soonText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});

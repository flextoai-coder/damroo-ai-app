import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PosterCard } from '@/components/home/poster-card';
import { TemplatesEmptyState } from '@/components/templates/empty-state';
import { TemplateFilterChips } from '@/components/templates/filter-chips';
import { TemplateSearchBar } from '@/components/templates/search-bar';
import { brand } from '@/constants/brand';
import { SHEET_SPRING } from '@/constants/sheet-motion';
import type { TemplateIndustryFilter } from '@/constants/templates';
import { useFilteredTemplates } from '@/hooks/use-templates';
import type { Template } from '@/services/templates';

const SIDE = 22;
const GAP = 14;
const DISMISS_DISTANCE_RATIO = 0.22;
const DISMISS_VELOCITY = 900;

type TemplatePickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
};

/** Full bottom sheet that mirrors the Templates tab (search + chips + grid). */
export function TemplatePickerSheet({ visible, onClose, onSelect }: TemplatePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState<TemplateIndustryFilter>('all');

  const { templates, industries, isLoading, isError, refetch } = useFilteredTemplates(
    search,
    industry,
  );
  const colWidth = (width - SIDE * 2 - GAP) / 2;
  const sheetHeight = Math.min(height * 0.88, height - insets.top - 24);

  const translateY = useSharedValue(sheetHeight);
  const dragOriginY = useSharedValue(0);
  const sheetHeightSV = useSharedValue(sheetHeight);

  useEffect(() => {
    sheetHeightSV.value = sheetHeight;
  }, [sheetHeight, sheetHeightSV]);

  useEffect(() => {
    if (!visible) {
      setSearch('');
      setIndustry('all');
      translateY.value = sheetHeight;
      return;
    }

    translateY.value = sheetHeight;
    translateY.value = withSpring(0, SHEET_SPRING);
  }, [visible, sheetHeight, translateY]);

  const finishClose = () => {
    onClose();
  };

  const dismiss = () => {
    translateY.value = withTiming(sheetHeightSV.value, { duration: 220 }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      dragOriginY.value = translateY.value;
    })
    .onUpdate((e) => {
      // Only allow dragging downward past the resting position.
      translateY.value = Math.max(0, dragOriginY.value + e.translationY);
    })
    .onEnd((e) => {
      const threshold = sheetHeightSV.value * DISMISS_DISTANCE_RATIO;
      const shouldClose = translateY.value > threshold || e.velocityY > DISMISS_VELOCITY;
      if (shouldClose) {
        translateY.value = withTiming(sheetHeightSV.value, { duration: 220 }, (finished) => {
          if (finished) runOnJS(finishClose)();
        });
      } else {
        translateY.value = withSpring(0, SHEET_SPRING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => {
    const progress = 1 - translateY.value / Math.max(sheetHeightSV.value, 1);
    return { opacity: Math.min(1, Math.max(0, progress)) };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss template picker">
          <Animated.View style={[styles.scrim, scrimStyle]} pointerEvents="none" />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 12) },
          ]}>
          <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.sheetInner}>
            <GestureDetector gesture={pan}>
              <Animated.View
                style={styles.handleHit}
                accessibilityRole="adjustable"
                accessibilityLabel="Drag down to close templates">
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>

            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Templates</Text>
                <Text style={styles.subtitle}>Tap a design to use it in Playground</Text>
              </View>
              <Pressable onPress={dismiss} style={styles.closeBtn} accessibilityLabel="Close">
                <Text style={styles.closeLabel}>Close</Text>
              </Pressable>
            </View>

            <TemplateSearchBar value={search} onChangeText={setSearch} />
            <TemplateFilterChips
              active={industry}
              industries={industries}
              onChange={setIndustry}
            />

            {isLoading ? (
              <View style={styles.loader}>
                <ActivityIndicator color={brand.orange} />
              </View>
            ) : isError ? (
              <View style={styles.loader}>
                <Text style={styles.errorText}>Couldn’t load templates.</Text>
                <Pressable onPress={() => void refetch()}>
                  <Text style={styles.retry}>Tap to retry</Text>
                </Pressable>
              </View>
            ) : templates.length === 0 ? (
              <ScrollView contentContainerStyle={styles.emptyScroll}>
                <TemplatesEmptyState />
              </ScrollView>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.gridContent}>
                <View style={styles.grid}>
                  {templates.map((template) => (
                    <View key={template.id} style={{ width: colWidth }}>
                      <PosterCard
                        variant="grid"
                        title={template.title}
                        industry={template.industry}
                        ribbon={template.source}
                        previewPath={template.preview_storage_path}
                        onPress={() => onSelect(template)}
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: brand.canvasBottom,
  },
  sheetInner: {
    flex: 1,
  },
  handleHit: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    // Wide hit target so the drag affordance is easy to grab.
    minHeight: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.55)',
  },
  header: {
    paddingHorizontal: SIDE,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '500',
    color: brand.muted,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  closeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.orangeDeep,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  errorText: {
    color: brand.muted,
    fontWeight: '600',
  },
  retry: {
    color: brand.orangeDeep,
    fontWeight: '800',
  },
  emptyScroll: {
    flexGrow: 1,
  },
  gridContent: {
    paddingTop: 14,
    paddingBottom: 24,
  },
  grid: {
    paddingHorizontal: SIDE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
});

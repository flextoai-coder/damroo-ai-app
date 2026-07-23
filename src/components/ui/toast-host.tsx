import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand } from '@/constants/brand';
import { useToastStore } from '@/stores/toast-store';

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const message = useToastStore((s) => s.message);
  const tone = useToastStore((s) => s.tone);
  const hide = useToastStore((s) => s.hide);
  const visible = useSharedValue(0);

  useEffect(() => {
    visible.value = withTiming(message ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [message, visible]);

  const style = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [{ translateY: (1 - visible.value) * 12 }],
  }));

  if (!message) return null;

  return (
    <View pointerEvents="box-none" style={[styles.root, { top: insets.top + 10 }]}>
      <Animated.View style={style}>
        <Pressable
          onPress={hide}
          style={[
            styles.toast,
            tone === 'error' && styles.error,
            tone === 'success' && styles.success,
          ]}
          accessibilityRole="alert">
          <Text style={styles.text}>{message}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  toast: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: brand.ink,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  error: {
    backgroundColor: '#9F1239',
  },
  success: {
    backgroundColor: '#166534',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

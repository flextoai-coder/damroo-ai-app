import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { brand } from '@/constants/brand';
import { PLAYGROUND_PROMPT_TIPS } from '@/constants/playground';
import { resizedImageUrl } from '@/lib/image-transform';

const ROTATE_INTERVAL_MS = 2800;
const TRANSITION_MS = 380;

const ICON_SIZE = 112;

const AVATAR_URL =
  'https://thvqecpkurkzcmkdqzki.supabase.co/storage/v1/object/sign/avatars/chat-avatar/Vaani-chat-avatar.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV83Zjc5MTc5NC1hM2MwLTQ4MjgtYTY3Ni1jN2Q1YThhNzY1OGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL2NoYXQtYXZhdGFyL1ZhYW5pLWNoYXQtYXZhdGFyLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODYyMTYwMzEsImV4cCI6MjEwMTU3NjAzMX0.yGLzqehyfah-WJG5_4vjKTPfMSD98iCpJPZd_87Swoc';

/** Empty Playground screen — the rotating line is inspiration only, not tappable. */
export function PlaygroundEmptyState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % PLAYGROUND_PROMPT_TIPS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.wrap}>
      <Image
        source={{ uri: resizedImageUrl(AVATAR_URL, { width: ICON_SIZE, height: ICON_SIZE }) }}
        style={styles.icon}
        contentFit="cover"
      />
      <Text style={styles.headline}>What shall Vaani design?</Text>

      <Text style={styles.tickerLabel}>Try asking for something like</Text>
      <View style={styles.tickerWrap}>
        <Animated.Text
          key={index}
          entering={FadeInDown.duration(TRANSITION_MS)}
          exiting={FadeOutUp.duration(TRANSITION_MS)}
          style={styles.tickerText}
          numberOfLines={1}>
          “{PLAYGROUND_PROMPT_TIPS[index]}”
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: brand.orangeSoft,
    marginBottom: 18,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  tickerLabel: {
    marginTop: 26,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: brand.mutedSoft,
  },
  tickerWrap: {
    marginTop: 6,
    height: 20,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  tickerText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: brand.ink,
  },
});

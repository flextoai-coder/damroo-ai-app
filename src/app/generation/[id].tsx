import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/shell/app-screen';
import { brand } from '@/constants/brand';
import { useSession } from '@/hooks/use-session';
import { track } from '@/lib/analytics';
import { toUserErrorMessage } from '@/lib/errors';
import { fetchGenerationById, primaryAssetUrl } from '@/services/generations';
import { generateCaption } from '@/services/playground';
import { toast } from '@/stores/toast-store';

export default function GenerationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useSession();
  const [caption, setCaption] = useState<string | null>(null);
  const [captionBusy, setCaptionBusy] = useState(false);

  const query = useQuery({
    queryKey: ['generation', id, user?.id],
    queryFn: () => fetchGenerationById(user!.id, id!),
    enabled: Boolean(user?.id && id),
  });

  const generation = query.data;
  const imageUrl = generation ? primaryAssetUrl(generation) : null;

  const onShare = async () => {
    if (!generation) return;
    const text =
      caption ??
      generation.prompt ??
      'Made with Damroo AI';

    try {
      await Clipboard.setStringAsync(text);
      toast('Caption copied', 'success');
      await Share.share({
        message: text,
        url: imageUrl ?? undefined,
      });
      track('share_generation', { generation_id: generation.id });
    } catch (e) {
      toast(toUserErrorMessage(e, 'Share failed'), 'error');
    }
  };

  const onCaption = async () => {
    if (!generation || captionBusy) return;
    setCaptionBusy(true);
    try {
      const text = await generateCaption({
        generationId: generation.id,
        prompt: generation.prompt,
        businessName: profile?.business_name ?? undefined,
      });
      setCaption(text);
      toast('Caption ready', 'success');
    } catch (e) {
      toast(toUserErrorMessage(e, 'Couldn’t generate caption'), 'error');
    } finally {
      setCaptionBusy(false);
    }
  };

  return (
    <AppScreen edges={[]} glowBlobs contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'android' ? 10 : insets.top + 8,
            paddingBottom: Platform.OS === 'android' ? 16 : insets.bottom + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backLabel}>← Back</Text>
          </Pressable>
        </View>

        {query.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={brand.orange} />
          </View>
        ) : query.isError || !generation ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Couldn’t load this generation</Text>
            <Text style={styles.emptyBody}>
              {query.isError
                ? toUserErrorMessage(query.error)
                : 'It may have been removed or isn’t available offline.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.frame}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
              ) : (
                <LinearGradient
                  colors={[brand.orangeSoft, '#FDBA74']}
                  style={styles.image}
                />
              )}
            </View>

            <Text style={styles.section}>Prompt</Text>
            <Text style={styles.prompt}>{generation.prompt}</Text>

            {caption ? (
              <>
                <Text style={styles.section}>Caption</Text>
                <Text style={styles.prompt}>{caption}</Text>
              </>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                onPress={() => void onCaption()}
                style={styles.secondaryBtn}
                disabled={captionBusy}>
                {captionBusy ? (
                  <ActivityIndicator color={brand.orangeDeep} />
                ) : (
                  <Text style={styles.secondaryLabel}>
                    {caption ? 'Regenerate caption' : 'Generate caption'}
                  </Text>
                )}
              </Pressable>
              <Pressable onPress={() => void onShare()} style={styles.primaryBtn}>
                <Text style={styles.primaryLabel}>Share</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 22 },
  topRow: { marginBottom: 12 },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backLabel: { fontSize: 15, fontWeight: '700', color: brand.orangeDeep },
  center: { paddingTop: 80, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: brand.ink },
  emptyBody: { fontSize: 14, color: brand.muted, textAlign: 'center', maxWidth: 280 },
  frame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: brand.orangeSoft,
  },
  image: { width: '100%', height: '100%' },
  section: {
    marginTop: 20,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '800',
    color: brand.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  prompt: { fontSize: 15, lineHeight: 22, color: brand.ink, fontWeight: '500' },
  actions: { marginTop: 24, gap: 10 },
  secondaryBtn: {
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orangeSoft,
  },
  secondaryLabel: { fontSize: 15, fontWeight: '800', color: brand.orangeDeep },
  primaryBtn: {
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orange,
  },
  primaryLabel: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});

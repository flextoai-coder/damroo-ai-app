import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/onboarding/icons';
import { OnboardingCanvas } from '@/components/onboarding/onboarding-canvas';
import { AppScreen } from '@/components/shell/app-screen';
import { brand } from '@/constants/brand';

type OnboardingShellProps = {
  step: 1 | 2 | 3;
  title: string;
  titleMutedLine?: string;
  subtitle: string;
  children: ReactNode;
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  onPrimary: () => void;
  onBack?: () => void;
  showSkip?: boolean;
  onSkip?: () => void;
  skipLoading?: boolean;
};

export function OnboardingShell({
  step,
  title,
  titleMutedLine,
  subtitle,
  children,
  primaryLabel,
  primaryDisabled = false,
  primaryLoading = false,
  onPrimary,
  onBack,
  showSkip = false,
  onSkip,
  skipLoading = false,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const showBack = step > 1 && Boolean(onBack);
  const busy = primaryLoading || skipLoading;

  return (
    <AppScreen edges={[]}>
      <OnboardingCanvas />

      <KeyboardAvoidingView
        style={[
          styles.content,
          {
            paddingTop: insets.top + 8,
          },
        ]}
        behavior="padding">
        <View style={styles.topBar}>
          {showBack ? (
            <Pressable
              onPress={onBack}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={[styles.backButton, busy && styles.disabled]}>
              <ChevronLeftIcon size={18} color={brand.ink} />
            </Pressable>
          ) : null}

          <View style={styles.progressRow}>
            {[1, 2, 3].map((segment) => {
              const filled = segment <= step;
              return filled ? (
                <LinearGradient
                  key={segment}
                  colors={[brand.orange, brand.orangeDeep]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.progressSegment}
                />
              ) : (
                <View key={segment} style={[styles.progressSegment, styles.progressEmpty]} />
              );
            })}
          </View>

          <Text style={styles.stepCounter}>{step}/3</Text>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <Text style={styles.title}>
            {title}
            {titleMutedLine ? (
              <>
                {'\n'}
                <Text style={styles.titleMuted}>{titleMutedLine}</Text>
              </>
            ) : null}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.stepContent}>{children}</View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            showSkip && styles.footerSplit,
            // Not on the KeyboardAvoidingView itself — its own `behavior="padding"`
            // animated style always sets `paddingBottom` (to 0 once the keyboard is
            // closed), which as the last entry in that node's style array silently
            // overrides any static paddingBottom passed in. Putting the safe-area
            // clearance on this child instead sidesteps that entirely.
            { paddingBottom: insets.bottom + 28 },
          ]}>
          {showSkip ? (
            <Pressable
              onPress={onSkip}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Skip"
              style={[styles.skipButton, busy && styles.disabled]}>
              {skipLoading ? (
                <ActivityIndicator color={brand.ink} />
              ) : (
                <Text style={styles.skipLabel}>Skip</Text>
              )}
            </Pressable>
          ) : null}

          <Pressable
            onPress={onPrimary}
            disabled={primaryDisabled || busy}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
            style={[
              styles.primaryButtonWrap,
              showSkip && styles.primaryButtonFlex,
              (primaryDisabled || busy) && styles.disabled,
            ]}>
            <LinearGradient
              colors={[brand.orange, '#FB923C']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryButton}>
              {primaryLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryLabel}>
                  {primaryLabel} <Text style={styles.primaryArrow}>→</Text>
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 26,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 38,
    marginBottom: 28,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  progressRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  progressEmpty: {
    backgroundColor: 'rgba(148, 163, 184, 0.28)',
  },
  stepCounter: {
    minWidth: 28,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: brand.muted,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  title: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.4,
    maxWidth: 320,
  },
  titleMuted: {
    color: brand.mutedSoft,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
    maxWidth: 300,
  },
  stepContent: {
    marginTop: 26,
    flex: 1,
  },
  footer: {
    marginTop: 16,
  },
  footerSplit: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  skipButton: {
    height: 54,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
  skipLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.ink,
  },
  primaryButtonWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: brand.orangeDeep,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  primaryButton: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonFlex: {
    flex: 1,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryArrow: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.45,
  },
});

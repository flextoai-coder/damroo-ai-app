import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppleLogo } from '@/components/apple-logo';
import { GoogleLogo } from '@/components/google-logo';
import { brand } from '@/constants/brand';
import { getAuthRedirectUri } from '@/lib/auth-redirect';
import { getPasswordStrength } from '@/lib/password-strength';
import {
  isAppleAuthAvailable,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/services/auth';

/** Image 2 — full-bleed background art */
const heroImage = require('../../../assets/images/auth-horses-bg.jpeg');

const FEATURES = [
  { icon: '✦', label: 'AI-Powered\nGeneration' },
  { icon: '♛', label: 'Premium\nTemplates' },
  { icon: '⧉', label: 'Ultra Realistic\nAI Visuals' },
] as const;

type AuthMode = 'oauth' | 'email-login' | 'email-signup';
type BusyState = 'google' | 'apple' | 'email' | null;

const STRENGTH_COLORS = {
  0: '#E2E8F0',
  1: '#EF4444',
  2: '#F59E0B',
  3: '#84CC16',
  4: '#16A34A',
} as const;

function EyeIcon({ visible, size = 20, color = brand.muted }: EyeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
      {!visible ? (
        <Path d="M3.5 3.5l17 17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      ) : null}
    </Svg>
  );
}

type EyeIconProps = { visible: boolean; size?: number; color?: string };

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mode, setMode] = useState<AuthMode>('oauth');
  const [busy, setBusy] = useState<BusyState>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const showApple = Platform.OS === 'ios' && appleAvailable;
  const strength = getPasswordStrength(password);
  const emailTrimmed = email.trim();
  const canSubmitEmail =
    emailTrimmed.length > 0 &&
    password.length > 0 &&
    (mode !== 'email-signup' || strength.isAcceptable);

  useEffect(() => {
    void isAppleAuthAvailable().then(setAppleAvailable);
  }, []);

  const resetFormMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const goToMode = (next: AuthMode) => {
    resetFormMessages();
    setPassword('');
    setMode(next);
  };

  const onGoogle = async () => {
    resetFormMessages();
    setBusy('google');
    try {
      const result = await signInWithGoogle();
      if (result.cancelled) {
        setError(
          __DEV__
            ? `Browser did not return to the app.\n\nAdd these Redirect URLs in Supabase Auth → URL Configuration:\n• exp://**\n• ${getAuthRedirectUri()}\n\nSite URL must be https://… (not damrooai://). Then reload and try again.`
            : 'Google sign-in was cancelled',
        );
      }
    } catch (e) {
      if (__DEV__) console.error('[auth] Google sign-in error:', e);
      setError('An error occurred');
    } finally {
      setBusy(null);
    }
  };

  const onApple = async () => {
    resetFormMessages();
    setBusy('apple');
    try {
      await signInWithApple();
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (message.toLowerCase().includes('cancel')) {
        setError(null);
      } else {
        if (__DEV__) console.error('[auth] Apple sign-in error:', e);
        setError('An error occurred');
      }
    } finally {
      setBusy(null);
    }
  };

  const onEmailSubmit = async () => {
    resetFormMessages();

    if (!emailTrimmed || !password) {
      setError('Enter your email and password');
      return;
    }

    if (mode === 'email-signup' && !strength.isAcceptable) {
      setError('Choose a stronger password before continuing');
      return;
    }

    setBusy('email');
    try {
      if (mode === 'email-login') {
        await signInWithEmail(emailTrimmed, password);
        return;
      }

      await signUpWithEmail(emailTrimmed, password);
      setPassword('');
      setMode('email-login');
      setSuccess('Account created. Sign in to continue.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  const authCardStyle =
    mode === 'oauth'
      ? showApple
        ? styles.authCardTall
        : styles.authCardCompact
      : styles.authCardForm;

  return (
    <View style={styles.root}>
      {/* ========== LAYER 0: canvas ========== */}
      <LinearGradient
        colors={[brand.canvasTop, brand.canvasBottom]}
        style={styles.layerCanvas}
        pointerEvents="none"
      />

      {/* ========== LAYER 1: Image 2 background (everything sits above this) ========== */}
      <View style={styles.layerBackground} pointerEvents="none">
        <Image
          source={heroImage}
          style={styles.backgroundImage}
          contentFit="cover"
          contentPosition="top"
          transition={200}
        />
        {/* Soft dissolve of the art into the canvas at top/bottom edges */}
        <LinearGradient
          colors={[brand.canvasTop, brand.canvasTopClear]}
          style={[styles.bgEdgeFadeTop, { height: height * 0.14 }]}
        />
        <LinearGradient
          colors={[
            brand.canvasBottomClear,
            'rgba(251,238,224,0.45)',
            brand.canvasBottom,
          ]}
          locations={[0, 0.45, 1]}
          style={[styles.bgEdgeFadeBottom, { height: height * 0.38 }]}
        />
      </View>

      {/* ========== LAYER 2: readable scrims (still under UI) ========== */}
      <LinearGradient
        colors={[brand.creamBand, 'rgba(253,243,231,0.55)', brand.creamBandClear]}
        locations={[0, 0.4, 1]}
        style={[styles.layerScrimTop, { height: height * 0.18 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[
          brand.canvasBottomClear,
          'rgba(251,238,224,0.55)',
          brand.canvasBottom,
        ]}
        locations={[0, 0.4, 0.75]}
        style={[styles.layerScrimBottom, { height: height * 0.42 }]}
        pointerEvents="none"
      />

      {/* ========== LAYER 3: all content over the background ========== */}
      <KeyboardAvoidingView
        style={[
          styles.layerContent,
          {
            paddingTop: insets.top + 6,
            paddingBottom: insets.bottom + 10,
          },
        ]}
        behavior="padding">
        <View style={styles.headlineBlock}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>✦</Text>
            <Text style={styles.badgeText}>AI-POWERED</Text>
          </View>

          <Text style={styles.headline}>
            Create it today{'\n'}
            with <Text style={styles.headlineAccent}>Damroo</Text>
          </Text>

          <View style={styles.divider} />

          <Text style={styles.subhead}>
            Studio-quality content, generated in seconds.
          </Text>
        </View>

        {/* Spacer — compresses when the keyboard raises the auth card */}
        <View
          style={[
            styles.flexSpacer,
            {
              minHeight: mode === 'oauth' ? Math.min(260, height * 0.26) : 12,
            },
          ]}
        />

        {mode === 'oauth' ? (
          <BlurView intensity={40} tint="light" style={styles.featureCard}>
            {FEATURES.map((feature, index) => (
              <View
                key={feature.label}
                style={[
                  styles.featureItem,
                  index < FEATURES.length - 1 && styles.featureDivider,
                ]}>
                <View style={styles.featureIconCircle}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                </View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </BlurView>
        ) : null}

        <BlurView intensity={52} tint="light" style={[styles.authCard, authCardStyle]}>
          {mode === 'oauth' ? (
            <>
              <Pressable
                style={[styles.authButton, busy !== null && styles.disabled]}
                onPress={onGoogle}
                disabled={busy !== null}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google">
                {busy === 'google' ? (
                  <ActivityIndicator color={brand.ink} />
                ) : (
                  <>
                    <GoogleLogo size={20} />
                    <Text style={styles.authLabel}>Continue with Google</Text>
                    <Text style={styles.authChevron}>›</Text>
                  </>
                )}
              </Pressable>

              {showApple ? (
                <Pressable
                  style={[styles.authButton, busy !== null && styles.disabled]}
                  onPress={onApple}
                  disabled={busy !== null}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Apple">
                  {busy === 'apple' ? (
                    <ActivityIndicator color={brand.ink} />
                  ) : (
                    <>
                      <AppleLogo size={20} color="#000000" />
                      <Text style={styles.authLabel}>Continue with Apple</Text>
                      <Text style={styles.authChevron}>›</Text>
                    </>
                  )}
                </Pressable>
              ) : null}

              <Pressable
                style={[styles.authButton, busy !== null && styles.disabled]}
                onPress={() => goToMode('email-login')}
                disabled={busy !== null}
                accessibilityRole="button"
                accessibilityLabel="Sign in with email">
                <Text style={styles.emailGlyph}>@</Text>
                <Text style={styles.authLabel}>Sign in with email</Text>
                <Text style={styles.authChevron}>›</Text>
              </Pressable>

              <Pressable
                onPress={() => goToMode('email-signup')}
                disabled={busy !== null}
                accessibilityRole="button"
                accessibilityLabel="Create an account"
                style={styles.linkRow}>
                <Text style={styles.linkMuted}>New here? </Text>
                <Text style={styles.linkAction}>Create an account</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.formHeader}>
                <Pressable
                  onPress={() => goToMode('oauth')}
                  disabled={busy !== null}
                  accessibilityRole="button"
                  accessibilityLabel="Back to sign-in options"
                  hitSlop={8}
                  style={styles.backButton}>
                  <Text style={styles.backChevron}>‹</Text>
                  <Text style={styles.backLabel}>Back</Text>
                </Pressable>
                <Text style={styles.formTitle}>
                  {mode === 'email-login' ? 'Sign in' : 'Create account'}
                </Text>
                <View style={styles.formHeaderSpacer} />
              </View>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={brand.mutedSoft}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={busy === null}
                accessibilityLabel="Email"
              />

              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={brand.mutedSoft}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={mode === 'email-signup' ? 'new-password' : 'password'}
                  textContentType={mode === 'email-signup' ? 'newPassword' : 'password'}
                  editable={busy === null}
                  accessibilityLabel="Password"
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  disabled={busy !== null}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  style={styles.eyeButton}>
                  <EyeIcon visible={showPassword} />
                </Pressable>
              </View>

              {mode === 'email-signup' ? (
                <View style={styles.strengthBlock}>
                  <View style={styles.strengthTrack}>
                    {[1, 2, 3, 4].map((step) => (
                      <View
                        key={step}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor:
                              strength.score >= step
                                ? STRENGTH_COLORS[strength.score as 0 | 1 | 2 | 3 | 4]
                                : STRENGTH_COLORS[0],
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      styles.strengthLabel,
                      {
                        color:
                          password.length === 0
                            ? brand.mutedSoft
                            : STRENGTH_COLORS[Math.max(1, strength.score) as 1 | 2 | 3 | 4],
                      },
                    ]}>
                    {password.length === 0 ? 'Password strength' : strength.label}
                  </Text>
                </View>
              ) : null}

              <Pressable
                style={[
                  styles.primaryButton,
                  (busy !== null || !canSubmitEmail) && styles.disabled,
                ]}
                onPress={onEmailSubmit}
                disabled={busy !== null || !canSubmitEmail}
                accessibilityRole="button"
                accessibilityLabel={mode === 'email-login' ? 'Proceed' : 'Create account'}>
                {busy === 'email' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonLabel}>
                    {mode === 'email-login' ? 'Proceed' : 'Create account'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() =>
                  goToMode(mode === 'email-login' ? 'email-signup' : 'email-login')
                }
                disabled={busy !== null}
                accessibilityRole="button"
                accessibilityLabel={
                  mode === 'email-login' ? 'Create an account' : 'Sign in instead'
                }
                style={styles.linkRow}>
                {mode === 'email-login' ? (
                  <>
                    <Text style={styles.linkMuted}>New here? </Text>
                    <Text style={styles.linkAction}>Create an account</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.linkMuted}>Already have an account? </Text>
                    <Text style={styles.linkAction}>Sign in</Text>
                  </>
                )}
              </Pressable>
            </>
          )}

          {success ? <Text style={styles.success}>{success}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.legal}>
            By continuing you agree to our Terms & Privacy Policy.
          </Text>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.canvasBottom,
  },

  /** z0 — solid page wash */
  layerCanvas: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },

  /** z1 — Image 2 fills the screen as the background */
  layerBackground: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
  },
  bgEdgeFadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bgEdgeFadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  /** z2 — soft scrims */
  layerScrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  layerScrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },

  /** z3 — all UI above the art */
  layerContent: {
    flex: 1,
    zIndex: 3,
    paddingHorizontal: 24,
  },

  headlineBlock: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.18)',
    marginBottom: 14,
  },
  badgeIcon: {
    color: brand.orange,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeText: {
    color: brand.orange,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.15,
  },
  headline: {
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.6,
  },
  headlineAccent: {
    color: brand.orange,
  },
  divider: {
    width: 46,
    height: 2,
    borderRadius: 2,
    backgroundColor: brand.orange,
    marginTop: 13,
    marginBottom: 13,
  },
  subhead: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    color: '#6B7280',
    textShadowColor: 'rgba(253, 243, 231, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    paddingHorizontal: 8,
  },
  flexSpacer: {
    flex: 1,
  },
  featureCard: {
    flexDirection: 'row',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.48)',
    paddingVertical: 16,
    paddingHorizontal: 6,
    marginBottom: 22,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  featureDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(148, 163, 184, 0.35)',
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  featureIcon: {
    color: brand.orange,
    fontSize: 15,
    fontWeight: '700',
  },
  featureLabel: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: '#374151',
  },
  authCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    paddingHorizontal: 20,
    gap: 12,
  },
  authCardCompact: {
    paddingTop: 22,
    paddingBottom: 16,
  },
  authCardTall: {
    paddingTop: 24,
    paddingBottom: 18,
  },
  authCardForm: {
    paddingTop: 18,
    paddingBottom: 16,
  },
  authButton: {
    height: 54,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  emailGlyph: {
    width: 20,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: brand.ink,
  },
  authLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: brand.ink,
  },
  authChevron: {
    fontSize: 22,
    color: '#CBD5E1',
    fontWeight: '300',
    marginTop: -2,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 64,
  },
  backChevron: {
    fontSize: 28,
    lineHeight: 30,
    color: brand.ink,
    fontWeight: '300',
    marginRight: 2,
    marginTop: -2,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: brand.ink,
  },
  formTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: brand.ink,
  },
  formHeaderSpacer: {
    minWidth: 64,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: brand.ink,
  },
  passwordWrap: {
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthBlock: {
    gap: 6,
  },
  strengthTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    height: 54,
    borderRadius: 999,
    backgroundColor: brand.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.orangeDeep,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: 2,
  },
  linkMuted: {
    fontSize: 13,
    color: brand.muted,
  },
  linkAction: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.orangeDeep,
  },
  disabled: {
    opacity: 0.55,
  },
  success: {
    color: '#15803D',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
  legal: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    color: '#9CA3AF',
    marginTop: 2,
  },
});

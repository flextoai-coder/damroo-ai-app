import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import {
  getAuthRedirectUri,
  isAuthCallbackUrl,
  parseAuthCallbackUrl,
} from '@/lib/auth-redirect';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

/** Prevents double exchange when Linking + openAuthSessionAsync both fire. */
let inFlightAuthCode: string | null = null;

export async function createSessionFromUrl(url: string) {
  const { code, access_token, refresh_token, error, error_description } =
    parseAuthCallbackUrl(url);

  if (error) {
    throw new Error(error_description ?? error);
  }

  // PKCE flow (preferred)
  if (code) {
    if (inFlightAuthCode === code) {
      return null;
    }
    inFlightAuthCode = code;
    try {
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        throw exchangeError;
      }
      return data.session;
    } finally {
      inFlightAuthCode = null;
    }
  }

  // Implicit / token fragment fallback
  if (!access_token || !refresh_token) {
    return null;
  }

  const { data, error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (sessionError) {
    throw sessionError;
  }

  return data.session;
}

function extractRedirectToFromOAuthUrl(oauthUrl: string) {
  try {
    const parsed = new URL(oauthUrl);
    return parsed.searchParams.get('redirect_to');
  } catch {
    return null;
  }
}

/** Google sign-in via Supabase OAuth + in-app browser (iOS + Android). */
export async function signInWithGoogle() {
  const redirectTo = getAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error('No OAuth URL returned from Supabase');
  }

  const redirectInAuthorizeUrl = extractRedirectToFromOAuthUrl(data.url);

  if (__DEV__) {
    console.log('[auth] redirectTo (app):', redirectTo);
    console.log('[auth] redirect_to (authorize URL):', redirectInAuthorizeUrl);
  }

  if (
    redirectInAuthorizeUrl &&
    redirectInAuthorizeUrl.startsWith('damrooai:') &&
    redirectTo.startsWith('exp:')
  ) {
    throw new Error(
      `Supabase ignored the Expo Go redirect and used ${redirectInAuthorizeUrl}. ` +
        `In Supabase → Authentication → URL Configuration → Redirect URLs, add exactly:\n` +
        `exp://**\nand also:\n${redirectTo}\n` +
        `Site URL must be an https:// URL, not damrooai://.`,
    );
  }

  if (Platform.OS === 'android') {
    await WebBrowser.warmUpAsync();
  }

  type GoogleSignInResult =
    | { cancelled: true; session?: null }
    | { cancelled: false; session: Awaited<ReturnType<typeof createSessionFromUrl>> };

  let settlePromise: Promise<GoogleSignInResult> | null = null;

  const settle = (url: string | null) => {
    if (!settlePromise) {
      settlePromise = (async () => {
        try {
          WebBrowser.dismissBrowser();
        } catch {
          // Browser may already be closed
        }

        if (!url) {
          return { cancelled: true as const };
        }

        const session = await createSessionFromUrl(url);
        return { cancelled: false as const, session };
      })();
    }
    return settlePromise;
  };

  // Backup path: if Custom Tabs doesn't auto-close, Linking still delivers exp://
  const linkingSub = Linking.addEventListener('url', ({ url }) => {
    if (isAuthCallbackUrl(url)) {
      void settle(url);
    }
  });

  try {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
      // Keep auth in the same Android task so the redirect can return to Expo Go
      createTask: false,
      showInRecents: false,
    });

    if (result.type === 'success' && 'url' in result && result.url) {
      return await settle(result.url);
    }

    // Dismiss/cancel may mean Linking already finished the flow
    if (settlePromise) {
      return await settlePromise;
    }

    return await settle(null);
  } finally {
    linkingSub.remove();
    if (Platform.OS === 'android') {
      void WebBrowser.coolDownAsync();
    }
  }
}

/** Apple sign-in — iOS only. */
export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple Sign-In did not return an identity token');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) {
    throw error;
  }

  // Apple only sends the name on the first authorization
  const given = credential.fullName?.givenName;
  const family = credential.fullName?.familyName;
  const fullName = [given, family].filter(Boolean).join(' ').trim();

  if (fullName && data.user) {
    await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', data.user.id);
  }

  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

function mapAuthError(error: { message?: string; status?: number }, fallback: string) {
  const message = (error.message ?? '').toLowerCase();

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials')
  ) {
    return 'Invalid email or password';
  }
  if (
    message.includes('user already registered') ||
    message.includes('already been registered')
  ) {
    return 'An account with this email already exists';
  }
  if (message.includes('password') && message.includes('least')) {
    return 'Password is too weak. Use at least 6 characters.';
  }
  if (message.includes('unable to validate email') || message.includes('invalid email')) {
    return 'Please enter a valid email address';
  }
  if (message.includes('email not confirmed')) {
    return 'Please confirm your email before signing in';
  }

  return error.message?.trim() || fallback;
}

/** Email/password sign-in via Supabase Auth. */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(mapAuthError(error, 'Sign-in failed'));
  }

  return data.session;
}

/**
 * Email/password sign-up. Signs out immediately if Supabase returns a session
 * so the user must sign in again from the login form.
 */
export async function signUpWithEmail(email: string, password: string) {
  const trimmed = email.trim();
  const { data, error } = await supabase.auth.signUp({
    email: trimmed,
    password,
  });

  if (error) {
    throw new Error(mapAuthError(error, 'Sign-up failed'));
  }

  // Supabase may return a user with empty identities when the email is taken
  // and "Confirm email" is off / duplicate handling is soft.
  const identities = data.user?.identities;
  if (data.user && Array.isArray(identities) && identities.length === 0) {
    throw new Error('An account with this email already exists');
  }

  if (data.session) {
    await signOut();
  }

  return { email: trimmed };
}

export async function isAppleAuthAvailable() {
  if (Platform.OS !== 'ios') {
    return false;
  }
  return AppleAuthentication.isAvailableAsync();
}

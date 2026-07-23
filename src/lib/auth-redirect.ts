import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

/** True when running inside Expo Go (cannot claim custom URL schemes). */
export function isExpoGo() {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

/**
 * Deep-link target for Supabase OAuth.
 *
 * Expo Go must use `exp://…/--/auth/callback` — custom schemes like
 * `damrooai://` never return to Expo Go, so the browser stays open.
 *
 * Supabase → Auth → URL Configuration → Redirect URLs must include:
 *   - exp://**
 *   - damrooai://auth/callback
 */
export function getAuthRedirectUri() {
  if (isExpoGo()) {
    // Do not pass scheme: 'damrooai' — Expo Go must stay on exp://
    return Linking.createURL('auth/callback');
  }

  return Linking.createURL('auth/callback', { scheme: 'damrooai' });
}

export function parseAuthCallbackUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  return {
    code: typeof params.code === 'string' ? params.code : undefined,
    access_token:
      typeof params.access_token === 'string' ? params.access_token : undefined,
    refresh_token:
      typeof params.refresh_token === 'string' ? params.refresh_token : undefined,
    error: errorCode ?? (typeof params.error === 'string' ? params.error : undefined),
    error_description:
      typeof params.error_description === 'string'
        ? params.error_description
        : undefined,
  };
}

/** True if this URL looks like our OAuth return (Expo Go or standalone). */
export function isAuthCallbackUrl(url: string) {
  return (
    url.includes('auth/callback') ||
    url.includes('code=') ||
    url.includes('access_token')
  );
}

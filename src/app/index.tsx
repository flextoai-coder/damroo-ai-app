import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useSession } from '@/hooks/use-session';

/**
 * Entry redirect — AuthProvider also gates; this covers the initial `/` hit.
 */
export default function Index() {
  const { isHydrated, isProfileReady, session, onboardingCompleted } = useSession();

  // Wait for the just-signed-in session's profile to sync too, or a
  // returning user with onboarding already complete briefly flashes onboarding.
  if (!isHydrated || (session && !isProfileReady)) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)/business" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});

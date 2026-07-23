import { useNetworkState } from 'expo-network';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand } from '@/constants/brand';

/** Slim banner when the device reports no usable network. */
export function OfflineBanner() {
  const network = useNetworkState();
  const insets = useSafeAreaInsets();
  const offline =
    network.isConnected === false || network.isInternetReachable === false;

  if (!offline) return null;

  return (
    <View style={[styles.banner, { paddingTop: Math.max(insets.top, 8) }]}>
      <Text style={styles.text}>You’re offline — some actions won’t work until you reconnect.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: brand.ink,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});

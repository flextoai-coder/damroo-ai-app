import AsyncStorage from '@react-native-async-storage/async-storage';

/** Namespaced per-user since AsyncStorage is device-local but a device may see multiple accounts over time. */
function storageKey(userId: string): string {
  return `damroo:expiring-notice-last-shown:${userId}`;
}

/** Calendar-day-grained "don't nag every app open" throttle — not correctness-critical like the expiry math itself. */
export async function shouldShowExpiringNoticeToday(userId: string): Promise<boolean> {
  const last = await AsyncStorage.getItem(storageKey(userId));
  return last !== new Date().toISOString().slice(0, 10);
}

export async function markExpiringNoticeShown(userId: string): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), new Date().toISOString().slice(0, 10));
}

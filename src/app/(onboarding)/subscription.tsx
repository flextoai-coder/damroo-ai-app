import { StyleSheet, Text, View } from 'react-native';

import { PLANS } from '@/constants/plans';

export default function SubscriptionOnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a plan</Text>
      <Text style={styles.subtitle}>Scaffold — payments wired in Phase 3</Text>
      {PLANS.map((plan) => (
        <Text key={plan.id} style={styles.plan}>
          {plan.name}: ₹{plan.priceInr.toLocaleString('en-IN')} / {plan.credits} credits
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  plan: {
    fontSize: 16,
  },
});

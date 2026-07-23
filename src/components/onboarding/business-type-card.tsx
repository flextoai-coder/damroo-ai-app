import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CheckIcon,
  GlobeIcon,
  GridIcon,
  HeartIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
} from '@/components/onboarding/icons';
import type { BusinessType } from '@/constants/business-types';
import { brand } from '@/constants/brand';

type BusinessTypeCardProps = {
  type: BusinessType;
  selected: boolean;
  onPress: () => void;
};

function TypeIcon({ icon, color }: { icon: BusinessType['icon']; color: string }) {
  switch (icon) {
    case 'globe':
      return <GlobeIcon size={18} color={color} />;
    case 'tag':
      return <TagIcon size={18} color={color} />;
    case 'heart':
      return <HeartIcon size={18} color={color} />;
    case 'sparkles':
      return <SparklesIcon size={18} color={color} />;
    case 'star':
      return <StarIcon size={18} color={color} />;
    case 'grid':
      return <GridIcon size={18} color={color} />;
  }
}

export function BusinessTypeCard({ type, selected, onPress }: BusinessTypeCardProps) {
  const iconColor = selected ? '#FFFFFF' : brand.orange;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={type.label}
      style={[styles.card, selected && styles.cardSelected]}>
      {selected ? (
        <View style={styles.checkBadge}>
          <CheckIcon size={11} color="#FFFFFF" />
        </View>
      ) : null}

      <View style={styles.iconWrap}>
        {selected ? (
          <LinearGradient
            colors={[brand.orange, brand.orangeDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconTile}>
            <TypeIcon icon={type.icon} color={iconColor} />
          </LinearGradient>
        ) : (
          <View style={[styles.iconTile, styles.iconTileIdle]}>
            <TypeIcon icon={type.icon} color={iconColor} />
          </View>
        )}
      </View>

      <Text style={styles.label}>{type.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 96,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardSelected: {
    borderColor: brand.orange,
    backgroundColor: 'rgba(255, 237, 213, 0.55)',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: brand.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignSelf: 'flex-start',
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileIdle: {
    backgroundColor: brand.orangeSoft,
  },
  label: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '700',
    color: brand.ink,
  },
});

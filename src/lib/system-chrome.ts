import { NavigationBar } from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { Platform, StatusBar } from 'react-native';

import { brand } from '@/constants/brand';

/**
 * Edge-to-edge Damroo chrome: cream canvas shows through the status bar and
 * gesture/navigation area; system icons stay dark for contrast.
 */
export async function applyDamrooSystemChrome() {
  await SystemUI.setBackgroundColorAsync(brand.canvasBottom);

  if (Platform.OS === 'android') {
    // Prefer drawing under the system bars when the runtime allows it.
    // (No-ops on some edge-to-edge builds; still helps Expo Go / older devices.)
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setBarStyle('dark-content');

    // Dark buttons/icons on light cream. Requires enforceContrast: false in app.json
    // so the nav/gesture bar can stay transparent and blend with the canvas.
    NavigationBar.setStyle('dark');
  }
}

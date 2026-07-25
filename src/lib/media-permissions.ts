import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

/**
 * Requests photo library access, re-prompting via the OS dialog every time
 * it's still possible to. If the user has permanently denied it (canAskAgain
 * === false — iOS/Android won't show their own dialog again after this),
 * offers a direct path to Settings instead of repeating a dead-end message.
 */
export async function requestPhotoLibraryAccess(): Promise<boolean> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.granted) return true;

  if (!permission.canAskAgain) {
    Alert.alert(
      'Photo access needed',
      'Damroo needs access to your photo library. Enable it in Settings to continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ],
    );
    return false;
  }

  Alert.alert('Permission needed', 'Allow photo library access to continue.');
  return false;
}

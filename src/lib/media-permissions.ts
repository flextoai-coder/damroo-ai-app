import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
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

/** Same re-prompt/Settings-deeplink pattern as {@link requestPhotoLibraryAccess}, for the camera. */
export async function requestCameraAccess(): Promise<boolean> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (permission.granted) return true;

  if (!permission.canAskAgain) {
    Alert.alert(
      'Camera access needed',
      'Damroo needs camera access to take a reference photo. Enable it in Settings to continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ],
    );
    return false;
  }

  Alert.alert('Permission needed', 'Allow camera access to continue.');
  return false;
}

/**
 * Write-only media library access, for saving a generated image to the
 * device's photos — never needs to read the existing library.
 */
export async function requestSaveToGalleryAccess(): Promise<boolean> {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (permission.granted) return true;

  if (!permission.canAskAgain) {
    Alert.alert(
      'Photo access needed',
      'Damroo needs permission to save images to your photos. Enable it in Settings to continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ],
    );
    return false;
  }

  Alert.alert('Permission needed', 'Allow photo access to save this image.');
  return false;
}

import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

function extensionFromUrl(url: string): string {
  const path = url.split('?')[0];
  const match = /\.([a-zA-Z0-9]+)$/.exec(path);
  return match ? match[1].toLowerCase() : 'jpg';
}

/**
 * Downloads a remote generated image and saves it into the device's photo
 * gallery. Caller is responsible for requesting {@link requestSaveToGalleryAccess}
 * first — this throws if permission hasn't been granted.
 */
export async function saveImageToGallery(remoteUrl: string): Promise<void> {
  const ext = extensionFromUrl(remoteUrl);
  const destination = new File(Paths.cache, `damroo-save-${Date.now()}.${ext}`);
  const downloaded = await File.downloadFileAsync(remoteUrl, destination, { idempotent: true });
  await MediaLibrary.Asset.create(downloaded.uri);
}

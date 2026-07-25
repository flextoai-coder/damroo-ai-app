import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function extensionFromUrl(url: string): string {
  const path = url.split('?')[0];
  const match = /\.([a-zA-Z0-9]+)$/.exec(path);
  return match ? match[1].toLowerCase() : 'jpg';
}

function mimeTypeForExtension(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

/**
 * Shares an image FILE (not just its remote URL) via the native share sheet.
 * Downloads it to a local cache file first — `Sharing.shareAsync` needs a
 * local URI to actually attach the image binary; handing it a bare remote
 * URL only shares a link/text, not the picture itself.
 */
export async function shareImage(remoteUrl: string, dialogTitle = 'Share image'): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing isn’t available on this device');
  }

  const ext = extensionFromUrl(remoteUrl);
  const destination = new File(Paths.cache, `damroo-share-${Date.now()}.${ext}`);
  const downloaded = await File.downloadFileAsync(remoteUrl, destination, { idempotent: true });

  await Sharing.shareAsync(downloaded.uri, {
    mimeType: mimeTypeForExtension(ext),
    dialogTitle,
  });
}

import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';

/**
 * Reads an image from the system clipboard (if any) and writes it to a local
 * cache file, returning its `file://` URI — ready to use as a reference
 * attachment. Returns `null` if the clipboard has no image right now.
 */
export async function readClipboardImage(): Promise<string | null> {
  const hasImage = await Clipboard.hasImageAsync();
  if (!hasImage) return null;

  const image = await Clipboard.getImageAsync({ format: 'png' });
  if (!image) return null;

  const base64 = image.data.slice(image.data.indexOf(',') + 1);
  const file = new File(Paths.cache, `paste-${Date.now()}.png`);
  file.create({ overwrite: true });
  file.write(base64, { encoding: 'base64' });

  return file.uri;
}

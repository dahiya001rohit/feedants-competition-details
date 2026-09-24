import * as ImagePicker from 'expo-image-picker';

export interface PickedVideo {
  uri: string;
  name: string;
  type: string;
  file?: File; // web only
}

// Lets the user pick a video. Resolves to null if they cancel, or 'too-large' so an oversized
// video is never uploaded just to be rejected.
export async function pickVideo(maxBytes: number): Promise<PickedVideo | null | 'too-large'> {
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
  const asset = picked.canceled ? null : picked.assets[0];
  if (!asset) return null;
  if (asset.fileSize && asset.fileSize > maxBytes) return 'too-large';

  const type = asset.mimeType ?? 'video/mp4';
  return {
    uri: asset.uri,
    type,
    name: asset.fileName ?? `submission.${type.split('/')[1] ?? 'mp4'}`,
    file: asset.file ?? undefined,
  };
}

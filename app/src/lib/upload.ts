import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Lets the user pick a video and packs it as the multipart body the submission API expects.
// Resolves to null if they cancel.
export async function pickSubmission(): Promise<FormData | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
  const asset = picked.canceled ? null : picked.assets[0];
  if (!asset) return null;

  const type = asset.mimeType ?? 'video/mp4';
  const name = asset.fileName ?? `submission.${type.split('/')[1] ?? 'mp4'}`;
  const form = new FormData();
  if (Platform.OS === 'web') form.append('video', asset.file ?? (await (await fetch(asset.uri)).blob()), name);
  else form.append('video', { uri: asset.uri, name, type } as unknown as Blob); // RN's FormData file shape
  return form;
}

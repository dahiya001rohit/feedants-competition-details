import { Alert, Linking, Platform } from 'react-native';

// Alert.alert is a no-op on react-native-web, so fall back to the browser dialogs there.
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

export function confirm(title: string, message: string, okText: string, cancelText: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      { text: okText, onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}

export const openLink = (url?: string) => {
  if (url) Linking.openURL(url).catch(() => notify("Couldn't open link", url));
};

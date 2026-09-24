import { useEffect } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '../i18n';
import { useSession } from '../session';
import { colors } from '../theme';
import { T } from './ui';
import { notify } from '../lib/dialog';

export function UserSwitcher({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useT();
  const { demoUsers, user, switchUser, refreshDemoUsers } = useSession();

  useEffect(() => {
    if (visible) refreshDemoUsers().catch(() => {}); // keep showing the last list if offline
  }, [visible, refreshDemoUsers]);

  const pick = async (id: string) => {
    try {
      await switchUser(id);
      onClose();
    } catch {
      notify(t.errorTitle, t.errors.NETWORK);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <T w="semibold" size={16}>
          {t.switchUser}
        </T>
        <T size={12} color={colors.textMuted} style={{ marginBottom: 8 }}>
          {t.switchUserSub}
        </T>
        {demoUsers.map((u) => (
          <Pressable key={u.id} onPress={() => pick(u.id)} style={styles.row} accessibilityRole="button">
            <Image source={{ uri: u.avatarUrl }} style={styles.avatar} />
            <T w="medium" style={{ flex: 1 }}>
              {u.name}
            </T>
            {u.id === user?.id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 36,
    gap: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.subtle },
});

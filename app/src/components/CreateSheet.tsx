import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError, type MyRegistration } from '../api';
import { useT } from '../i18n';
import { notify } from '../lib/dialog';
import { pickVideo } from '../lib/upload';
import { useSession } from '../session';
import { colors } from '../theme';
import { EmptyState, PrimaryButton, T } from './ui';

// The "+" action: upload an entry to any joined competition that is accepting submissions.
export function CreateSheet({ visible, onClose, onBrowse }: { visible: boolean; onClose: () => void; onBrowse: () => void }) {
  const t = useT();
  const { lang, user } = useSession();
  const [items, setItems] = useState<MyRegistration[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const { registrations } = await api.myRegistrations(lang);
      setItems(registrations.filter((r) => r.competition.submissionOpen));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };

  useEffect(() => {
    if (visible) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, lang, user?.id]);

  const upload = async (item: MyRegistration) => {
    const video = await pickVideo(item.competition.maxUploadBytes);
    if (video === 'too-large') return notify(t.errorTitle, t.errors.FILE_TOO_LARGE);
    if (!video) return;
    setUploadingId(item.competition.id);
    try {
      await api.uploadSubmission(item.competition.id, lang, video);
      notify(t.uploadedTitle, t.uploadedBody);
    } catch (e) {
      const err = e as ApiError;
      notify(t.errorTitle, t.errors[err.code] ?? err.message);
    } finally {
      setUploadingId(null);
      load();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <T w="semibold" size={16}>
              {t.createTitle}
            </T>
            <T size={12} color={colors.textMuted}>
              {t.createSub}
            </T>
          </View>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t.close}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        {failed ? (
          <T color={colors.textMuted}>{t.errors.NETWORK}</T>
        ) : !items ? (
          <ActivityIndicator color={colors.primary} />
        ) : items.length === 0 ? (
          <EmptyState text={t.noOpenUploads} action={t.browse} onAction={onBrowse} />
        ) : (
          <ScrollView contentContainerStyle={{ gap: 10 }}>
            {items.map((item) => {
              const busy = uploadingId === item.competition.id;
              return (
                <View key={item.competition.id} style={styles.item}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T w="semibold" size={14}>
                      {item.competition.title}
                    </T>
                    <T size={11} color={item.viewer.submission ? colors.primary : colors.textMuted}>
                      {item.viewer.submission ? `✓ ${t.submittedStatus}` : t.notSubmittedStatus}
                    </T>
                  </View>
                  {busy ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <PrimaryButton
                      compact
                      label={item.viewer.submission ? t.replace : t.upload}
                      onPress={() => upload(item)}
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.subtle,
    borderRadius: 10,
    padding: 12,
  },
});

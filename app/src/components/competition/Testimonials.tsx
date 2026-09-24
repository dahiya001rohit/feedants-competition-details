import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, type Testimonial } from '../../api';
import { useT } from '../../i18n';
import { useSession } from '../../session';
import { colors } from '../../theme';
import { Card, PrimaryButton, T } from '../ui';

function TestimonialsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useT();
  const { lang } = useSession();
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Fetched lazily: most visitors never open this.
  useEffect(() => {
    if (!visible) return;
    let live = true;
    setFailed(false);
    api
      .testimonials(lang)
      .then((r) => live && setItems(r.testimonials))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [visible, lang]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <T w="semibold" size={16}>
            {t.hearFromUsers}
          </T>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t.close}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>
        {failed ? (
          <T color={colors.textMuted}>{t.errors.NETWORK}</T>
        ) : !items ? (
          <ActivityIndicator color={colors.primary} />
        ) : items.length === 0 ? (
          <T color={colors.textMuted}>{t.noTestimonials}</T>
        ) : (
          <ScrollView contentContainerStyle={{ gap: 12 }}>
            {items.map((x) => (
              <View key={x.id} style={styles.item}>
                <View style={styles.person}>
                  <Image source={{ uri: x.avatarUrl }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <T w="semibold">{x.name}</T>
                    {!!x.role && (
                      <T size={11} color={colors.textMuted}>
                        {x.role}
                      </T>
                    )}
                  </View>
                  {!!x.rating && (
                    <T size={12} color={colors.gold}>
                      {'★'.repeat(x.rating)}
                    </T>
                  )}
                </View>
                <T size={13} color="#46525C" style={{ lineHeight: 20 }}>
                  “{x.quote}”
                </T>
              </View>
            ))}
          </ScrollView>
        )}
        <PrimaryButton label={t.close} onPress={onClose} />
      </View>
    </Modal>
  );
}

export function TestimonialsRow() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button">
        <Card style={styles.row}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
          <View style={{ flex: 1 }}>
            <T w="semibold" size={13}>
              {t.hearFromUsers}
            </T>
            <T size={11} color={colors.textMuted}>
              {t.hearFromUsersSub}
            </T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Card>
      </Pressable>
      <TestimonialsSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    maxHeight: '75%',
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  item: { gap: 8, backgroundColor: colors.subtle, borderRadius: 10, padding: 12 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border },
});

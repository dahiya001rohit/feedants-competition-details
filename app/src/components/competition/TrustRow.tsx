import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '../../i18n';
import { notify, openLink } from '../../lib/dialog';
import { colors } from '../../theme';
import { Card, T } from '../ui';

export function TrustRow({ prizeInfoVideoUrl, refundPolicy }: { prizeInfoVideoUrl?: string; refundPolicy: string | null }) {
  const t = useT();
  return (
    <View style={styles.row}>
      <Card style={styles.half}>
        <Pressable
          onPress={() => openLink(prizeInfoVideoUrl)}
          disabled={!prizeInfoVideoUrl}
          style={styles.inline}
          accessibilityRole="button"
        >
          <View style={styles.play}>
            <Ionicons name="play-circle" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <T w="semibold" size={12}>
              {t.prizeMoneyTitle}
            </T>
            <T size={10} color={colors.textMuted}>
              {t.watchVideo}
            </T>
          </View>
        </Pressable>
      </Card>

      <Card style={[styles.half, { gap: 10, justifyContent: 'center' }]}>
        <Pressable
          onPress={() => refundPolicy && notify(t.refundPolicy, refundPolicy)}
          style={styles.inline}
          accessibilityRole="link"
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.text} />
          <T size={12} style={{ textDecorationLine: 'underline' }}>
            {t.refundPolicy}
          </T>
        </Pressable>
        <View style={styles.inline}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.text} />
          <T size={11} style={{ flex: 1 }}>
            {t.securePayments}{' '}
            <T w="bold" size={12} color={colors.razorpay} style={{ fontStyle: 'italic' }}>
              Razorpay
            </T>
          </T>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, padding: 12 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  play: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

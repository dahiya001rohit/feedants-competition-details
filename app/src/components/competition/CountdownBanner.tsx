import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Competition } from '../../api';
import { useCountdown } from '../../hooks/useCountdown';
import { useT } from '../../i18n';
import { formatDuration } from '../../lib/format';
import { colors } from '../../theme';
import { T } from '../ui';

const URGENT_MS = 2 * 24 * 3600e3;

// Ticks locally (only this component re-renders each second) and asks the screen to
// refetch when the deadline passes so the phase and CTA move on.
export function CountdownBanner({ c, clockOffset, onExpire }: { c: Competition; clockOffset: number; onExpire: () => void }) {
  const t = useT();
  const remaining = useCountdown(c.countdown?.endsAt, clockOffset, onExpire);

  if (!c.countdown) {
    return (
      <View style={styles.banner}>
        <MaterialCommunityIcons name={c.phase === 'cancelled' ? 'cancel' : 'trophy-outline'} size={22} color={colors.primary} />
        <T w="medium" size={13}>
          {c.phase === 'cancelled' ? t.cancelledBanner : t.completedBanner}
        </T>
      </View>
    );
  }

  const hurry =
    c.countdown.key === 'registrationCloses' &&
    c.spotsLeft > 0 &&
    (remaining < URGENT_MS || c.spotsLeft <= Math.ceil(c.capacity * 0.2));

  return (
    <View style={styles.banner} accessibilityLiveRegion="none">
      <MaterialCommunityIcons name="timer-sand" size={22} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <T w="medium" size={12}>
          {t.countdown[c.countdown.key]}
        </T>
        <T w="semibold" size={17} color={colors.primary} style={{ fontVariant: ['tabular-nums'] }}>
          {formatDuration(remaining)}
        </T>
      </View>
      {hurry && (
        <View style={styles.hurry}>
          <Ionicons name="stopwatch-outline" size={18} color={colors.primary} />
          <T w="semibold" size={12} color={colors.primary}>
            {t.hurryUp}
          </T>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  hurry: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

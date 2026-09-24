import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Competition, CompetitionSummary } from '../../api';
import { useT } from '../../i18n';
import { formatMoney } from '../../lib/format';
import { colors } from '../../theme';
import { Card, Chip, ProgressBar, T } from '../ui';

export function RegisteredBadge() {
  const t = useT();
  return (
    <View style={styles.badge}>
      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
      <T size={12} w="medium" color={colors.primary}>
        {t.registered}
      </T>
    </View>
  );
}

// Before registration opens show capacity, after it closes show turnout; "spots left" only while it's open.
export function SpotsMeter({ c }: { c: Pick<CompetitionSummary, 'phase' | 'registrationOpen' | 'spotsLeft' | 'bookedCount' | 'capacity'> }) {
  const t = useT();
  const label = c.registrationOpen
    ? t.spotsLeft(c.spotsLeft)
    : c.phase === 'upcoming'
      ? t.totalSpots(c.capacity)
      : t.participants(c.bookedCount);
  const tone = c.registrationOpen && c.spotsLeft === 0 ? colors.danger : colors.primary;
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.row}>
        <Ionicons name="people-outline" size={15} color={tone} />
        <T size={12} w="medium" color={tone} style={{ flexShrink: 1 }}>
          {label}
        </T>
      </View>
      <ProgressBar value={c.bookedCount / c.capacity} />
      <T size={11} color={colors.textMuted}>
        {t.booked(c.bookedCount, c.capacity)}
      </T>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ minWidth: 64 }}>
      <T size={12} color={colors.textMuted}>
        {label}
      </T>
      <T w="bold" size={22} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </T>
    </View>
  );
}

export function SummaryCard({ c, registered }: { c: Competition; registered: boolean }) {
  const t = useT();
  return (
    <Card style={{ gap: 12 }}>
      <View style={[styles.row, { alignItems: 'flex-start', gap: 10 }]}>
        <T w="semibold" size={19} style={{ flex: 1 }} accessibilityRole="header">
          {c.title}
        </T>
        {registered && <RegisteredBadge />}
      </View>

      <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
        <Chip label={c.category} />
        {c.tags.map((tag) => (
          <Chip key={tag} label={tag} />
        ))}
        {c.certificateForWinners && (
          <View style={styles.row}>
            <Ionicons name="trophy-outline" size={15} color={colors.primary} />
            <T size={12} color={colors.primary}>
              {t.winnersGetCertificate}
            </T>
          </View>
        )}
      </View>

      <View style={[styles.row, { gap: 22, alignItems: 'flex-start' }]}>
        <Stat label={t.prizePool} value={formatMoney(c.prizePool)} />
        <Stat label={t.entryFee} value={formatMoney(c.entryFee)} />
        <View style={{ flex: 1 }}>
          <SpotsMeter c={c} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});

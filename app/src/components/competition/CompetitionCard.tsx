import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CompetitionSummary, MyRegistration } from '../../api';
import { useT } from '../../i18n';
import { getCta } from '../../lib/cta';
import { formatDateTime, formatMoney } from '../../lib/format';
import { useSession } from '../../session';
import { colors } from '../../theme';
import { Card, Chip, T } from '../ui';
import { RegisteredBadge, SpotsMeter } from './SummaryCard';

function PhaseChip({ c }: { c: CompetitionSummary }) {
  const t = useT();
  const full = c.registrationOpen && c.spotsLeft === 0;
  return (
    <Chip
      label={full ? t.full : t.phase[c.phase]}
      color={full || c.phase === 'cancelled' ? colors.danger : colors.primary}
      bg={colors.primarySoft}
    />
  );
}

// Full card: prize, fee and spots. Used by the Competitions, Explore and Home lists.
export function CompetitionCard({ c, onPress }: { c: CompetitionSummary; onPress: () => void }) {
  const t = useT();
  const { lang } = useSession();
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card style={{ gap: 10 }}>
        <View style={styles.row}>
          <T w="semibold" size={16} style={{ flex: 1 }}>
            {c.title}
          </T>
          {c.registered && <RegisteredBadge />}
        </View>
        <View style={styles.row}>
          <Chip label={c.category} />
          <PhaseChip c={c} />
        </View>
        <View style={[styles.row, { alignItems: 'flex-start', gap: 18 }]}>
          <Stat label={t.prizePool} value={formatMoney(c.prizePool)} />
          <Stat label={t.entryFee} value={formatMoney(c.entryFee)} />
          <View style={{ flex: 1 }}>
            <SpotsMeter c={c} />
          </View>
        </View>
        {c.registrationOpen && (
          <T size={11} color={colors.textMuted}>
            {t.closesOn(formatDateTime(c.schedule.registrationClosesAt, lang))}
          </T>
        )}
      </Card>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <T size={11} color={colors.textMuted}>
        {label}
      </T>
      <T w="bold" size={18}>
        {value}
      </T>
    </View>
  );
}

// Compact row for a competition the user joined, showing their next step (same wording as the details button).
export function MyCompetitionRow({ item, onPress, right }: { item: MyRegistration; onPress: () => void; right?: ReactNode }) {
  const t = useT();
  const { lang } = useSession();
  const cta = getCta(item.competition, item.viewer, t, lang);
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card style={[styles.row, { gap: 12 }]}>
        <View style={{ flex: 1, gap: 6 }}>
          <T w="semibold" size={14}>
            {item.competition.title}
          </T>
          <View style={styles.row}>
            <Chip label={item.competition.category} />
            <PhaseChip c={item.competition} />
          </View>
          <View style={styles.row}>
            <Ionicons
              name={item.viewer.submission ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={item.viewer.submission ? colors.primary : colors.textMuted}
            />
            <T size={11} color={colors.textMuted} style={{ flex: 1 }}>
              {[cta.title, cta.subtitle].filter(Boolean).join(' · ')}
            </T>
          </View>
        </View>
        {right ?? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

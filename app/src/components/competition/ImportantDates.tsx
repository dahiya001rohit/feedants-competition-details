import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import type { Schedule } from '../../api';
import { useT } from '../../i18n';
import { useSession } from '../../session';
import { formatDate, formatTime } from '../../lib/format';
import { colors } from '../../theme';
import { Card, T } from '../ui';

export function ImportantDates({ schedule }: { schedule: Schedule }) {
  const t = useT();
  const { lang } = useSession();
  const icon = (name: keyof typeof Ionicons.glyphMap) => <Ionicons name={name} size={22} color={colors.primary} />;
  const items: { icon: ReactNode; label: string; at: string }[] = [
    { icon: icon('calendar-outline'), label: t.registerBefore, at: schedule.registrationClosesAt },
    { icon: icon('paper-plane-outline'), label: t.submissionStarts, at: schedule.submissionStartsAt },
    {
      icon: <MaterialCommunityIcons name="tray-arrow-up" size={22} color={colors.primary} />,
      label: t.submissionEnds,
      at: schedule.submissionEndsAt,
    },
    { icon: icon('trophy-outline'), label: t.resultDate, at: schedule.resultAt },
  ];

  return (
    <Card style={{ gap: 10 }}>
      <T w="semibold" size={14}>
        {t.importantDates}
      </T>
      <View style={styles.grid}>
        {items.map((it, i) => {
          const passed = Date.parse(it.at) <= Date.now();
          return (
            <View key={it.label} style={[styles.cell, i % 2 === 0 && styles.right, i < 2 && styles.bottom]}>
              {it.icon}
              <View style={{ flex: 1 }}>
                <T size={11} color={colors.textMuted}>
                  {it.label}
                </T>
                <T w="semibold" size={13} color={passed ? colors.textMuted : colors.primary}>
                  {formatDate(it.at, lang)}
                </T>
                <T w="medium" size={12} color={passed ? colors.textMuted : colors.text}>
                  {formatTime(it.at)}
                </T>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  cell: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  right: { borderRightWidth: 1, borderRightColor: colors.border },
  bottom: { borderBottomWidth: 1, borderBottomColor: colors.border },
});

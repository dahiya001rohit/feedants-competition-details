import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Competition } from '../../api';
import { useT } from '../../i18n';
import { formatMoney } from '../../lib/format';
import { colors } from '../../theme';
import { Card, T } from '../ui';

function PositionIcon({ position }: { position: number }) {
  if (position === 1) return <MaterialCommunityIcons name="trophy" size={20} color={colors.gold} />;
  if (position === 2) return <MaterialCommunityIcons name="medal" size={20} color={colors.silver} />;
  if (position === 3) return <MaterialCommunityIcons name="medal" size={20} color={colors.bronze} />;
  return <Ionicons name="star-outline" size={18} color={colors.primary} />;
}

export function RewardsList({ rewards }: { rewards: Competition['rewards'] }) {
  const t = useT();
  return (
    <Card style={{ gap: 6 }}>
      <View style={[styles.row, { marginBottom: 4 }]}>
        <T w="semibold" size={14}>
          {t.rewards}
        </T>
        <T size={12} color={colors.textMuted}>
          {t.allPositions}
        </T>
      </View>
      {rewards.map((r) => (
        <View key={r.position} style={styles.reward}>
          <View style={styles.icon}>
            <PositionIcon position={r.position} />
          </View>
          <T w="medium" size={13} style={{ flex: 1 }}>
            {t.winner(r.position)}
          </T>
          <T w="semibold" size={15} color={colors.primary}>
            {formatMoney(r.amount)}
          </T>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.subtle,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  icon: { width: 22, alignItems: 'center' },
});

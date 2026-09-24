import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Competition } from '../../api';
import { useT } from '../../i18n';
import { openLink } from '../../lib/dialog';
import { colors } from '../../theme';
import { Card, T } from '../ui';

export function JudgeCard({ judge }: { judge: Competition['judge'] }) {
  const t = useT();
  return (
    <Card style={styles.card}>
      <Image source={{ uri: judge.photoUrl }} style={styles.photo} accessibilityIgnoresInvertColors />
      <View style={{ flex: 1 }}>
        <T size={11} color={colors.textMuted}>
          {t.judge}
        </T>
        <T w="semibold" size={16}>
          {judge.name}
        </T>
        {!!judge.title && (
          <T size={12} color={colors.textMuted}>
            {judge.title}
          </T>
        )}
        {!!judge.experience && (
          <T size={12} color={colors.textMuted}>
            {judge.experience}
          </T>
        )}
      </View>
      {!!judge.introVideoUrl && (
        <Pressable onPress={() => openLink(judge.introVideoUrl)} style={styles.video} accessibilityRole="button">
          <View style={styles.play}>
            <Ionicons name="play" size={18} color={colors.primary} />
          </View>
          <T size={11} color={colors.textMuted}>
            {t.introVideo}
          </T>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photo: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.subtle },
  video: { alignItems: 'center', gap: 4 },
  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

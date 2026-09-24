import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Winner } from '../../api';
import { useT } from '../../i18n';
import { openLink } from '../../lib/dialog';
import { colors } from '../../theme';
import { Card, T } from '../ui';

export function PreviousWinners({ winners }: { winners: Winner[] }) {
  const t = useT();
  return (
    <Card style={{ paddingHorizontal: 0, gap: 10 }}>
      <T w="semibold" size={14} style={{ paddingHorizontal: 14 }}>
        {t.previousWinners}
      </T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {winners.map((w, i) => (
          <Pressable
            key={`${w.name}-${i}`}
            onPress={() => openLink(w.videoUrl)}
            disabled={!w.videoUrl}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={`${w.name}, ${t.winner(w.position)}`}
          >
            <View>
              <Image source={{ uri: w.photoUrl }} style={styles.photo} />
              {!!w.videoUrl && (
                <View style={styles.play}>
                  <Ionicons name="play" size={11} color={colors.white} />
                </View>
              )}
            </View>
            <View style={{ maxWidth: 88 }}>
              <T w="medium" size={12} numberOfLines={1}>
                {w.name}
              </T>
              <T size={11} color={colors.primary}>
                {t.winner(w.position)}
              </T>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 14, gap: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.subtle,
    borderRadius: 10,
    padding: 6,
    paddingRight: 12,
  },
  photo: { width: 62, height: 62, borderRadius: 8, backgroundColor: colors.border },
  play: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

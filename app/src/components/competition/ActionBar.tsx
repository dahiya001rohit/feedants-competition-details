import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { Cta } from '../../lib/cta';
import { colors } from '../../theme';
import { T } from '../ui';

export function ActionBar({ cta, busyLabel, onPress }: { cta: Cta; busyLabel: string | null; onPress: () => void }) {
  const disabled = !cta.action || busyLabel !== null;
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [styles.button, !cta.action && styles.inactive, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: busyLabel !== null }}
        accessibilityLabel={[cta.title, cta.subtitle].filter(Boolean).join('. ')}
      >
        {busyLabel ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.white} />
            <T w="semibold" size={15} color={colors.white}>
              {busyLabel}
            </T>
          </View>
        ) : (
          <>
            <T w="semibold" size={15} color={colors.white}>
              {cta.title}
            </T>
            {!!cta.subtitle && (
              <T size={11} color={colors.white} style={{ opacity: 0.9 }}>
                {cta.subtitle}
              </T>
            )}
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.bg },
  button: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  inactive: { backgroundColor: colors.disabled },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});

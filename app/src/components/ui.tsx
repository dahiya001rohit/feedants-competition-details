import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type TextProps, type ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

type TProps = TextProps & { w?: keyof typeof fonts; size?: number; color?: string };

export function T({ w = 'regular', size = 13, color = colors.text, style, ...rest }: TProps) {
  return <Text {...rest} style={[{ fontFamily: fonts[w], fontSize: size, color }, style]} />;
}

export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <View style={[styles.fill, { width: `${Math.min(1, Math.max(0, value)) * 100}%` }]} />
    </View>
  );
}

export function Chip({ label, color = colors.text, bg = colors.subtle }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <T size={11} w="medium" color={color}>
        {label}
      </T>
    </View>
  );
}

export function InfoBanner({ icon, children }: { icon: keyof typeof Ionicons.glyphMap; children: ReactNode }) {
  return (
    <View style={styles.banner}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export function AdSlot({ label }: { label: string }) {
  return (
    <View style={styles.ad} accessibilityLabel={label}>
      <Ionicons name="megaphone-outline" size={16} color={colors.textMuted} />
      <T size={12} w="medium" color={colors.textMuted}>
        {label}
      </T>
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <T w="semibold" size={15} accessibilityRole="header">
        {title}
      </T>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <T w="medium" size={12} color={colors.primary}>
            {action}
          </T>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 20 }}>
      <T size={13} color={colors.textMuted} style={{ textAlign: 'center' }}>
        {text}
      </T>
      {!!action && onAction && <PrimaryButton compact label={action} onPress={onAction} />}
    </Card>
  );
}

export function PrimaryButton({ label, onPress, compact }: { label: string; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, compact && styles.buttonCompact, pressed && { opacity: 0.85 }]} accessibilityRole="button">
      <T w="semibold" size={compact ? 12 : 14} color={colors.white}>
        {label}
      </T>
    </Pressable>
  );
}

export function ScreenState({ error, onRetry, retryLabel }: { error?: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <View style={styles.center}>
      {error ? (
        <>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
          <T w="medium" size={15} style={{ textAlign: 'center' }}>
            {error}
          </T>
          {onRetry && retryLabel && <PrimaryButton label={retryLabel} onPress={onRetry} />}
        </>
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    boxShadow: '0 1px 3px rgba(16, 40, 40, 0.06)',
  },
  track: { height: 4, borderRadius: 2, backgroundColor: '#DDE9E8', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.primary },
  chip: { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C7D1D1',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonCompact: { paddingHorizontal: 14, paddingVertical: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
});

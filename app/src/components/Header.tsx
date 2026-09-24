import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Lang } from '../api';
import { useT } from '../i18n';
import { useSession } from '../session';
import { colors } from '../theme';
import { T } from './ui';

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'ENG' },
  { value: 'hi', label: 'हिंदी' },
];

export function LanguageToggle() {
  const { lang, setLang } = useSession();
  return (
    <View style={styles.toggle} accessibilityRole="radiogroup">
      {LANGS.map((l) => {
        const active = l.value === lang;
        return (
          <Pressable
            key={l.value}
            onPress={() => setLang(l.value)}
            style={[styles.option, active && styles.optionActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <T size={12} w={active ? 'semibold' : 'medium'} color={active ? colors.white : colors.text}>
              {l.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Header({ title, onBack }: { title?: string; onBack?: () => void }) {
  const t = useT();
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.back} hitSlop={10} accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <T w="medium" size={16}>
            {t.goBack}
          </T>
        </Pressable>
      ) : (
        <T w="semibold" size={20}>
          {title}
        </T>
      )}
      <LanguageToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggle: { flexDirection: 'row', backgroundColor: '#EDF1F1', borderRadius: 16, padding: 2 },
  option: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14 },
  optionActive: { backgroundColor: colors.primary },
});

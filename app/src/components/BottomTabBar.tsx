import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { useSession } from '../session';
import { colors } from '../theme';
import type { TabName } from '../navigation';
import { CreateSheet } from './CreateSheet';
import { T } from './ui';

// Rendered by the tab navigator, and by the details screen (which sits above the tabs on the root stack).
export function BottomTabBar({ active, onSelect }: { active: TabName; onSelect: (tab: TabName) => void }) {
  const t = useT();
  const { user } = useSession();
  const insets = useSafeAreaInsets();
  const [createOpen, setCreateOpen] = useState(false);

  const item = (tab: TabName, label: string, icon: keyof typeof Ionicons.glyphMap) => {
    const selected = tab === active;
    return (
      <Pressable onPress={() => onSelect(tab)} style={styles.item} accessibilityRole="tab" accessibilityState={{ selected }}>
        <Ionicons name={icon} size={22} color={selected ? colors.primary : colors.textMuted} />
        <T size={10} w={selected ? 'semibold' : 'regular'} color={selected ? colors.primary : colors.textMuted}>
          {label}
        </T>
      </Pressable>
    );
  };
  const profileSelected = active === 'Profile';

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {item('Home', t.nav.home, 'home')}
      {item('Explore', t.nav.explore, 'search')}
      <Pressable onPress={() => setCreateOpen(true)} style={styles.item} accessibilityRole="button" accessibilityLabel={t.createTitle}>
        <View style={styles.plus}>
          <Ionicons name="add-circle-outline" size={26} color={colors.white} />
        </View>
      </Pressable>
      {item('Competitions', t.nav.competitions, 'trophy')}
      <Pressable
        onPress={() => onSelect('Profile')}
        style={styles.item}
        accessibilityRole="tab"
        accessibilityState={{ selected: profileSelected }}
      >
        <Image source={{ uri: user?.avatarUrl }} style={[styles.avatar, profileSelected && styles.avatarActive]} />
        <T size={10} w={profileSelected ? 'semibold' : 'regular'} color={profileSelected ? colors.primary : colors.textMuted}>
          {t.nav.profile}
        </T>
      </Pressable>
      <CreateSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onBrowse={() => {
          setCreateOpen(false);
          onSelect('Competitions');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  plus: {
    width: 46,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.subtle },
  avatarActive: { borderWidth: 2, borderColor: colors.primary },
});

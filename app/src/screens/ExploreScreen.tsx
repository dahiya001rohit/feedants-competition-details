import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useFocusedFetch } from '../hooks/useFocusedFetch';
import { useT } from '../i18n';
import { useAppNavigation } from '../navigation';
import { useSession } from '../session';
import { colors, fonts } from '../theme';
import { Header } from '../components/Header';
import { EmptyState, ScreenState, T } from '../components/ui';
import { CompetitionCard } from '../components/competition/CompetitionCard';

export function ExploreScreen() {
  const t = useT();
  const navigation = useAppNavigation();
  const { lang, user } = useSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetcher = useCallback(() => api.competitions(lang), [lang, user?.id]);
  const { data, failed, refreshing, refresh, reload } = useFocusedFetch(fetcher);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  // ponytail: filters the (capped) list on the device; move search to the API when the catalogue outgrows one page
  const competitions = data?.competitions ?? [];
  const categories = [...new Set(competitions.map((c) => c.category))];
  const q = query.trim().toLowerCase();
  const results = competitions.filter(
    (c) =>
      (!category || c.category === category) &&
      (!q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)),
  );

  const chip = (label: string, value: string | null) => {
    const selected = category === value;
    return (
      <Pressable
        key={label}
        onPress={() => setCategory(value)}
        style={[styles.chip, selected && styles.chipActive]}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
      >
        <T size={12} w="medium" color={selected ? colors.white : colors.text}>
          {label}
        </T>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title={t.nav.explore} />
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={t.searchPlaceholder}
        />
        {!!query && (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel={t.clearSearch}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {!data ? (
        <ScreenState error={failed ? t.loadFailed : undefined} onRetry={reload} retryLabel={t.retry} />
      ) : (
        <>
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {chip(t.all, null)}
              {categories.map((c) => chip(c, c))}
            </ScrollView>
          </View>
          <FlatList
            data={results}
            keyExtractor={(c) => c.id}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
            ListEmptyComponent={<EmptyState text={t.noResults} />}
            renderItem={({ item }) => (
              <CompetitionCard c={item} onPress={() => navigation.navigate('CompetitionDetails', { id: item.id })} />
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text, paddingVertical: 0 },
  chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  content: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
});

import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api';
import { useFocusedFetch } from '../hooks/useFocusedFetch';
import { useT } from '../i18n';
import { useAppNavigation } from '../navigation';
import { useSession } from '../session';
import { colors } from '../theme';
import { Header } from '../components/Header';
import { ScreenState } from '../components/ui';
import { CompetitionCard } from '../components/competition/CompetitionCard';

export function CompetitionListScreen() {
  const t = useT();
  const navigation = useAppNavigation();
  const { lang, user } = useSession();
  // user is a dependency so the "registered" flags follow the signed-in user
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetcher = useCallback(() => api.competitions(lang), [lang, user?.id]);
  const { data, failed, refreshing, refresh, reload } = useFocusedFetch(fetcher);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title={t.competitions} />
      {!data ? (
        <ScreenState error={failed ? t.loadFailed : undefined} onRetry={reload} retryLabel={t.retry} />
      ) : (
        <FlatList
          data={data.competitions}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <CompetitionCard c={item} onPress={() => navigation.navigate('CompetitionDetails', { id: item.id })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 12 },
});

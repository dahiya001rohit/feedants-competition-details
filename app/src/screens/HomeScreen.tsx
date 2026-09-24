import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api';
import { useFocusedFetch } from '../hooks/useFocusedFetch';
import { useT } from '../i18n';
import { useAppNavigation } from '../navigation';
import { useSession } from '../session';
import { colors } from '../theme';
import { Header } from '../components/Header';
import { EmptyState, ScreenState, SectionTitle, T } from '../components/ui';
import { CompetitionCard, MyCompetitionRow } from '../components/competition/CompetitionCard';

const PREVIEW = 3;

export function HomeScreen() {
  const t = useT();
  const navigation = useAppNavigation();
  const { lang, user } = useSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchMine = useCallback(() => api.myRegistrations(lang), [lang, user?.id]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchAll = useCallback(() => api.competitions(lang), [lang, user?.id]);
  const mine = useFocusedFetch(fetchMine);
  const all = useFocusedFetch(fetchAll);

  const open = (id: string) => navigation.navigate('CompetitionDetails', { id });
  const closingSoon = (all.data?.competitions ?? [])
    .filter((c) => c.registrationOpen && c.spotsLeft > 0 && !c.registered)
    .sort((a, b) => Date.parse(a.schedule.registrationClosesAt) - Date.parse(b.schedule.registrationClosesAt));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title={t.greeting(user?.name.split(' ')[0] ?? '')} />
      {!mine.data || !all.data ? (
        <ScreenState
          error={mine.failed || all.failed ? t.loadFailed : undefined}
          onRetry={() => {
            mine.reload();
            all.reload();
          }}
          retryLabel={t.retry}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={mine.refreshing || all.refreshing}
              onRefresh={() => {
                mine.refresh();
                all.refresh();
              }}
              tintColor={colors.primary}
            />
          }
        >
          <T color={colors.textMuted}>{t.homeSub}</T>

          <SectionTitle
            title={t.yourCompetitions}
            action={mine.data.registrations.length > PREVIEW ? t.seeAll : undefined}
            onAction={() => navigation.navigate('Profile')}
          />
          {mine.data.registrations.length === 0 ? (
            <EmptyState text={t.noRegistrations} action={t.browse} onAction={() => navigation.navigate('Explore')} />
          ) : (
            mine.data.registrations
              .slice(0, PREVIEW)
              .map((r) => <MyCompetitionRow key={r.competition.id} item={r} onPress={() => open(r.competition.id)} />)
          )}

          <SectionTitle title={t.closingSoon} action={t.seeAll} onAction={() => navigation.navigate('Competitions')} />
          {closingSoon.length === 0 ? (
            <EmptyState text={t.nothingOpen} />
          ) : (
            closingSoon.slice(0, PREVIEW).map((c) => <CompetitionCard key={c.id} c={c} onPress={() => open(c.id)} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 12 },
});

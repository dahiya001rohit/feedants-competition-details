import { useCallback, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api';
import { useFocusedFetch } from '../hooks/useFocusedFetch';
import { useT } from '../i18n';
import { useAppNavigation } from '../navigation';
import { useSession } from '../session';
import { colors } from '../theme';
import { Header } from '../components/Header';
import { UserSwitcher } from '../components/UserSwitcher';
import { Card, Chip, EmptyState, PrimaryButton, ScreenState, SectionTitle, T } from '../components/ui';
import { MyCompetitionRow } from '../components/competition/CompetitionCard';
import { ReferralCard } from '../components/competition/ReferralCard';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card style={styles.stat}>
      <T w="bold" size={22} color={colors.primary}>
        {value}
      </T>
      <T size={12} color={colors.textMuted}>
        {label}
      </T>
    </Card>
  );
}

export function ProfileScreen() {
  const t = useT();
  const navigation = useAppNavigation();
  const { lang, user } = useSession();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetcher = useCallback(() => api.myRegistrations(lang), [lang, user?.id]);
  const { data, failed, refreshing, refresh, reload } = useFocusedFetch(fetcher);

  if (!user) return null;
  const registrations = data?.registrations ?? [];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title={t.nav.profile} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Card style={styles.identity}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <View style={{ flex: 1, gap: 6, alignItems: 'flex-start' }}>
            <T w="semibold" size={17}>
              {user.name}
            </T>
            <Chip label={t.demoAccount} />
          </View>
        </Card>
        <PrimaryButton label={t.switchUser} onPress={() => setSwitcherOpen(true)} />

        {!data ? (
          <ScreenState error={failed ? t.loadFailed : undefined} onRetry={reload} retryLabel={t.retry} />
        ) : (
          <>
            <View style={styles.stats}>
              <Stat label={t.joined} value={registrations.length} />
              <Stat label={t.submittedCount} value={registrations.filter((r) => r.viewer.submission).length} />
            </View>

            <SectionTitle title={t.myCompetitions} />
            {registrations.length === 0 ? (
              <EmptyState text={t.noRegistrations} action={t.browse} onAction={() => navigation.navigate('Explore')} />
            ) : (
              registrations.map((r) => (
                <MyCompetitionRow
                  key={r.competition.id}
                  item={r}
                  onPress={() => navigation.navigate('CompetitionDetails', { id: r.competition.id })}
                />
              ))
            )}
          </>
        )}

        <ReferralCard referral={user.referral} />
      </ScrollView>
      <UserSwitcher visible={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.subtle },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12 },
});

import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, ApiError, type CompetitionDetails } from '../api';
import { useCompetition } from '../hooks/useCompetition';
import { useT } from '../i18n';
import { getCta } from '../lib/cta';
import { confirm, notify } from '../lib/dialog';
import { pickSubmission } from '../lib/upload';
import type { RootStackParamList, TabName } from '../navigation';
import { useSession } from '../session';
import { colors } from '../theme';
import { BottomTabBar } from '../components/BottomTabBar';
import { Header } from '../components/Header';
import { AdSlot, InfoBanner, ScreenState, T } from '../components/ui';
import { ActionBar } from '../components/competition/ActionBar';
import { CountdownBanner } from '../components/competition/CountdownBanner';
import { ImportantDates } from '../components/competition/ImportantDates';
import { InfoTabs } from '../components/competition/InfoTabs';
import { JudgeCard } from '../components/competition/JudgeCard';
import { PreviousWinners } from '../components/competition/PreviousWinners';
import { ReferralCard } from '../components/competition/ReferralCard';
import { RewardsList } from '../components/competition/RewardsList';
import { SummaryCard } from '../components/competition/SummaryCard';
import { TestimonialsRow } from '../components/competition/Testimonials';
import { TrustRow } from '../components/competition/TrustRow';

type Props = NativeStackScreenProps<RootStackParamList, 'CompetitionDetails'>;

export function CompetitionDetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const t = useT();
  const { lang, user } = useSession();
  const { data, error, refreshing, refresh, reload, mutate, clockOffset } = useCompetition(id);
  const [busy, setBusy] = useState<'register' | 'upload' | null>(null);
  // This screen sits above the tabs, so a tab press returns to them.
  const openTab = (tab: TabName) => navigation.popTo('Tabs', { screen: tab });

  if (!data) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Header onBack={navigation.goBack} />
        <ScreenState error={error ? t.loadFailed : undefined} onRetry={reload} retryLabel={t.retry} />
      </SafeAreaView>
    );
  }

  const { competition: c, viewer } = data;
  const cta = getCta(c, viewer, t, lang);

  const run = async (kind: 'register' | 'upload', request: () => Promise<CompetitionDetails>, done: [string, string]) => {
    setBusy(kind);
    try {
      await mutate(request);
      notify(...done);
    } catch (e) {
      const err = e as ApiError;
      // A double tap that already went through is not an error for the user.
      if (err.code !== 'ALREADY_REGISTERED') notify(t.errorTitle, t.errors[err.code] ?? err.message);
      reload();
    } finally {
      setBusy(null);
    }
  };

  const onCta = async () => {
    if (cta.action === 'register') {
      const ok = await confirm(t.confirmRegisterTitle, t.confirmRegisterBody(c.entryFee, c.title), t.pay(c.entryFee), t.cancel);
      if (ok) await run('register', () => api.register(id, lang), [t.registeredTitle, t.registeredBody]);
    } else if (cta.action === 'upload') {
      const form = await pickSubmission();
      if (form) await run('upload', () => api.uploadSubmission(id, lang, form), [t.uploadedTitle, t.uploadedBody]);
    }
  };

  const tabs = [
    { title: t.tabs.about, body: c.about },
    { title: t.tabs.judging, body: c.judgingParameters },
    { title: t.tabs.rules, body: c.rules },
  ].filter((x): x is { title: string; body: string } => !!x.body);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header onBack={navigation.goBack} />
      {error && (
        <View style={styles.stale}>
          <T size={11} color={colors.white}>
            {t.staleData}
          </T>
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <SummaryCard c={c} registered={!!viewer?.registered} />
        <JudgeCard judge={c.judge} />
        <CountdownBanner c={c} clockOffset={clockOffset} onExpire={reload} />
        <ImportantDates schedule={c.schedule} />
        {c.previousWinners.length > 0 && <PreviousWinners winners={c.previousWinners} />}
        <InfoTabs key={`${c.id}-${lang}`} tabs={tabs} />
        {c.rewards.length > 0 && <RewardsList rewards={c.rewards} />}
        {!!c.disclaimer && (
          <InfoBanner icon="information-circle-outline">
            <T size={12}>
              <T size={12} w="semibold" color={colors.primary}>
                {t.disclaimer}
              </T>{' '}
              {c.disclaimer}
            </T>
          </InfoBanner>
        )}
        <TrustRow prizeInfoVideoUrl={c.prizeInfoVideoUrl} refundPolicy={c.refundPolicy} />
        {user && <ReferralCard referral={user.referral} />}
        <TestimonialsRow />
        <AdSlot label={t.adHere} />
      </ScrollView>
      <ActionBar
        cta={cta}
        busyLabel={busy === 'register' ? t.cta.registering : busy === 'upload' ? t.cta.uploading : null}
        onPress={onCta}
      />
      <BottomTabBar active="Competitions" onSelect={openTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 12 },
  stale: { backgroundColor: colors.textMuted, paddingVertical: 4, alignItems: 'center' },
});

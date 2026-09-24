import type { CompetitionSummary, Lang, Viewer } from '../api';
import type { Strings } from '../i18n';
import { formatDateTime } from './format';

export type CtaAction = 'register' | 'upload';

export interface Cta {
  title: string;
  subtitle?: string;
  action: CtaAction | null; // null = disabled
}

// The bottom action for every competition phase x viewer state. The server enforces the same
// rules on write; this only decides what to offer.
export function getCta(c: CompetitionSummary, viewer: Viewer | null, t: Strings, lang: Lang): Cta {
  const when = (iso: string) => formatDateTime(iso, lang);

  if (c.phase === 'cancelled') return { title: t.cta.cancelled, action: null };
  if (c.phase === 'completed') return { title: t.cta.resultsOut, action: null };

  if (!viewer?.registered) {
    if (c.registrationOpen && c.spotsLeft > 0) {
      return { title: t.cta.register, subtitle: t.cta.registerSub(c.entryFee), action: 'register' };
    }
    if (c.registrationOpen) return { title: t.cta.full, subtitle: t.cta.fullSub, action: null };
    if (c.phase === 'upcoming') {
      return { title: t.cta.opensSoon, subtitle: t.cta.opensOn(when(c.schedule.registrationOpensAt)), action: null };
    }
    return { title: t.cta.regClosed, action: null };
  }

  if (c.submissionOpen) {
    return { title: t.cta.upload, subtitle: viewer.submission ? t.cta.replaceSub : t.registered, action: 'upload' };
  }
  // Registration closes no later than submissions end, so before judging a closed window means "not yet".
  if (c.phase !== 'judging') {
    return { title: t.cta.upload, subtitle: t.cta.uploadsOpen(when(c.schedule.submissionStartsAt)), action: null };
  }
  return {
    title: viewer.submission ? t.cta.submitted : t.cta.submissionsClosed,
    subtitle: t.cta.resultsOn(when(c.schedule.resultAt)),
    action: null,
  };
}

// Lifecycle is derived from the schedule on every read and never stored, so it can't go stale
// and needs no cron job to flip states. Registration and submission windows may overlap.
function getTimeline(c, now = new Date()) {
  const s = c.schedule;
  const live = c.status === 'published';
  const registrationOpen = live && now >= s.registrationOpensAt && now < s.registrationClosesAt;
  const submissionOpen = live && now >= s.submissionStartsAt && now < s.submissionEndsAt;

  let phase;
  let countdown = null; // the next deadline the UI should count down to
  if (c.status === 'cancelled') {
    phase = 'cancelled';
  } else if (now < s.registrationOpensAt) {
    phase = 'upcoming';
    countdown = { key: 'registrationOpens', endsAt: s.registrationOpensAt };
  } else if (now < s.registrationClosesAt) {
    phase = 'registration_open';
    countdown = { key: 'registrationCloses', endsAt: s.registrationClosesAt };
  } else if (now < s.submissionEndsAt) {
    phase = 'in_progress';
    countdown =
      now < s.submissionStartsAt
        ? { key: 'submissionStarts', endsAt: s.submissionStartsAt }
        : { key: 'submissionEnds', endsAt: s.submissionEndsAt };
  } else if (now < s.resultAt) {
    phase = 'judging';
    countdown = { key: 'results', endsAt: s.resultAt };
  } else {
    phase = 'completed';
  }

  return { phase, registrationOpen, submissionOpen, countdown };
}

module.exports = { getTimeline };

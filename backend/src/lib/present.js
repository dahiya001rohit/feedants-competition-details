// Shapes DB documents into API responses: resolves translations and adds derived fields.
const { getTimeline } = require('./lifecycle');
const config = require('../config');

const t = (value, lang) => (value ? value[lang] || value.en : null);
const byPosition = (a, b) => a.position - b.position;

function presentSummary(c, lang, now) {
  return {
    id: String(c._id),
    slug: c.slug,
    status: c.status,
    ...getTimeline(c, now),
    title: t(c.title, lang),
    category: t(c.category, lang),
    entryFee: c.entryFee,
    currency: c.currency,
    prizePool: c.rewards.reduce((sum, r) => sum + r.amount, 0),
    capacity: c.capacity,
    bookedCount: c.bookedCount,
    spotsLeft: Math.max(0, c.capacity - c.bookedCount),
    schedule: c.schedule,
  };
}

function presentCompetition(c, lang, now) {
  return {
    ...presentSummary(c, lang, now),
    tags: c.tags.map((tag) => t(tag, lang)),
    certificateForWinners: c.certificateForWinners,
    judge: {
      name: c.judge.name,
      title: t(c.judge.title, lang),
      experience: t(c.judge.experience, lang),
      photoUrl: c.judge.photoUrl,
      introVideoUrl: c.judge.introVideoUrl,
    },
    previousWinners: [...c.previousWinners].sort(byPosition),
    about: t(c.about, lang),
    judgingParameters: t(c.judgingParameters, lang),
    rules: t(c.rules, lang),
    rewards: [...c.rewards].sort(byPosition),
    disclaimer: t(c.disclaimer, lang),
    refundPolicy: t(c.refundPolicy, lang),
    prizeInfoVideoUrl: c.prizeInfoVideoUrl,
  };
}

function presentViewer(registration) {
  const sub = registration?.submission;
  return {
    registered: Boolean(registration),
    registeredAt: registration?.createdAt ?? null,
    submission: sub?.submittedAt ? { fileName: sub.fileName, size: sub.size, submittedAt: sub.submittedAt } : null,
  };
}

function presentUser(u) {
  return {
    id: String(u._id),
    name: u.name,
    avatarUrl: u.avatarUrl,
    referral: {
      code: u.referralCode,
      link: `${config.publicWebUrl}/r/${u.referralCode}`,
      rewardPerSignup: config.referralRewardPerSignup,
    },
  };
}

module.exports = { t, presentSummary, presentCompetition, presentViewer, presentUser };

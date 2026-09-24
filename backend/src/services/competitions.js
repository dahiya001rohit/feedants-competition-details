const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const config = require('../config');
const { HttpError } = require('../lib/errors');
const { getTimeline } = require('../lib/lifecycle');
const { presentCompetition, presentSummary, presentViewer } = require('../lib/present');

const notFound = () => new HttpError(404, 'NOT_FOUND', 'Competition not found.');
const PHASE_ORDER = ['registration_open', 'upcoming', 'in_progress', 'judging', 'completed', 'cancelled'];

async function loadVisible(id) {
  if (!mongoose.isValidObjectId(id)) throw notFound();
  const c = await Competition.findOne({ _id: id, status: { $ne: 'draft' } }).lean();
  if (!c) throw notFound();
  return c;
}

async function listCompetitions(userId, lang) {
  const now = new Date();
  // ponytail: capped list, no pagination; add a cursor when the catalogue outgrows one screen
  const comps = await Competition.find({ status: { $ne: 'draft' } }).limit(50).lean();
  const mine = userId
    ? await Registration.find({ user: userId, competition: { $in: comps.map((c) => c._id) } }, { competition: 1 }).lean()
    : [];
  const registered = new Set(mine.map((r) => String(r.competition)));

  const items = comps.map((c) => ({ ...presentSummary(c, lang, now), registered: registered.has(String(c._id)) }));
  items.sort(
    (a, b) =>
      PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase) ||
      a.schedule.registrationClosesAt - b.schedule.registrationClosesAt,
  );
  return { serverTime: now, competitions: items };
}

// The user's registrations, newest first, each with its competition and submission status.
async function listMyRegistrations(userId, lang) {
  const now = new Date();
  const regs = await Registration.find({ user: userId }, { competition: 1, createdAt: 1, submission: 1 })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const comps = await Competition.find({ _id: { $in: regs.map((r) => r.competition) }, status: { $ne: 'draft' } }).lean();
  const byId = new Map(comps.map((c) => [String(c._id), c]));

  return {
    serverTime: now,
    registrations: regs
      .filter((r) => byId.has(String(r.competition)))
      .map((r) => ({
        competition: { ...presentSummary(byId.get(String(r.competition)), lang, now), registered: true },
        viewer: presentViewer(r),
      })),
  };
}

async function getDetails(id, userId, lang) {
  const now = new Date();
  const [c, registration] = await Promise.all([
    loadVisible(id),
    userId && mongoose.isValidObjectId(id) ? Registration.findOne({ competition: id, user: userId }).lean() : null,
  ]);
  return {
    serverTime: now,
    competition: presentCompetition(c, lang, now),
    viewer: userId ? presentViewer(registration) : null,
  };
}

/**
 * Books a spot for the user. Consistency under concurrent requests comes from:
 *  1. a conditional $inc that only matches while bookedCount < capacity and the window is open
 *     (single-document atomic, so the counter can never exceed capacity), and
 *  2. the unique (competition, user) index, so double taps can't create two registrations,
 * both inside one transaction so the counter and the registration never disagree.
 */
async function register(competitionId, userId) {
  const now = new Date();
  const c = await loadVisible(competitionId);

  // Fast-path checks so the common rejections never open a transaction. Re-checked atomically below.
  if (!getTimeline(c, now).registrationOpen) {
    throw new HttpError(409, 'REGISTRATION_CLOSED', 'Registration is not open for this competition.');
  }
  if (await Registration.exists({ competition: c._id, user: userId })) {
    throw new HttpError(409, 'ALREADY_REGISTERED', 'You are already registered.');
  }
  const full = () => new HttpError(409, 'COMPETITION_FULL', 'Sorry, all spots have been booked.');
  if (c.bookedCount >= c.capacity) throw full();

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const seat = await Competition.updateOne(
        {
          _id: c._id,
          status: 'published',
          'schedule.registrationOpensAt': { $lte: now },
          'schedule.registrationClosesAt': { $gt: now },
          $expr: { $lt: ['$bookedCount', '$capacity'] },
        },
        { $inc: { bookedCount: 1 } },
        { session },
      );
      if (seat.modifiedCount === 0) throw full();

      // ponytail: payment is mocked as instantly captured. Real flow: create a Razorpay order here with a
      // short seat hold, confirm the registration from the verified payment webhook, release the hold on expiry.
      await Registration.create(
        [
          {
            competition: c._id,
            user: userId,
            payment: { provider: 'mock', paymentId: `mock_${crypto.randomUUID()}`, amount: c.entryFee, status: 'captured' },
          },
        ],
        { session },
      );
    });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'ALREADY_REGISTERED', 'You are already registered.');
    throw err;
  } finally {
    await session.endSession();
  }
}

// Runs before multer so a rejected request never writes a file to disk.
async function assertCanSubmit(competitionId, userId) {
  const c = await loadVisible(competitionId);
  if (!(await Registration.exists({ competition: c._id, user: userId }))) {
    throw new HttpError(403, 'NOT_REGISTERED', 'Register for this competition before uploading.');
  }
  if (!getTimeline(c).submissionOpen) {
    throw new HttpError(409, 'SUBMISSION_CLOSED', 'The submission window is not open.');
  }
}

const removeUpload = (key) => fs.unlink(path.join(config.uploadDir, key)).catch(() => {});

// Users may replace their submission until the window closes; the previous file is deleted.
async function saveSubmission(competitionId, userId, file) {
  const previous = await Registration.findOneAndUpdate(
    { competition: competitionId, user: userId },
    {
      $set: {
        submission: {
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storageKey: file.filename,
          submittedAt: new Date(),
        },
      },
    },
  ).lean();
  if (!previous) {
    await removeUpload(file.filename);
    throw new HttpError(403, 'NOT_REGISTERED', 'Register for this competition before uploading.');
  }
  if (previous.submission?.storageKey) await removeUpload(previous.submission.storageKey);
}

module.exports = { listCompetitions, listMyRegistrations, getDetails, register, assertCanSubmit, saveSubmission };

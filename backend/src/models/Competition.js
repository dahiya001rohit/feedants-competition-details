const { Schema, model } = require('mongoose');
const Localized = require('./Localized');

const money = { type: Number, required: true, min: 0, validate: Number.isInteger };

const competitionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'draft' },

    title: { type: Localized, required: true },
    category: { type: Localized, required: true },
    tags: [Localized],
    certificateForWinners: { type: Boolean, default: false },

    entryFee: money, // whole rupees
    currency: { type: String, default: 'INR' },

    // bookedCount is only ever changed by the atomic, capacity-guarded $inc in services/registration.js
    capacity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    bookedCount: { type: Number, default: 0, min: 0 },

    judge: {
      name: { type: String, required: true },
      title: Localized,
      experience: Localized,
      photoUrl: String,
      introVideoUrl: String,
    },

    schedule: {
      registrationOpensAt: { type: Date, required: true },
      registrationClosesAt: { type: Date, required: true },
      submissionStartsAt: { type: Date, required: true },
      submissionEndsAt: { type: Date, required: true },
      resultAt: { type: Date, required: true },
    },

    // Winners of the previous edition, shown as social proof.
    previousWinners: [
      { _id: false, name: { type: String, required: true }, position: { type: Number, min: 1 }, photoUrl: String, videoUrl: String },
    ],

    about: Localized,
    judgingParameters: Localized,
    rules: Localized,

    rewards: [{ _id: false, position: { type: Number, required: true, min: 1 }, amount: money }],

    disclaimer: Localized,
    refundPolicy: Localized,
    prizeInfoVideoUrl: String,
  },
  { timestamps: true },
);

competitionSchema.index({ status: 1, 'schedule.registrationClosesAt': 1 });

competitionSchema.pre('validate', function () {
  const s = this.schedule;
  const ordered =
    s.registrationOpensAt < s.registrationClosesAt &&
    s.submissionStartsAt < s.submissionEndsAt &&
    s.registrationClosesAt <= s.submissionEndsAt &&
    s.submissionEndsAt <= s.resultAt;
  if (!ordered) this.invalidate('schedule', 'Schedule dates are out of order');
  if (this.bookedCount > this.capacity) this.invalidate('bookedCount', 'bookedCount exceeds capacity');
  const positions = this.rewards.map((r) => r.position);
  if (new Set(positions).size !== positions.length) this.invalidate('rewards', 'Duplicate reward position');
});

module.exports = model('Competition', competitionSchema);

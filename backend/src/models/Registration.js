const { Schema, model } = require('mongoose');

const registrationSchema = new Schema(
  {
    competition: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    payment: {
      provider: { type: String, required: true },
      paymentId: { type: String, required: true },
      amount: { type: Number, required: true },
      status: { type: String, enum: ['captured', 'refunded'], required: true },
    },
    submission: {
      fileName: String,
      mimeType: String,
      size: Number,
      storageKey: String,
      submittedAt: Date,
    },
  },
  { timestamps: true },
);

// One registration per user per competition. This is the real duplicate guard;
// the pre-check in the service is only a fast path.
registrationSchema.index({ competition: 1, user: 1 }, { unique: true });
registrationSchema.index({ user: 1, createdAt: -1 });

module.exports = model('Registration', registrationSchema);

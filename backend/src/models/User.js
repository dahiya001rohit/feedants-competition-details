const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    avatarUrl: String,
    referralCode: { type: String, required: true, unique: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = model('User', userSchema);

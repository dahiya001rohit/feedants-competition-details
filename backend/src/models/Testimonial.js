const { Schema, model } = require('mongoose');
const Localized = require('./Localized');

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    avatarUrl: String,
    role: Localized,
    quote: { type: Localized, required: true },
    rating: { type: Number, min: 1, max: 5 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = model('Testimonial', testimonialSchema);

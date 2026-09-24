const { Schema } = require('mongoose');

// Translatable text. `en` is the fallback when a translation is missing.
module.exports = new Schema(
  { en: { type: String, required: true, trim: true }, hi: { type: String, trim: true } },
  { _id: false },
);

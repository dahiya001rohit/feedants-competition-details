const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const mongoose = require('mongoose');
const { HttpError } = require('./lib/errors');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => {
  const up = mongoose.connection.readyState === 1;
  res.status(up ? 200 : 503).json({ ok: up });
});
app.use('/api/competitions', require('./routes/competitions'));
app.use('/api', require('./routes/users'));

app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let e = err;
  if (err instanceof multer.MulterError) {
    e = err.code === 'LIMIT_FILE_SIZE'
      ? new HttpError(413, 'FILE_TOO_LARGE', 'That video is too large.')
      : new HttpError(400, 'INVALID_UPLOAD', err.message);
  } else if (err.type === 'entity.parse.failed') {
    e = new HttpError(400, 'INVALID_JSON', 'Malformed JSON body.');
  }
  if (!(e instanceof HttpError)) {
    console.error(err);
    e = new HttpError(500, 'INTERNAL', 'Something went wrong. Please try again.');
  }
  res.status(e.status).json({ error: { code: e.code, message: e.message } });
});

module.exports = app;

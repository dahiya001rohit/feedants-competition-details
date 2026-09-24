const path = require('node:path');
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { HttpError } = require('../lib/errors');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const svc = require('../services/competitions');

const router = express.Router();
const langOf = (req) => (req.query.lang === 'hi' ? 'hi' : 'en');

// Per-user write limit (runs after auth). ponytail: in-memory store is per process; use a Redis store for >1 instance
const writeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  keyGenerator: (req) => req.userId,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 8);
      cb(null, `${req.params.id}-${req.userId}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('video/')
      ? cb(null, true)
      : cb(new HttpError(415, 'INVALID_FILE', 'Please upload a video file.')),
});

router.get('/', optionalAuth, async (req, res) => {
  res.json(await svc.listCompetitions(req.userId, langOf(req)));
});

router.get('/:id', optionalAuth, async (req, res) => {
  res.json(await svc.getDetails(req.params.id, req.userId, langOf(req)));
});

router.post('/:id/registrations', requireAuth, writeLimiter, async (req, res) => {
  await svc.register(req.params.id, req.userId);
  res.status(201).json(await svc.getDetails(req.params.id, req.userId, langOf(req)));
});

router.put(
  '/:id/submission',
  requireAuth,
  writeLimiter,
  async (req, res, next) => {
    // Reject an oversized upload from its declared length instead of reading the body first.
    if (Number(req.get('content-length')) > config.maxUploadBytes + 1e6) {
      throw new HttpError(413, 'FILE_TOO_LARGE', 'That video is too large.');
    }
    await svc.assertCanSubmit(req.params.id, req.userId);
    next();
  },
  upload.single('video'),
  async (req, res) => {
    if (!req.file) throw new HttpError(400, 'FILE_REQUIRED', 'Attach a video in the "video" field.');
    await svc.saveSubmission(req.params.id, req.userId, req.file);
    res.json(await svc.getDetails(req.params.id, req.userId, langOf(req)));
  },
);

module.exports = router;

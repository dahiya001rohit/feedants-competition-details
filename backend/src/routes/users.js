const express = require('express');
const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const Testimonial = require('../models/Testimonial');
const { HttpError } = require('../lib/errors');
const { presentUser, t } = require('../lib/present');
const { requireAuth, signToken } = require('../middleware/auth');
const { listMyRegistrations } = require('../services/competitions');

const router = express.Router();
const langOf = (req) => (req.query.lang === 'hi' ? 'hi' : 'en');

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) throw new HttpError(401, 'INVALID_TOKEN', 'Your session has expired. Please sign in again.');
  res.json({ user: presentUser(user) });
});

router.get('/me/registrations', requireAuth, async (req, res) => {
  res.json(await listMyRegistrations(req.userId, langOf(req)));
});

router.get('/testimonials', async (req, res) => {
  const lang = langOf(req);
  const items = await Testimonial.find({ published: true }).sort({ createdAt: -1 }).limit(20).lean();
  res.json({
    testimonials: items.map((x) => ({
      id: String(x._id),
      name: x.name,
      avatarUrl: x.avatarUrl,
      role: t(x.role, lang),
      quote: t(x.quote, lang),
      rating: x.rating,
    })),
  });
});

// Stand-in for real auth (OTP etc.): lets the app act as one of the seeded demo users.
if (config.allowDemoLogin) {
  router.get('/auth/demo-users', async (req, res) => {
    const users = await User.find({ isDemo: true }).sort({ _id: 1 }).lean();
    res.json({ users: users.map(presentUser) });
  });

  router.post('/auth/demo-login', async (req, res) => {
    const userId = req.body?.userId;
    if (!mongoose.isValidObjectId(userId)) throw new HttpError(400, 'INVALID_USER', 'userId is required.');
    const user = await User.findOne({ _id: userId, isDemo: true }).lean();
    if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found.');
    res.json({ token: signToken(user._id), user: presentUser(user) });
  });
}

module.exports = router;

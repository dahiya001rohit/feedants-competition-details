const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'feedants-uploads-'));

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { signToken } = require('../src/middleware/auth');
const User = require('../src/models/User');
const Competition = require('../src/models/Competition');
const Registration = require('../src/models/Registration');

const H = 3600e3;
const at = (ms) => new Date(Date.now() + ms);
let server;
let n = 0;

const makeUsers = (count) =>
  User.create(Array.from({ length: count }, () => ({ name: 'Test', referralCode: `code${n++}` })));

const makeCompetition = (overrides = {}) =>
  Competition.create({
    slug: `test-${n++}`,
    status: 'published',
    title: { en: 'Test Dance', hi: 'टेस्ट नृत्य' },
    category: { en: 'Dance' },
    about: { en: 'About in English' },
    entryFee: 99,
    capacity: 20,
    judge: { name: 'Judge' },
    rewards: [{ position: 1, amount: 100 }, { position: 2, amount: 50 }],
    schedule: {
      registrationOpensAt: at(-H),
      registrationClosesAt: at(H),
      submissionStartsAt: at(-H),
      submissionEndsAt: at(2 * H),
      resultAt: at(3 * H),
    },
    ...overrides,
  });

const as = (user) => ({ Authorization: `Bearer ${signToken(user._id)}` });
const registerAs = (c, user) => request(server).post(`/api/competitions/${c.id}/registrations`).set(as(user));

before(async () => {
  await mongoose.connect(process.env.MONGO_URL_TEST || 'mongodb://127.0.0.1:27017/feedants_test?directConnection=true');
  await mongoose.connection.dropDatabase();
  await Promise.all([User, Competition, Registration].map((m) => m.syncIndexes()));
  server = app.listen(0);
});

after(async () => {
  server.close();
  await mongoose.disconnect();
});

test('never overbooks when many users register for the last spots at once', async () => {
  const c = await makeCompetition({ capacity: 5 });
  const users = await makeUsers(40);

  const results = await Promise.all(users.map((u) => registerAs(c, u)));

  const ok = results.filter((r) => r.status === 201);
  const full = results.filter((r) => r.body.error?.code === 'COMPETITION_FULL');
  assert.equal(ok.length, 5);
  assert.equal(full.length, 35);
  assert.equal((await Competition.findById(c.id)).bookedCount, 5);
  assert.equal(await Registration.countDocuments({ competition: c.id }), 5);
});

test('a double tap registers once and takes one spot', async () => {
  const c = await makeCompetition();
  const [user] = await makeUsers(1);

  const results = await Promise.all(Array.from({ length: 5 }, () => registerAs(c, user)));

  assert.equal(results.filter((r) => r.status === 201).length, 1);
  assert.ok(results.filter((r) => r.status !== 201).every((r) => r.body.error.code === 'ALREADY_REGISTERED'));
  assert.equal((await Competition.findById(c.id)).bookedCount, 1);
});

test('registration is rejected outside the window and without auth', async () => {
  const closed = await makeCompetition({
    schedule: {
      registrationOpensAt: at(-3 * H),
      registrationClosesAt: at(-H),
      submissionStartsAt: at(-H),
      submissionEndsAt: at(H),
      resultAt: at(2 * H),
    },
  });
  const [user] = await makeUsers(1);

  const res = await registerAs(closed, user);
  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'REGISTRATION_CLOSED');
  assert.equal((await request(server).post(`/api/competitions/${closed.id}/registrations`)).status, 401);
});

test('details reflect viewer state, spots and language fallback', async () => {
  const c = await makeCompetition({ capacity: 3 });
  const [user] = await makeUsers(1);

  const before = await request(server).get(`/api/competitions/${c.id}?lang=hi`).set(as(user));
  assert.equal(before.body.viewer.registered, false);
  assert.equal(before.body.competition.title, 'टेस्ट नृत्य');
  assert.equal(before.body.competition.about, 'About in English');
  assert.equal(before.body.competition.prizePool, 150);
  assert.equal(before.body.competition.phase, 'registration_open');

  const reg = await registerAs(c, user);
  assert.equal(reg.body.viewer.registered, true);
  assert.equal(reg.body.competition.spotsLeft, 2);

  const anon = await request(server).get(`/api/competitions/${c.id}`);
  assert.equal(anon.body.viewer, null);
  assert.equal((await request(server).get('/api/competitions/nope')).status, 404);
});

test('only registered users can upload, and only videos', async () => {
  const c = await makeCompetition();
  const [member, stranger] = await makeUsers(2);
  await registerAs(c, member);
  const upload = (user, contentType = 'video/mp4') =>
    request(server)
      .put(`/api/competitions/${c.id}/submission`)
      .set(as(user))
      .attach('video', Buffer.from('fake video'), { filename: 'dance.mp4', contentType });

  const filesBefore = fs.readdirSync(process.env.UPLOAD_DIR).length;
  assert.equal((await upload(stranger)).body.error.code, 'NOT_REGISTERED');
  assert.equal(fs.readdirSync(process.env.UPLOAD_DIR).length, filesBefore);

  assert.equal((await upload(member, 'image/png')).status, 415);

  const ok = await upload(member);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.viewer.submission.fileName, 'dance.mp4');

  await upload(member); // replacing deletes the previous file
  assert.equal(fs.readdirSync(process.env.UPLOAD_DIR).length, filesBefore + 1);
});

test('my registrations lists only my entries, with submission status', async () => {
  const [mine, theirs] = await Promise.all([makeCompetition(), makeCompetition()]);
  const [me, other] = await makeUsers(2);
  await registerAs(mine, me);
  await registerAs(theirs, other);

  const res = await request(server).get('/api/me/registrations').set(as(me));
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.registrations.map((r) => r.competition.id), [mine.id]);
  assert.equal(res.body.registrations[0].viewer.submission, null);
  assert.equal((await request(server).get('/api/me/registrations')).status, 401);
});

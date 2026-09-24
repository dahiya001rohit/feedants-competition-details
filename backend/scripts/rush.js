// Demo helper: fires N simultaneous registrations for one competition through the real API,
// so you can watch spots drop (and never go below zero) in the open app.
// Usage: npm run rush -- [slug=feedants-classical-dance] [users=30]
const mongoose = require('mongoose');
const config = require('../src/config');
const User = require('../src/models/User');
const Competition = require('../src/models/Competition');
const { signToken } = require('../src/middleware/auth');

async function main() {
  const [slug = 'feedants-classical-dance', count = '30'] = process.argv.slice(2);
  const apiUrl = process.env.API_URL || `http://localhost:${config.port}`;

  await mongoose.connect(config.mongoUrl);
  const c = await Competition.findOne({ slug }).lean();
  if (!c) throw new Error(`No competition with slug "${slug}"`);
  const stamp = Date.now().toString(36);
  const users = await User.create(
    Array.from({ length: Number(count) }, (_, i) => ({ name: `Rush ${i + 1}`, referralCode: `rush-${stamp}-${i}` })),
  );
  await mongoose.disconnect();

  console.log(`${c.slug}: ${c.bookedCount}/${c.capacity} booked. Firing ${users.length} registrations at once…`);
  const outcomes = await Promise.all(
    users.map(async (u) => {
      const res = await fetch(`${apiUrl}/api/competitions/${c._id}/registrations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${signToken(u._id)}` },
      });
      return res.ok ? 'REGISTERED' : (await res.json()).error.code;
    }),
  );
  const tally = {};
  for (const o of outcomes) tally[o] = (tally[o] ?? 0) + 1;
  console.log(tally);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

const mongoose = require('mongoose');
const config = require('./config');
const app = require('./app');

async function main() {
  await mongoose.connect(config.mongoUrl);
  const server = app.listen(config.port, () => console.log(`API listening on :${config.port}`));

  const shutdown = () => {
    server.close(() => mongoose.disconnect().then(() => process.exit(0)));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

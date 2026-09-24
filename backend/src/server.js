const http = require('node:http');
const mongoose = require('mongoose');
const config = require('./config');
const app = require('./app');

async function main() {
  await mongoose.connect(config.mongoUrl);

  // Access log (kept out of app.js so tests stay quiet). Logs aborted requests too, e.g. a dropped upload.
  const server = http.createServer((req, res) => {
    const start = Date.now();
    res.on('close', () => {
      const status = res.writableFinished ? res.statusCode : 'aborted';
      const size = req.headers['content-length'] ? ` ${(req.headers['content-length'] / 1e6).toFixed(1)}MB` : '';
      console.log(`${req.method} ${req.originalUrl ?? req.url} ${status} ${Date.now() - start}ms${size}`);
    });
    app(req, res);
  });
  // Node cuts requests off after 5 minutes by default; a max-size video on a slow mobile uplink needs longer.
  server.requestTimeout = 15 * 60e3;
  server.listen(config.port, () => console.log(`API listening on :${config.port}`));

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

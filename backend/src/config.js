const env = process.env;
const isProd = env.NODE_ENV === 'production';

if (isProd && !env.JWT_SECRET) throw new Error('JWT_SECRET is required in production');

module.exports = {
  isProd,
  port: Number(env.PORT) || 4000,
  mongoUrl: env.MONGO_URL || 'mongodb://127.0.0.1:27017/feedants?directConnection=true',
  jwtSecret: env.JWT_SECRET || 'dev-only-secret',
  allowDemoLogin: env.ALLOW_DEMO_LOGIN ? env.ALLOW_DEMO_LOGIN === 'true' : !isProd,
  uploadDir: env.UPLOAD_DIR || './uploads',
  maxUploadBytes: (Number(env.MAX_UPLOAD_MB) || 200) * 1024 * 1024,
  publicWebUrl: env.PUBLIC_WEB_URL || 'https://feedants.com',
  referralRewardPerSignup: 10,
};

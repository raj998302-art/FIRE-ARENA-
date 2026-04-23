import dotenv from 'dotenv';
dotenv.config();

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',

  DATABASE_URL: req('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/firearena?schema=public'),

  JWT_SECRET: req('JWT_SECRET', 'dev-only-change-me'),
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES ?? '30d',

  OWNER_USERNAME: process.env.OWNER_USERNAME ?? 'Zenus_Carlos',
  OWNER_EMAIL: process.env.OWNER_EMAIL ?? 'owner@firearena.local',
  OWNER_PASSWORD: process.env.OWNER_PASSWORD ?? 'ChangeMe!Owner#2025',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? 'raj998302@gmail.com',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME ?? 'raj998302',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? 'ChangeMe!Admin#2025',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',

  MANUAL_UPI_ID: process.env.MANUAL_UPI_ID ?? 'firearena@upi',
  MANUAL_UPI_QR_URL: process.env.MANUAL_UPI_QR_URL ?? '',

  REFERRAL_MIN_DEPOSIT_INR: parseInt(process.env.REFERRAL_MIN_DEPOSIT_INR ?? '100', 10),
  REFERRAL_REWARD_COINS: parseInt(process.env.REFERRAL_REWARD_COINS ?? '10', 10),

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? '120', 10),

  // OneSignal
  ONESIGNAL_APP_ID: process.env.ONESIGNAL_APP_ID ?? '',
  ONESIGNAL_REST_API_KEY: process.env.ONESIGNAL_REST_API_KEY ?? '',

  // OAuth
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
  DISCORD_OAUTH_CLIENT_ID: process.env.DISCORD_OAUTH_CLIENT_ID ?? '',
  DISCORD_OAUTH_CLIENT_SECRET: process.env.DISCORD_OAUTH_CLIENT_SECRET ?? '',
  DISCORD_OAUTH_REDIRECT_URI: process.env.DISCORD_OAUTH_REDIRECT_URI ?? 'firearenamax://oauth/discord',

  // Rewards
  DAILY_SPIN_COOLDOWN_HOURS: parseInt(process.env.DAILY_SPIN_COOLDOWN_HOURS ?? '24', 10),
  STREAK_BONUS_EVERY_DAYS: parseInt(process.env.STREAK_BONUS_EVERY_DAYS ?? '7', 10),
  STREAK_BONUS_COINS: parseInt(process.env.STREAK_BONUS_COINS ?? '20', 10),
};

export const isProd = env.NODE_ENV === 'production';

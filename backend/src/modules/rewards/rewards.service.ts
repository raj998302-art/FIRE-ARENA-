import { prisma } from '../../lib/prisma';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { postTransaction } from '../wallet/wallet.service';
import { push as pushNotification } from '../notifications/notifications.service';
import { env } from '../../config/env';
import { NotificationType, TxType } from '@prisma/client';

/** Weighted reward table for the daily spin (in coins). */
const SPIN_WHEEL: Array<{ coins: number; weight: number }> = [
  { coins: 1,  weight: 35 },
  { coins: 2,  weight: 25 },
  { coins: 5,  weight: 18 },
  { coins: 10, weight: 12 },
  { coins: 25, weight: 6 },
  { coins: 50, weight: 3 },
  { coins: 100, weight: 1 },
];

function pickSpinReward(): number {
  const total = SPIN_WHEEL.reduce((s, r) => s + r.weight, 0);
  let roll = Math.floor(Math.random() * total);
  for (const r of SPIN_WHEEL) {
    if (roll < r.weight) return r.coins;
    roll -= r.weight;
  }
  return SPIN_WHEEL[0].coins;
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear()
      && a.getUTCMonth() === b.getUTCMonth()
      && a.getUTCDate() === b.getUTCDate();
}

function isConsecutiveUtcDay(prev: Date, today: Date): boolean {
  const prevMid = Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate());
  const todayMid = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return todayMid - prevMid === 86_400_000;
}

export async function spinStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastSpinAt: true, streakCount: true, lastStreakDate: true },
  });
  if (!user) throw notFound('User not found');
  const cooldownMs = env.DAILY_SPIN_COOLDOWN_HOURS * 3600_000;
  const nextAvailableAt = user.lastSpinAt ? new Date(user.lastSpinAt.getTime() + cooldownMs) : new Date(0);
  const now = new Date();
  return {
    canSpin: now >= nextAvailableAt,
    nextAvailableAt,
    lastSpinAt: user.lastSpinAt,
    streak: user.streakCount,
    wheel: SPIN_WHEEL.map(r => r.coins),
  };
}

export async function doSpin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, lastSpinAt: true, streakCount: true, lastStreakDate: true },
  });
  if (!user) throw notFound('User not found');
  const cooldownMs = env.DAILY_SPIN_COOLDOWN_HOURS * 3600_000;
  const now = new Date();
  if (user.lastSpinAt && now.getTime() - user.lastSpinAt.getTime() < cooldownMs) {
    const nextAvailableAt = new Date(user.lastSpinAt.getTime() + cooldownMs);
    throw conflict(`Spin on cooldown. Next at ${nextAvailableAt.toISOString()}`);
  }

  const baseReward = pickSpinReward();

  // Streak update
  let newStreak: number;
  if (user.lastStreakDate && isSameUtcDay(user.lastStreakDate, now)) {
    newStreak = user.streakCount; // already counted today (shouldn't happen given cooldown, but safe)
  } else if (user.lastStreakDate && isConsecutiveUtcDay(user.lastStreakDate, now)) {
    newStreak = user.streakCount + 1;
  } else {
    newStreak = 1;
  }

  const streakBonus = (newStreak > 0 && newStreak % env.STREAK_BONUS_EVERY_DAYS === 0)
    ? env.STREAK_BONUS_COINS : 0;

  const result = await prisma.$transaction(async (tx) => {
    await postTransaction({
      userId, type: TxType.SPIN_REWARD, amountCoins: baseReward,
      referenceKind: 'spin', note: `Daily spin +${baseReward}`, tx,
    });
    if (streakBonus > 0) {
      await postTransaction({
        userId, type: TxType.STREAK_BONUS, amountCoins: streakBonus,
        referenceKind: 'streak', note: `${newStreak}-day streak bonus`, tx,
      });
    }
    await tx.dailySpinLog.create({
      data: { userId, rewardCoins: baseReward + streakBonus, streak: newStreak },
    });
    await tx.user.update({
      where: { id: userId },
      data: { lastSpinAt: now, streakCount: newStreak, lastStreakDate: now },
    });
    return { baseReward, streakBonus, streak: newStreak };
  });

  pushNotification({
    userId, type: NotificationType.REWARD,
    title: streakBonus > 0 ? `🎁 +${baseReward + streakBonus} 🪙 (streak ${newStreak}!)` : `🎁 +${baseReward} 🪙 from your daily spin`,
    body: streakBonus > 0
      ? `You hit a ${newStreak}-day streak and earned a ${streakBonus} bonus!`
      : `Come back tomorrow to keep your streak going.`,
  }).catch(() => {});

  return result;
}

/** Redeem a promo code. Uses a transaction and fails closed on any race. */
export async function redeemPromo(userId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (code.length < 3 || code.length > 40) throw badRequest('Invalid code');

  return prisma.$transaction(async (tx) => {
    const promo = await tx.promoCode.findUnique({ where: { code } });
    if (!promo || !promo.isActive) throw notFound('Code not found');
    if (promo.expiresAt && promo.expiresAt < new Date()) throw badRequest('Code expired');
    if (promo.usedCount >= promo.maxUses) throw conflict('Code fully used');

    const used = await tx.promoRedemption.count({ where: { promoId: promo.id, userId } });
    if (used >= promo.perUserLimit) throw conflict('You already used this code');

    await tx.promoRedemption.create({
      data: { promoId: promo.id, userId, amountCoins: promo.rewardCoins },
    });
    await tx.promoCode.update({
      where: { id: promo.id },
      data: { usedCount: { increment: 1 } },
    });
    await postTransaction({
      userId, type: TxType.PROMO_REWARD, amountCoins: promo.rewardCoins,
      referenceId: promo.id, referenceKind: 'promo',
      note: `Promo ${promo.code}`, tx,
    });

    return { code: promo.code, rewardCoins: promo.rewardCoins };
  });
}

// ---- admin helpers ----

export async function createPromo(adminId: string, input: {
  code: string; rewardCoins: number; maxUses?: number; perUserLimit?: number; expiresAt?: string | null;
}) {
  const code = input.code.trim().toUpperCase();
  if (code.length < 3 || code.length > 40) throw badRequest('Invalid code');
  if (input.rewardCoins <= 0 || input.rewardCoins > 100000) throw badRequest('Invalid reward amount');

  return prisma.promoCode.create({
    data: {
      code,
      rewardCoins: input.rewardCoins,
      maxUses: Math.max(1, input.maxUses ?? 1),
      perUserLimit: Math.max(1, input.perUserLimit ?? 1),
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      createdById: adminId,
    },
  });
}

export async function listPromos() {
  return prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
}

export async function deactivatePromo(code: string) {
  const c = code.trim().toUpperCase();
  return prisma.promoCode.update({ where: { code: c }, data: { isActive: false } });
}

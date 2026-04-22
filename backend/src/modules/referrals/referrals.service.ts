import { prisma } from '../../lib/prisma';
import { postTransaction } from '../wallet/wallet.service';
import { env } from '../../config/env';
import { TxType } from '@prisma/client';

/**
 * Called after a successful deposit (Razorpay verify or manual UPI approved).
 * Grants the referrer REFERRAL_REWARD_COINS if:
 *  - user was referred by someone
 *  - user's lifetime deposits just crossed REFERRAL_MIN_DEPOSIT_INR
 *  - referral reward has not already been granted
 */
export async function grantReferralRewardIfEligible(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });
  if (!user || !user.referredById || !user.wallet) return { granted: false, reason: 'no referrer' };
  if (user.wallet.totalDeposited < env.REFERRAL_MIN_DEPOSIT_INR) return { granted: false, reason: 'below threshold' };

  const existing = await prisma.referralReward.findUnique({ where: { refereeId: userId } });
  if (existing) return { granted: false, reason: 'already granted' };

  await prisma.$transaction(async (tx) => {
    await tx.referralReward.create({
      data: {
        referrerId: user.referredById!,
        refereeId: user.id,
        rewardCoins: env.REFERRAL_REWARD_COINS,
      },
    });
    await postTransaction({
      userId: user.referredById!,
      type: TxType.REFERRAL_BONUS,
      amountCoins: env.REFERRAL_REWARD_COINS,
      referenceId: user.id,
      referenceKind: 'referral',
      note: `Referral reward for ${user.username}`,
      tx,
    });
  });

  return { granted: true, referrerId: user.referredById, rewardCoins: env.REFERRAL_REWARD_COINS };
}

export async function myReferralSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  const [total, rewards] = await Promise.all([
    prisma.user.count({ where: { referredById: userId } }),
    prisma.referralReward.findMany({
      where: { referrerId: userId },
      orderBy: { grantedAt: 'desc' },
      take: 100,
      include: { referee: { select: { username: true } } },
    }),
  ]);
  const totalEarned = rewards.reduce((s, r) => s + r.rewardCoins, 0);
  return { code: user?.referralCode, totalReferred: total, totalEarned, rewards };
}

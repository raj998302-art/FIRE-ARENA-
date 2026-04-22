import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';
import { postTransaction } from '../wallet/wallet.service';
import { push as pushNotification } from '../notifications/notifications.service';
import { NotificationType, RoleName, TxType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export async function listPlans() {
  return prisma.vipPlan.findMany({ where: { isActive: true }, orderBy: { priceCoins: 'asc' } });
}

/**
 * Activates (or extends) a VIP subscription for a user inside a transaction.
 * Callers decide how the payment was made (wallet coins, razorpay, admin grant)
 * and are responsible for any corresponding debit — this helper only grants the benefit.
 */
export async function activateVipForUser(
  tx: Prisma.TransactionClient,
  userId: string,
  planId: string,
) {
  const plan = await tx.vipPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) throw notFound('Plan not available');

  const existing = await tx.vipSubscription.findFirst({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' },
  });
  const base = existing ? existing.expiresAt : new Date();
  const expiresAt = new Date(base.getTime() + plan.durationDays * 86_400_000);

  const sub = await tx.vipSubscription.create({
    data: { userId, planId: plan.id, expiresAt },
  });

  const vipRole = await tx.role.upsert({
    where: { name: RoleName.VIP }, update: {}, create: { name: RoleName.VIP },
  });
  await tx.userRole.upsert({
    where: { userId_roleId: { userId, roleId: vipRole.id } },
    update: { expiresAt },
    create: { userId, roleId: vipRole.id, expiresAt },
  });

  return { sub, plan, expiresAt };
}

export async function purchase(userId: string, planCode: string) {
  const plan = await prisma.vipPlan.findUnique({ where: { code: planCode } });
  if (!plan || !plan.isActive) throw notFound('Plan not available');

  const result = await prisma.$transaction(async (tx) => {
    await postTransaction({
      userId, type: TxType.VIP_PURCHASE, amountCoins: plan.priceCoins,
      referenceId: plan.id, referenceKind: 'vip', note: `VIP ${plan.code}`, tx,
    });
    return activateVipForUser(tx, userId, plan.id);
  });

  await pushNotification({
    userId,
    type: NotificationType.VIP,
    title: '👑 VIP Activated',
    body: `${result.plan.title} is live until ${result.expiresAt.toISOString().slice(0, 10)}. Enjoy!`,
  }).catch(() => {});

  return result.sub;
}

export async function myStatus(userId: string) {
  const sub = await prisma.vipSubscription.findFirst({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' },
    include: { plan: true },
  });
  return { active: !!sub, subscription: sub };
}

/** Cron: remove expired VIP roles. */
export async function cleanupExpiredVipRoles() {
  const now = new Date();
  const vipRole = await prisma.role.findUnique({ where: { name: RoleName.VIP } });
  if (!vipRole) return;
  const removed = await prisma.userRole.deleteMany({
    where: { roleId: vipRole.id, expiresAt: { lt: now } },
  });
  return { removed: removed.count };
}

import { prisma } from '../../lib/prisma';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { postTransaction } from '../wallet/wallet.service';
import { TxType, WithdrawStatus } from '@prisma/client';

export async function requestWithdrawal(userId: string, input: {
  amountCoins: number; upiId: string; accountName?: string;
}) {
  if (input.amountCoins < 100) throw badRequest('Minimum withdrawal is 100 coins');

  return prisma.$transaction(async (tx) => {
    await postTransaction({
      userId,
      type: TxType.LOCK,
      amountCoins: input.amountCoins,
      note: 'Withdrawal request lock',
      tx,
    });
    return tx.withdrawal.create({
      data: {
        userId,
        amountCoins: input.amountCoins,
        upiId: input.upiId,
        accountName: input.accountName,
        status: WithdrawStatus.PENDING,
      },
    });
  });
}

export async function listMyWithdrawals(userId: string) {
  return prisma.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 });
}

export async function listPendingWithdrawals() {
  return prisma.withdrawal.findMany({
    where: { status: WithdrawStatus.PENDING },
    include: { user: { select: { id: true, username: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function approveWithdrawal(id: string, adminId: string, payoutRef?: string) {
  const w = await prisma.withdrawal.findUnique({ where: { id } });
  if (!w) throw notFound('Withdrawal not found');
  if (w.status !== WithdrawStatus.PENDING) throw badRequest('Not pending');

  // Compare-and-set on status inside the transaction so two concurrent admin
  // approvals can't both UNLOCK+WITHDRAW and double-spend the same request.
  await prisma.$transaction(async (tx) => {
    const updated = await tx.withdrawal.updateMany({
      where: { id, status: WithdrawStatus.PENDING },
      data: { status: WithdrawStatus.APPROVED, processedById: adminId, payoutRef },
    });
    if (updated.count !== 1) throw conflict('Withdrawal already processed');
    // Move locked → withdrawn (treat as UNLOCK then WITHDRAW so ledger stays clean)
    await postTransaction({
      userId: w.userId, type: TxType.UNLOCK, amountCoins: w.amountCoins,
      referenceId: w.id, referenceKind: 'withdrawal', note: 'Withdrawal approved – unlock', tx,
    });
    await postTransaction({
      userId: w.userId, type: TxType.WITHDRAW, amountCoins: w.amountCoins,
      referenceId: w.id, referenceKind: 'withdrawal', note: `Withdrawal approved payoutRef=${payoutRef ?? ''}`, tx,
    });
  });
  return { ok: true };
}

export async function rejectWithdrawal(id: string, adminId: string, reason: string) {
  const w = await prisma.withdrawal.findUnique({ where: { id } });
  if (!w) throw notFound('Withdrawal not found');
  if (w.status !== WithdrawStatus.PENDING) throw badRequest('Not pending');

  await prisma.$transaction(async (tx) => {
    const updated = await tx.withdrawal.updateMany({
      where: { id, status: WithdrawStatus.PENDING },
      data: { status: WithdrawStatus.REJECTED, processedById: adminId, rejectReason: reason },
    });
    if (updated.count !== 1) throw conflict('Withdrawal already processed');
    await postTransaction({
      userId: w.userId, type: TxType.UNLOCK, amountCoins: w.amountCoins,
      referenceId: w.id, referenceKind: 'withdrawal', note: 'Withdrawal rejected – unlock', tx,
    });
  });
  return { ok: true };
}

export async function markPaid(id: string, adminId: string, payoutRef: string) {
  const w = await prisma.withdrawal.findUnique({ where: { id } });
  if (!w) throw notFound('Withdrawal not found');
  if (w.status !== WithdrawStatus.APPROVED) throw badRequest('Withdrawal must be APPROVED first');
  const updated = await prisma.withdrawal.updateMany({
    where: { id, status: WithdrawStatus.APPROVED },
    data: { status: WithdrawStatus.PAID, processedById: adminId, payoutRef },
  });
  if (updated.count !== 1) throw conflict('Withdrawal already processed');
  return prisma.withdrawal.findUnique({ where: { id } });
}

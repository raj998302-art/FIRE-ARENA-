import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';
import { Prisma, TxStatus, TxType } from '@prisma/client';

export async function getWallet(userId: string) {
  const w = await prisma.wallet.findUnique({ where: { userId } });
  if (!w) throw notFound('Wallet not found');
  return w;
}

export async function listTransactions(userId: string, limit = 50, cursor?: string) {
  return prisma.walletTransaction.findMany({
    where: { userId },
    take: Math.min(limit, 100),
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Atomically post a transaction against a user's wallet.
 * Updates balanceCoins / lockedCoins based on TxType and records a WalletTransaction row.
 * Throws `badRequest` for insufficient balance.
 */
export async function postTransaction(opts: {
  userId: string;
  type: TxType;
  amountCoins: number;       // positive integer — sign is derived from type
  status?: TxStatus;
  referenceId?: string;
  referenceKind?: string;
  note?: string;
  tx?: Prisma.TransactionClient;
}) {
  const run = async (tx: Prisma.TransactionClient) => {
    if (opts.amountCoins <= 0) throw badRequest('Amount must be > 0');
    const wallet = await tx.wallet.findUnique({ where: { userId: opts.userId } });
    if (!wallet) throw notFound('Wallet not found');

    let newBal = wallet.balanceCoins;
    let newLocked = wallet.lockedCoins;
    let totalDep = wallet.totalDeposited;
    let totalWd = wallet.totalWithdrawn;

    switch (opts.type) {
      case TxType.DEPOSIT:
      case TxType.REFERRAL_BONUS:
      case TxType.TOURNAMENT_PRIZE:
      case TxType.ADMIN_ADJUST:
      case TxType.REFUND:
        newBal += opts.amountCoins;
        if (opts.type === TxType.DEPOSIT) totalDep += opts.amountCoins;
        break;
      case TxType.WITHDRAW:
      case TxType.TOURNAMENT_ENTRY:
      case TxType.VIP_PURCHASE:
        if (wallet.balanceCoins < opts.amountCoins) throw badRequest('Insufficient balance');
        newBal -= opts.amountCoins;
        if (opts.type === TxType.WITHDRAW) totalWd += opts.amountCoins;
        break;
      case TxType.LOCK:
        if (wallet.balanceCoins < opts.amountCoins) throw badRequest('Insufficient balance to lock');
        newBal -= opts.amountCoins;
        newLocked += opts.amountCoins;
        break;
      case TxType.UNLOCK:
        if (wallet.lockedCoins < opts.amountCoins) throw badRequest('Insufficient locked balance');
        newLocked -= opts.amountCoins;
        newBal += opts.amountCoins;
        break;
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balanceCoins: newBal,
        lockedCoins: newLocked,
        totalDeposited: totalDep,
        totalWithdrawn: totalWd,
      },
    });

    return tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: opts.userId,
        type: opts.type,
        status: opts.status ?? TxStatus.SUCCESS,
        amountCoins: opts.amountCoins,
        balanceAfter: newBal,
        referenceId: opts.referenceId,
        referenceKind: opts.referenceKind,
        note: opts.note,
      },
    });
  };

  return opts.tx ? run(opts.tx) : prisma.$transaction(run);
}

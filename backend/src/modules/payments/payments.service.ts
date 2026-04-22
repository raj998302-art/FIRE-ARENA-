import { prisma } from '../../lib/prisma';
import { razorpay, verifyRazorpaySignature } from '../../lib/razorpay';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { postTransaction } from '../wallet/wallet.service';
import { grantReferralRewardIfEligible } from '../referrals/referrals.service';
import { env } from '../../config/env';
import { PaymentProvider, PaymentStatus, TxType } from '@prisma/client';

/**
 * Razorpay: create an order. The app will then open Razorpay Checkout and
 * call /payments/razorpay/verify with order_id + payment_id + signature.
 */
export async function createRazorpayOrder(userId: string, amountCoins: number) {
  if (amountCoins < 10) throw badRequest('Minimum deposit is 10 coins');
  if (amountCoins > 100000) throw badRequest('Maximum single deposit is 100000 coins');

  const order = await razorpay().orders.create({
    amount: amountCoins * 100, // in paise, 1 coin = ₹1
    currency: 'INR',
    receipt: `dep_${userId.slice(0, 8)}_${Date.now()}`,
    notes: { userId, purpose: 'wallet_deposit' },
  });

  const payment = await prisma.payment.create({
    data: {
      userId,
      provider: PaymentProvider.RAZORPAY,
      amountCoins,
      status: PaymentStatus.CREATED,
      rzpOrderId: order.id,
    },
  });

  return {
    paymentId: payment.id,
    orderId: order.id,
    amountCoins,
    keyId: env.RAZORPAY_KEY_ID,
    currency: 'INR',
  };
}

export async function verifyRazorpayPayment(userId: string, input: {
  orderId: string; paymentId: string; signature: string;
}) {
  const payment = await prisma.payment.findUnique({ where: { rzpOrderId: input.orderId } });
  if (!payment || payment.userId !== userId) throw notFound('Payment not found');
  if (payment.status === PaymentStatus.APPROVED) return { ok: true, alreadyApproved: true };

  const valid = verifyRazorpaySignature(input.orderId, input.paymentId, input.signature);
  if (!valid) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED, rejectedReason: 'signature mismatch' },
    });
    throw badRequest('Signature verification failed');
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.APPROVED,
        rzpPaymentId: input.paymentId,
        rzpSignature: input.signature,
        approvedAt: new Date(),
      },
    });
    await postTransaction({
      userId, type: TxType.DEPOSIT, amountCoins: payment.amountCoins,
      referenceId: payment.id, referenceKind: 'payment',
      note: 'Razorpay deposit', tx,
    });
  });

  await grantReferralRewardIfEligible(userId).catch(() => {});
  return { ok: true };
}

/**
 * Manual UPI: user submits UTR after paying externally.
 * Backend validates format + duplicate; admin approves later.
 */
const UTR_REGEX = /^[A-Za-z0-9]{8,22}$/;
export async function submitManualUpiUtr(userId: string, input: {
  amountCoins: number; utr: string; upiId?: string; screenshotUrl?: string;
}) {
  if (input.amountCoins <= 0) throw badRequest('Invalid amount');
  const utr = input.utr.trim().toUpperCase();
  if (!UTR_REGEX.test(utr)) throw badRequest('Invalid UTR format');

  const duplicate = await prisma.payment.findFirst({
    where: { provider: PaymentProvider.MANUAL_UPI, utr },
  });
  if (duplicate) throw conflict('This UTR has already been submitted');

  return prisma.payment.create({
    data: {
      userId,
      provider: PaymentProvider.MANUAL_UPI,
      amountCoins: input.amountCoins,
      status: PaymentStatus.PENDING_APPROVAL,
      utr,
      upiId: input.upiId,
      screenshotUrl: input.screenshotUrl,
    },
  });
}

export async function listMyPayments(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

/** Admin: list pending manual UPI payments awaiting approval. */
export async function listPendingManualPayments() {
  return prisma.payment.findMany({
    where: { provider: PaymentProvider.MANUAL_UPI, status: PaymentStatus.PENDING_APPROVAL },
    include: { user: { select: { id: true, username: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function approveManualPayment(paymentId: string, approverId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw notFound('Payment not found');
  if (payment.status !== PaymentStatus.PENDING_APPROVAL) throw badRequest('Payment is not pending');

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.APPROVED, approvedById: approverId, approvedAt: new Date() },
    });
    await postTransaction({
      userId: payment.userId, type: TxType.DEPOSIT, amountCoins: payment.amountCoins,
      referenceId: payment.id, referenceKind: 'payment',
      note: `Manual UPI approved (UTR ${payment.utr})`, tx,
    });
  });

  await grantReferralRewardIfEligible(payment.userId).catch(() => {});
  return { ok: true };
}

export async function rejectManualPayment(paymentId: string, approverId: string, reason: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw notFound('Payment not found');
  if (payment.status !== PaymentStatus.PENDING_APPROVAL) throw badRequest('Payment is not pending');
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.REJECTED, approvedById: approverId, rejectedReason: reason, approvedAt: new Date() },
  });
  return { ok: true };
}

export function manualUpiInfo() {
  return { upiId: env.MANUAL_UPI_ID, qrUrl: env.MANUAL_UPI_QR_URL };
}

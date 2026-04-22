import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';

let _client: Razorpay | null = null;

export function razorpay(): Razorpay {
  if (!_client) {
    _client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: env.RAZORPAY_KEY_SECRET || 'placeholder',
    });
  }
  return _client;
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

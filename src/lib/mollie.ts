import { createMollieClient } from '@mollie/api-client';

export function getMollieClient() {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error('MOLLIE_API_KEY is not set');
  }
  return createMollieClient({ apiKey });
}

export type MolliePaymentStatus =
  | 'open'
  | 'canceled'
  | 'pending'
  | 'authorized'
  | 'expired'
  | 'failed'
  | 'paid';

export function mapMollieStatus(status: string): string {
  const map: Record<string, string> = {
    open: 'open',
    pending: 'pending',
    authorized: 'pending',
    paid: 'paid',
    failed: 'failed',
    canceled: 'canceled',
    expired: 'expired',
  };
  return map[status] || status;
}

export function proratedUpgradeCents(start: string, end: string, now = new Date()): number {
  const day = 86400000;
  const from = Date.parse(`${start}T00:00:00Z`);
  const until = Date.parse(`${end}T00:00:00Z`) + day;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (!Number.isFinite(from) || !Number.isFinite(until) || until <= from || today < from || today >= until) throw new Error('Inactive subscription');
  return Math.round(40000 * (until - today) / (until - from));
}

export function verifiedUpgradePayment(session: { payment_status: string; status: string | null; amount_total: number | null; currency: string | null; metadata: Record<string, string> | null }, order: { id: string; user_id: string; amount_cents: number }): boolean {
  return session.payment_status === 'paid' && session.status === 'complete' && session.amount_total === order.amount_cents && session.currency === 'eur' && session.metadata?.upgrade_order_id === order.id && session.metadata?.app_user_id === order.user_id;
}
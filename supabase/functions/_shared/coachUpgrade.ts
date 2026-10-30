export function proratedUpgradeCents(start: string, end: string, now = new Date()): number {
  const day = 86400000;
  const from = Date.parse(`${start}T00:00:00Z`);
  const until = Date.parse(`${end}T00:00:00Z`) + day;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (!Number.isFinite(from) || !Number.isFinite(until) || until <= from || today < from || today >= until) throw new Error('Inactive subscription');
  return upgradeQuote(start, end, now).amountCents;
}

export function upgradeQuote(start: string, end: string, now = new Date()) {
  const day = 86400000;
  const from = Date.parse(`${start}T00:00:00Z`);
  const untilDate = new Date(Date.parse(`${end}T00:00:00Z`) + day);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (!Number.isFinite(from) || !Number.isFinite(untilDate.getTime()) || untilDate.getTime() <= from || today.getTime() < from || today >= untilDate) throw new Error('Inactive subscription');
  let months = (untilDate.getUTCFullYear() - today.getUTCFullYear()) * 12 + untilDate.getUTCMonth() - today.getUTCMonth();
  if (untilDate.getUTCDate() > today.getUTCDate()) months += 1;
  months = Math.min(12, Math.max(1, months));
  return { remainingDays: Math.round((untilDate.getTime() - today.getTime()) / day), months, amountCents: Math.round(40000 * months / 12), coachYearlyCents: 75000 };
}

export function verifiedUpgradePayment(session: { payment_status: string; status: string | null; amount_total: number | null; currency: string | null; metadata: Record<string, string> | null }, order: { id: string; user_id: string; amount_cents: number }): boolean {
  return session.payment_status === 'paid' && session.status === 'complete' && session.amount_total === order.amount_cents && session.currency === 'eur' && session.metadata?.upgrade_order_id === order.id && session.metadata?.app_user_id === order.user_id;
}

export function canAccessUpgrade(actorId: string, targetId: string, verifiedAdmin: boolean): boolean {
  return actorId === targetId || verifiedAdmin;
}
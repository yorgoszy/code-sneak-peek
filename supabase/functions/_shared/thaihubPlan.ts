export const planPriceCents = { club: 45000, coach: 75000, federation: 150000 } as const;

export function verifiedPlanPayment(
  session: { payment_status: string; status: string | null; amount_total: number | null; currency: string | null; metadata: Record<string, string> | null },
  order: { id: string; user_id: string; plan: string; amount_cents: number },
): boolean {
  return session.payment_status === 'paid' && session.status === 'complete' && session.amount_total === order.amount_cents
    && session.currency === 'eur' && session.metadata?.plan_order_id === order.id && session.metadata?.app_user_id === order.user_id
    && session.metadata?.plan === order.plan;
}

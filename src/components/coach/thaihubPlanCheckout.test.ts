import { describe, it, expect } from 'vitest';
import { planPriceCents, verifiedPlanPayment } from '../../../supabase/functions/_shared/thaihubPlan';

describe('ThaiHub plan checkout', () => {
  it('charges Club 450€, Coach 750€, Federation 1500€', () => {
    expect(planPriceCents).toEqual({ club: 45000, coach: 75000, federation: 150000 });
  });
  it('activates only a paid session for the same plan and amount', () => {
    const order = { id: 'o1', user_id: 'u1', plan: 'coach', amount_cents: 75000 };
    const session = { payment_status: 'paid', status: 'complete', amount_total: 75000, currency: 'eur', metadata: { plan_order_id: 'o1', app_user_id: 'u1', plan: 'coach' } };
    expect(verifiedPlanPayment(session, order)).toBe(true);
    expect(verifiedPlanPayment({ ...session, metadata: { ...session.metadata, plan: 'federation' } }, order)).toBe(false);
    expect(verifiedPlanPayment({ ...session, payment_status: 'unpaid' }, order)).toBe(false);
  });
});

import { describe, it as test } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { planPriceCents, verifiedPlanPayment } from '../../../supabase/functions/_shared/thaihubPlan';

describe('ThaiHub plan checkout', () => {
  test('charges Club 450€, Coach 750€, Federation 1500€', () => {
    deepStrictEqual(planPriceCents, { club: 45000, coach: 75000, federation: 150000 });
  });
  test('activates only a paid session for the same plan and amount', () => {
    const order = { id: 'o1', user_id: 'u1', plan: 'coach', amount_cents: 75000 };
    const session = { payment_status: 'paid', status: 'complete', amount_total: 75000, currency: 'eur', metadata: { plan_order_id: 'o1', app_user_id: 'u1', plan: 'coach' } };
    strictEqual(verifiedPlanPayment(session, order), true);
    strictEqual(verifiedPlanPayment({ ...session, metadata: { ...session.metadata, plan: 'federation' } }, order), false);
    strictEqual(verifiedPlanPayment({ ...session, payment_status: 'unpaid' }, order), false);
  });
});

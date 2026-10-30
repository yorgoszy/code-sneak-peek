import { test } from 'node:test';
import { strictEqual, throws } from 'node:assert';
import { proratedUpgradeCents, verifiedUpgradePayment } from '../../../supabase/functions/_shared/coachUpgrade';

test('Upgrade uses EUR 400 for a full subscription period', () => {
  strictEqual(proratedUpgradeCents('2026-01-01', '2026-12-31', new Date('2026-01-01T12:00:00Z')), 40000);
});
test('Upgrade charges half of EUR 400 for half the remaining period', () => {
  strictEqual(proratedUpgradeCents('2026-01-01', '2026-01-10', new Date('2026-01-06T12:00:00Z')), 20000);
});
test('Upgrade cannot charge an expired subscription', () => {
  throws(() => proratedUpgradeCents('2026-01-01', '2026-01-10', new Date('2026-01-11T00:00:00Z')));
});
test('Only a paid matching Stripe session can activate the same account', () => {
  const order = { id: 'order', user_id: 'same-account', amount_cents: 20000 };
  const session = { payment_status: 'paid', status: 'complete', amount_total: 20000, currency: 'eur', metadata: { upgrade_order_id: 'order', app_user_id: 'same-account' } };
  strictEqual(verifiedUpgradePayment(session, order), true);
  strictEqual(verifiedUpgradePayment({ ...session, payment_status: 'unpaid' }, order), false);
  strictEqual(verifiedUpgradePayment({ ...session, amount_total: 1 }, order), false);
  strictEqual(verifiedUpgradePayment({ ...session, metadata: { ...session.metadata, app_user_id: 'other-account' } }, order), false);
});
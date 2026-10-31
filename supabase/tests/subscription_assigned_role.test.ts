import { test } from 'node:test';
import { strictEqual, ok } from 'node:assert';

async function eligible(status: string, paid: boolean, paused: boolean, start: string, end: string) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase public configuration required');
  const response = await fetch(`${url}/rest/v1/rpc/subscription_role_is_eligible`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_status: status, p_paid: paid, p_paused: paused, p_start: start, p_end: end, p_today: '2026-10-31' }),
  });
  ok(response.ok, `Eligibility request returned ${response.status}`);
  return response.json();
}

test('paid active current subscriptions qualify', async () => {
  strictEqual(await eligible('active', true, false, '2026-01-01', '2026-12-31'), true);
});

test('unpaid subscriptions do not grant roles', async () => strictEqual(await eligible('active', false, false, '2026-01-01', '2026-12-31'), false));
test('paused subscriptions do not grant roles', async () => strictEqual(await eligible('active', true, true, '2026-01-01', '2026-12-31'), false));
test('expired subscriptions do not grant roles', async () => strictEqual(await eligible('active', true, false, '2026-01-01', '2026-10-30'), false));
test('future subscriptions do not grant roles', async () => strictEqual(await eligible('active', true, false, '2026-11-01', '2026-12-31'), false));
test('cancelled subscriptions do not grant roles', async () => strictEqual(await eligible('cancelled', true, false, '2026-01-01', '2026-12-31'), false));
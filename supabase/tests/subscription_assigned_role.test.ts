import { test } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import { execFileSync } from 'node:child_process';

function query(sql: string) {
  return execFileSync('lovable', ['supabase', 'query', sql], { encoding: 'utf8' });
}

for (const role of ['club', 'coach', 'federation']) {
  test(`supports the ${role} subscription role`, () => {
    const result = query(`SELECT EXISTS(SELECT 1 FROM pg_enum WHERE enumtypid='public.user_role'::regtype AND enumlabel='${role}') AS supported`);
    ok(/true/.test(result), result);
  });
}

test('only paid active current subscriptions qualify', () => {
  const result = query(`SELECT public.subscription_role_is_eligible('active',true,false,'2026-01-01','2026-12-31','2026-10-31') AS eligible`);
  ok(/true/.test(result), result);
});

for (const [name, args] of [
  ['unpaid', "'active',false,false,'2026-01-01','2026-12-31'"],
  ['paused', "'active',true,true,'2026-01-01','2026-12-31'"],
  ['expired', "'active',true,false,'2026-01-01','2026-10-30'"],
  ['future', "'active',true,false,'2026-11-01','2026-12-31'"],
  ['cancelled', "'cancelled',true,false,'2026-01-01','2026-12-31'"],
]) {
  test(`${name} subscriptions do not grant roles`, () => {
    const result = query(`SELECT public.subscription_role_is_eligible(${args},'2026-10-31') AS eligible`);
    strictEqual(/true/.test(result), false, result);
    ok(/false/.test(result), result);
  });
}
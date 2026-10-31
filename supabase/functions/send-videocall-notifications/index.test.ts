import { describe, it } from 'node:test';
import { strictEqual, doesNotThrow } from 'node:assert';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise the real template without starting Deno's server or sending an email.
const source = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
const template = source.slice(source.indexOf('const generateEmailHTML ='), source.indexOf('\nserve(async'));
const compiled = ts.transpileModule(`${template}\nglobalThis.render = generateEmailHTML;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const context: { render?: (type: string, booking: unknown, adminEmail: unknown, user: unknown) => string } = {};
runInNewContext(compiled, context);
const render = context.render;
if (!render) throw new Error('Notification renderer not found');

describe('notification recipient data', () => {
  const user = { id: 'recipient-user', userId: 'recipient-user', name: 'Test user', email: 'test@example.com', booking_date: '2026-11-02', booking_time: '07:00:00', booking_type: 'gym_visit' };

  for (const type of ['booking_created', 'package_purchased', 'booking_cancelled', 'booking_cancelled_admin']) {
    it(`${type} works without a videocall booking`, () => {
      doesNotThrow(() => render(type, null, undefined, user));
    });
  }

  it('booking confirmation uses the recipient user ID', () => {
    const html = render('booking_created', null, undefined, user);
    strictEqual(html.includes('/user-profile/recipient-user?tab=online-booking'), true);
  });

  it('payment row ID cannot replace the recipient user ID', () => {
    const html = render('package_purchased', null, undefined, { ...user, id: 'payment-row' });
    strictEqual(html.includes('/user-profile/recipient-user?tab=online-booking'), true);
    strictEqual(html.includes('/user-profile/payment-row'), false);
  });

  it('videocall links use booking user_id even without a joined user ID', () => {
    const html = render('booking_approved', { user_id: 'videocall-user', app_users: { name: 'Test', email: 'test@example.com' }, booking_date: '2026-11-02', booking_time: '07:00:00', booking_type: 'videocall' }, undefined, null);
    strictEqual(html.includes('/user-profile/videocall-user?tab=online-coaching'), true);
  });
});
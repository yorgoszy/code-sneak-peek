import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { resolveProfileTab } from './profileNavigation';

describe('Coach user menu after login', () => {
  it('keeps the personal menu without a subscription', () => {
    strictEqual(resolveProfileTab('overview', false, true), 'overview');
  });
  it('never displays global admin purchases for coach users', () => {
    strictEqual(resolveProfileTab('shop', false, true), 'overview');
    strictEqual(resolveProfileTab('shop', true, true), 'overview');
  });
  it('does not unlock restricted features without a subscription', () => {
    strictEqual(resolveProfileTab('programs', false, true), 'overview');
    strictEqual(resolveProfileTab('programs', true, true), 'programs');
  });
  it('preserves the shop fallback for admin-managed users', () => {
    strictEqual(resolveProfileTab('overview', false, false), 'shop');
    strictEqual(resolveProfileTab('shop', true, false), 'shop');
  });
});
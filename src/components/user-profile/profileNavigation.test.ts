import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { resolveProfileTab } from './profileNavigation';

describe('Personal user menu after login', () => {
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
  it('keeps admin-managed users on their menu without a subscription', () => {
    strictEqual(resolveProfileTab('overview', false, false), 'overview');
    strictEqual(resolveProfileTab('programs', false, false), 'overview');
  });
  it('keeps purchases available only when explicitly selected by admin-managed users', () => {
    strictEqual(resolveProfileTab('shop', true, false), 'shop');
  });
});
import { it } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert';
import { canBookSection, canBookGymSection } from './bookingSectionAccess';

it('a subscription restricted to one section cannot book another section', () => {
  strictEqual(canBookSection('muay-thai', ['open-gym']), false);
  strictEqual(canBookSection('open-gym', ['open-gym']), true);
});

it('no selected sections retains access to all sections', () => {
  strictEqual(canBookSection('open-gym', []), true);
  strictEqual(canBookSection('muay-thai', null), true);
});

it('section choices update when restrictions arrive after initial loading', () => {
  const sections = ['open-gym', 'muay-thai'];
  deepStrictEqual(sections.filter(id => canBookSection(id, undefined)), sections);
  deepStrictEqual(sections.filter(id => canBookSection(id, ['open-gym'])), ['open-gym']);
});

it('visible sections only allow booking in the subscription-authorized section', () => {
  const availability = { type: 'visit_packages', available_visits: 12, allowed_sections: ['open-gym'] };
  strictEqual(canBookGymSection('open-gym', availability), true);
  strictEqual(canBookGymSection('muay-thai', availability), false);
});

it('missing or exhausted access leaves visible section slots disabled', () => {
  strictEqual(canBookGymSection('open-gym', null), false);
  strictEqual(canBookGymSection('open-gym', { type: 'none' }), false);
  strictEqual(canBookGymSection('open-gym', { type: 'visit_packages', available_visits: 0 }), false);
  strictEqual(canBookGymSection('open-gym', { type: 'hypergym', available_monthly: 0 }), false);
  strictEqual(canBookGymSection('open-gym', { type: 'hypergym', available_monthly: 2 }), true);
});
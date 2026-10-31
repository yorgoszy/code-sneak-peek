import { it } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert';
import { canBookSection } from './bookingSectionAccess';

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
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCoachReceiptTax, isValidGreekAfm } from './coachMyDataRules';

test('APY receipt at 24% extracts VAT from the final subscription price', () => {
  assert.deepEqual(calculateCoachReceiptTax(124, 1), { gross: 124, net: 100, vat: 24, rate: 24, invoiceType: '11.2' });
});
test('coach VAT is configurable instead of always 24%', () => {
  assert.deepEqual(calculateCoachReceiptTax(113, 2), { gross: 113, net: 100, vat: 13, rate: 13, invoiceType: '11.2' });
});
test('exempt coach has no VAT', () => {
  assert.deepEqual(calculateCoachReceiptTax(100, 7, 1), { gross: 100, net: 100, vat: 0, rate: 0, invoiceType: '11.2' });
});
test('exemption requires a reason rather than assuming zero VAT', () => {
  assert.throws(() => calculateCoachReceiptTax(100, 7));
});
test('invalid or unset VAT cannot issue a receipt', () => {
  assert.throws(() => calculateCoachReceiptTax(100, 0));
  assert.throws(() => calculateCoachReceiptTax(-100, 1));
});
test('AFM rejects malformed and all-zero values', () => {
  assert.equal(isValidGreekAfm('000000000'), false);
  assert.equal(isValidGreekAfm('123'), false);
});
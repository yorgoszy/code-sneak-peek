import { describe, expect, test } from 'bun:test';
import { withReceiptRecipient } from './receiptRecipient';

describe('retained receipt recipient', () => {
  test('retains recipient and issued details after user and subscription deletion', () => {
    const receipt = withReceiptRecipient({
      receipt_number: 'ΑΠ-0001', amount: 50, created_at: '2026-11-02',
      customer_name: 'Receipt recipient', customer_email: 'recipient@example.invalid',
      subscription_type_name: 'Monthly', app_users: null, subscription_types: null,
    });
    expect(receipt.app_users.name).toBe('Receipt recipient');
    expect(receipt.app_users.email).toBe('recipient@example.invalid');
    expect(receipt.subscription_types?.name).toBe('Monthly');
    expect(receipt.receipt_number).toBe('ΑΠ-0001');
    expect(receipt.amount).toBe(50);
    expect(receipt.created_at).toBe('2026-11-02');
  });
  test('uses original recipient snapshot instead of later profile edits', () => {
    const receipt = withReceiptRecipient({ customer_name: 'Original recipient', customer_email: 'original@example.invalid', app_users: { name: 'Edited', email: 'edited@example.invalid', avatar_url: null } });
    expect(receipt.app_users.name).toBe('Original recipient');
    expect(receipt.app_users.email).toBe('original@example.invalid');
  });
});
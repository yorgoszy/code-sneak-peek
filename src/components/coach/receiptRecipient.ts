interface ReceiptDetails {
  customer_name?: string | null;
  customer_email?: string | null;
  subscription_type_name?: string | null;
  app_users?: { name: string; email: string; avatar_url: string | null } | null;
  subscription_types?: { id: string; name: string } | null;
}

export function withReceiptRecipient<T extends ReceiptDetails>(receipt: T) {
  return {
    ...receipt,
    app_users: {
      name: receipt.customer_name ?? receipt.app_users?.name ?? '',
      email: receipt.customer_email ?? receipt.app_users?.email ?? '',
      avatar_url: receipt.app_users?.avatar_url ?? null,
    },
    subscription_types: receipt.subscription_type_name
      ? { id: receipt.subscription_types?.id ?? '', name: receipt.subscription_type_name }
      : receipt.subscription_types,
  };
}
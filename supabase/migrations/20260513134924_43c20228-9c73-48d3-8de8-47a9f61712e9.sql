INSERT INTO public.gift_cards (code, card_type, amount, subscription_type_id, sender_name, expires_at, status, purchase_method)
SELECT
  upper(
    substring(md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text), 1, 4) || '-' ||
    substring(md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text), 1, 4) || '-' ||
    substring(md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text), 1, 4)
  ),
  'subscription',
  60.00,
  '9c90c778-bcb2-4b46-9aaf-402e8deb9d85'::uuid,
  'Δανιήλ Διβάνογλου',
  '2026-09-30 23:59:59+00'::timestamptz,
  'active',
  'manual'
FROM generate_series(1, 9);
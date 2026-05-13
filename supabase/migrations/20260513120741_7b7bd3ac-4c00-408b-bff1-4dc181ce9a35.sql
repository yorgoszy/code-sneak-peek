INSERT INTO public.gift_cards (code, card_type, subscription_type_id, sender_name, status, purchase_method, expires_at, amount)
SELECT 
  LPAD((FLOOR(RANDOM() * 1000000000000))::TEXT, 12, '0'),
  'subscription',
  '9c90c778-bcb2-4b46-9aaf-402e8deb9d85'::uuid,
  'Δανιήλ Διβανόγλου',
  'active',
  'manual',
  '2026-11-18 23:59:59+00'::timestamptz,
  60
FROM generate_series(1, 30);
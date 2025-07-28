-- Προσθήκη δώρων στην εκστρατεία
INSERT INTO public.campaign_prizes (
  campaign_id,
  prize_type,
  subscription_type_id,
  discount_percentage,
  quantity,
  remaining_quantity,
  weight
) VALUES 
-- Subscription δώρο (πιο σπάνιο)
(
  '0108f961-bf30-41b8-9795-7e4ed66de009',
  'subscription',
  'f5220303-1181-4e76-b4e0-eab1ddde1085', -- Ένα subscription type id
  0,
  2,
  2,
  10
),
-- Κουπόνι έκπτωσης 50% (μέτριο)
(
  '0108f961-bf30-41b8-9795-7e4ed66de009',
  'discount_coupon',
  NULL,
  50,
  10,
  10,
  30
),
-- Κουπόνι έκπτωσης 20% (συχνό)
(
  '0108f961-bf30-41b8-9795-7e4ed66de009',
  'discount_coupon',
  NULL,
  20,
  20,
  20,
  100
),
-- Δοκίμασε ξανά (πιο συχνό)
(
  '0108f961-bf30-41b8-9795-7e4ed66de009',
  'try_again',
  NULL,
  0,
  1000,
  1000,
  200
),
-- Τίποτα (λιγότερο συχνό)
(
  '0108f961-bf30-41b8-9795-7e4ed66de009',
  'nothing',
  NULL,
  0,
  500,
  500,
  150
);
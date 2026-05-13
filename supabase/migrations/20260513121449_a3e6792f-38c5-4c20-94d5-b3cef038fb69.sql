UPDATE public.gift_cards
SET code = public.generate_gift_card_code()
WHERE sender_name = 'Δανιήλ Διβανόγλου'
  AND purchase_method = 'manual'
  AND code !~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$';
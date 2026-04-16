
CREATE OR REPLACE FUNCTION public.lookup_gift_card_by_code(p_code text)
RETURNS TABLE (
  id uuid,
  code text,
  amount numeric,
  card_type text,
  status text,
  expires_at timestamptz,
  subscription_type_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gc.id, gc.code, gc.amount, gc.card_type, gc.status, gc.expires_at, gc.subscription_type_id
  FROM public.gift_cards gc
  WHERE gc.code = upper(trim(p_code))
    AND gc.status = 'active'
  LIMIT 1;
$$;


-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view active gift cards by code" ON public.gift_cards;

-- Admins/coaches can see gift cards they created
CREATE POLICY "Admins can view their own gift cards"
ON public.gift_cards
FOR SELECT
TO authenticated
USING (
  created_by = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Recipients can see gift cards redeemed by them
CREATE POLICY "Recipients can view their gift cards"
ON public.gift_cards
FOR SELECT
TO authenticated
USING (
  redeemed_by = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
);

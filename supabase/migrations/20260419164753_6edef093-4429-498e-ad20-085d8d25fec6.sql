
-- Search users by name/email for federations (any role)
CREATE OR REPLACE FUNCTION public.find_user_by_contact(_query text)
RETURNS TABLE(id uuid, name text, email text, phone text, photo_url text, avatar_url text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.name, u.email, u.phone, u.photo_url, u.avatar_url, u.role::text
  FROM public.app_users u
  WHERE (
    u.email ILIKE '%' || _query || '%'
    OR u.name ILIKE '%' || _query || '%'
  )
  AND EXISTS (
    SELECT 1 FROM public.app_users fed
    WHERE fed.auth_user_id = auth.uid()
      AND fed.role = 'federation'
  )
  ORDER BY u.name
  LIMIT 8;
$$;

GRANT EXECUTE ON FUNCTION public.find_user_by_contact(text) TO authenticated;

-- Allow federations to insert new athletes under their linked clubs
CREATE POLICY "app_users_insert_federation_new_athlete"
ON public.app_users
FOR INSERT
TO authenticated
WITH CHECK (
  role IN ('athlete', 'general')
  AND coach_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.federation_clubs fc
    JOIN public.app_users fed ON fed.id = fc.federation_id
    WHERE fed.auth_user_id = auth.uid()
      AND fed.role = 'federation'
      AND fc.club_id = app_users.coach_id
  )
);

-- Function to assign existing user as athlete of a federation club
CREATE OR REPLACE FUNCTION public.federation_assign_athlete(_user_id uuid, _club_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fed_id uuid;
BEGIN
  SELECT id INTO fed_id FROM public.app_users
  WHERE auth_user_id = auth.uid() AND role = 'federation' LIMIT 1;
  IF fed_id IS NULL THEN
    RAISE EXCEPTION 'Not a federation user';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.federation_clubs
    WHERE federation_id = fed_id AND club_id = _club_id
  ) THEN
    RAISE EXCEPTION 'Club is not linked to this federation';
  END IF;
  UPDATE public.app_users
  SET coach_id = _club_id,
      role = CASE WHEN role IN ('athlete','general') THEN role ELSE 'athlete' END,
      updated_at = now()
  WHERE id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.federation_assign_athlete(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_fight_gallery(_limit int DEFAULT 12)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  athlete_name text,
  athlete_avatar_url text,
  opponent_name text,
  fight_date date,
  competition_name text,
  location text,
  video_url text,
  our_corner text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id,
    f.user_id,
    u.name AS athlete_name,
    COALESCE(u.avatar_url, u.photo_url) AS athlete_avatar_url,
    f.opponent_name,
    f.fight_date,
    f.competition_name,
    f.location,
    f.video_url,
    f.our_corner
  FROM public.muaythai_fights f
  LEFT JOIN public.app_users u ON u.id = f.user_id
  WHERE f.is_public = true
    AND f.video_url IS NOT NULL
  ORDER BY f.fight_date DESC NULLS LAST
  LIMIT GREATEST(_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_fight_gallery(int) TO anon, authenticated;

-- =============================================
-- Fix groups RLS policies (created_by stores app_users.id, not auth.uid())
-- =============================================

-- Drop broken policies on groups
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Users can delete their own groups" ON public.groups;
DROP POLICY IF EXISTS "Users can update their own groups" ON public.groups;

-- Groups: only admins, coaches, trainers can create
CREATE POLICY "groups_insert" ON public.groups FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_user() OR public.is_coach_user(auth.uid())
);

-- Groups: owner (created_by or coach_id) or admin can view
CREATE POLICY "groups_select" ON public.groups FOR SELECT TO authenticated
USING (
  public.is_admin_user()
  OR public.get_app_user_id_for_programs(auth.uid()) = created_by
  OR public.get_app_user_id_for_programs(auth.uid()) = coach_id
);

-- Groups: owner or admin can update
CREATE POLICY "groups_update" ON public.groups FOR UPDATE TO authenticated
USING (
  public.is_admin_user()
  OR public.get_app_user_id_for_programs(auth.uid()) = created_by
  OR public.get_app_user_id_for_programs(auth.uid()) = coach_id
)
WITH CHECK (
  public.is_admin_user()
  OR public.get_app_user_id_for_programs(auth.uid()) = created_by
  OR public.get_app_user_id_for_programs(auth.uid()) = coach_id
);

-- Groups: owner or admin can delete
CREATE POLICY "groups_delete" ON public.groups FOR DELETE TO authenticated
USING (
  public.is_admin_user()
  OR public.get_app_user_id_for_programs(auth.uid()) = created_by
  OR public.get_app_user_id_for_programs(auth.uid()) = coach_id
);

-- =============================================
-- Fix group_members RLS policies
-- =============================================

-- Drop permissive policies
DROP POLICY IF EXISTS "Authenticated users can add group members" ON public.group_members;
DROP POLICY IF EXISTS "Authenticated users can remove group members" ON public.group_members;
DROP POLICY IF EXISTS "Authenticated users can view group members" ON public.group_members;

-- group_members: only group owner/coach or admin can insert
CREATE POLICY "group_members_insert" ON public.group_members FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_id
    AND (
      g.created_by = public.get_app_user_id_for_programs(auth.uid())
      OR g.coach_id = public.get_app_user_id_for_programs(auth.uid())
    )
  )
);

-- group_members: group owner/coach, admin, or member themselves can view
CREATE POLICY "group_members_select" ON public.group_members FOR SELECT TO authenticated
USING (
  public.is_admin_user()
  OR user_id = public.get_app_user_id_for_programs(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_id
    AND (
      g.created_by = public.get_app_user_id_for_programs(auth.uid())
      OR g.coach_id = public.get_app_user_id_for_programs(auth.uid())
    )
  )
);

-- group_members: only group owner/coach or admin can delete
CREATE POLICY "group_members_delete" ON public.group_members FOR DELETE TO authenticated
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_id
    AND (
      g.created_by = public.get_app_user_id_for_programs(auth.uid())
      OR g.coach_id = public.get_app_user_id_for_programs(auth.uid())
    )
  )
);

-- =============================================
-- Fix mutable search_path on update_muaythai_updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_muaythai_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Read-only regression checks for permanent report deletion.
SELECT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'abuse_reports'
    AND cmd = 'DELETE' AND roles = ARRAY['authenticated']::name[]
    AND qual LIKE '%is_current_user_admin()%'
) AS admin_only_delete_policy;

SELECT has_table_privilege('authenticated', 'public.abuse_reports', 'DELETE')
  AS authenticated_delete_grant;

SELECT EXISTS (
  SELECT 1 FROM pg_constraint
  WHERE conrelid = 'public.acknowledged_abuse_reports'::regclass
    AND confrelid = 'public.abuse_reports'::regclass
    AND contype = 'f' AND confdeltype = 'c'
) AS acknowledgements_cascade;
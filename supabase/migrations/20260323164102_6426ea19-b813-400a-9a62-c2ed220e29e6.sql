-- Secure exec_sql: add admin-only guard and revoke public access

-- Replace the function with an admin-only version
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Admin-only guard
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Permission denied: only admins can execute raw SQL';
  END IF;

  EXECUTE query;
  RETURN '[]'::JSONB;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$function$;

-- Revoke execute from public and authenticated roles
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM public, authenticated;

-- Grant only to authenticated (admin check is inside the function)
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
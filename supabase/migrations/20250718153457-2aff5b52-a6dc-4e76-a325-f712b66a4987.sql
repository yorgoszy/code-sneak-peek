-- Προσθήκη RLS policy για διαγραφή επισκέψεων από admins
CREATE POLICY "Admins can delete visits" 
ON public.user_visits 
FOR DELETE 
USING (
  (auth.uid())::text IN ( 
    SELECT (au.auth_user_id)::text AS auth_user_id
    FROM app_users au
    WHERE (au.role)::text = 'admin'::text
  )
);

CREATE POLICY "Coach manages athlete cycles"
ON public.menstrual_cycles
FOR ALL
USING (
  user_id IN (
    SELECT au.id FROM public.app_users au
    WHERE au.coach_id IN (
      SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id IN (
    SELECT au.id FROM public.app_users au
    WHERE au.coach_id IN (
      SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admin manages all cycles"
ON public.menstrual_cycles
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

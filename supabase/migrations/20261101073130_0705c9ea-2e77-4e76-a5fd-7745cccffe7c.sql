GRANT DELETE ON public.abuse_reports TO authenticated;
CREATE POLICY "Admin can delete reports" ON public.abuse_reports FOR DELETE TO authenticated USING (public.is_current_user_admin());
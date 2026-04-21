-- Allow anonymous (public) read access to ekouros directories for autocomplete on public report-abuse form
CREATE POLICY "Anon read clubs" ON public.ekouros_clubs FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read sports" ON public.ekouros_sports FOR SELECT TO anon USING (true);
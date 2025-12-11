-- Create RLS policies for functional_test_sessions table
CREATE POLICY "Allow authenticated users to insert functional_test_sessions"
ON public.functional_test_sessions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select functional_test_sessions"
ON public.functional_test_sessions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update functional_test_sessions"
ON public.functional_test_sessions
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete functional_test_sessions"
ON public.functional_test_sessions
FOR DELETE
TO authenticated
USING (true);

-- Create RLS policies for functional_test_data table
CREATE POLICY "Allow authenticated users to insert functional_test_data"
ON public.functional_test_data
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select functional_test_data"
ON public.functional_test_data
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update functional_test_data"
ON public.functional_test_data
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete functional_test_data"
ON public.functional_test_data
FOR DELETE
TO authenticated
USING (true);
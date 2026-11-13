REVOKE ALL ON public.measurement_protocols,public.exercise_measurement_sessions,public.exercise_measurement_attempts FROM anon,authenticated;
GRANT SELECT ON public.measurement_protocols TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.exercise_measurement_sessions TO authenticated;
GRANT SELECT,INSERT ON public.exercise_measurement_attempts TO authenticated;
GRANT ALL ON public.measurement_protocols,public.exercise_measurement_sessions,public.exercise_measurement_attempts TO service_role;
-- Πρώτα κάνουμε drop την υπάρχουσα function
DROP FUNCTION IF EXISTS public.force_delete_athlete(uuid);

-- Δημιουργία νέας function με πλήρη διαγραφή εξαρτήσεων
CREATE OR REPLACE FUNCTION public.force_delete_athlete(athlete_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Διαγραφή expenses όπου ο χρήστης είναι coach
  DELETE FROM expenses WHERE coach_id = athlete_id;
  
  -- Διαγραφή coach-related data
  DELETE FROM coach_receipts WHERE coach_id = athlete_id OR user_id = athlete_id;
  DELETE FROM coach_subscriptions WHERE coach_id = athlete_id OR user_id = athlete_id;
  DELETE FROM coach_profiles WHERE coach_id = athlete_id;
  
  -- Διαγραφή coach test sessions
  DELETE FROM coach_anthropometric_test_sessions WHERE coach_id = athlete_id OR user_id = athlete_id;
  DELETE FROM coach_endurance_test_sessions WHERE coach_id = athlete_id OR user_id = athlete_id;
  DELETE FROM coach_functional_test_sessions WHERE coach_id = athlete_id OR user_id = athlete_id;
  DELETE FROM coach_jump_test_sessions WHERE coach_id = athlete_id OR user_id = athlete_id;
  DELETE FROM coach_strength_test_sessions WHERE coach_id = athlete_id OR user_id = athlete_id;
  
  -- Διαγραφή course-related data
  DELETE FROM coach_course_purchases WHERE coach_id = athlete_id;
  DELETE FROM course_questions WHERE coach_id = athlete_id;
  
  -- Διαγραφή block templates
  DELETE FROM block_templates WHERE created_by = athlete_id;
  
  -- Διαγραφή competitions
  DELETE FROM competitions WHERE user_id = athlete_id;
  
  -- Διαγραφή children
  DELETE FROM children WHERE parent_id = athlete_id;
  
  -- Διαγραφή closed_days
  DELETE FROM closed_days WHERE created_by = athlete_id;
  
  -- Διαγραφή acknowledged records
  DELETE FROM acknowledged_users WHERE admin_user_id = athlete_id OR user_id = athlete_id;
  DELETE FROM acknowledged_payments WHERE admin_user_id = athlete_id;
  DELETE FROM acknowledged_gym_bookings WHERE admin_user_id = athlete_id;
  DELETE FROM admin_notifications WHERE admin_user_id = athlete_id;
  
  -- Διαγραφή AI coach test results
  DELETE FROM ai_coach_test_results WHERE user_id = athlete_id;
  
  -- Διαγραφή anthropometric_measurements via tests
  DELETE FROM anthropometric_measurements 
  WHERE test_id IN (SELECT id FROM tests WHERE user_id = athlete_id);
  
  -- Διαγραφή tests
  DELETE FROM tests WHERE user_id = athlete_id;
  
  -- Διαγραφή program_assignments
  BEGIN
    DELETE FROM program_assignments WHERE user_id = athlete_id;
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, continue
  END;
  
  -- Nullify coach_id references σε άλλους χρήστες (αντί για διαγραφή)
  UPDATE app_users SET coach_id = NULL WHERE coach_id = athlete_id;
  
  -- Τέλος διαγραφή του χρήστη
  DELETE FROM app_users WHERE id = athlete_id;
END;
$function$;
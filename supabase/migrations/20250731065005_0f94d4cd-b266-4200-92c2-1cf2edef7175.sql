-- Fix Function Search Path Mutable warning by setting search_path for functions

-- Ενημέρωση όλων των functions για να έχουν σταθερό search_path
ALTER FUNCTION public.has_active_subscription(user_uuid uuid) SET search_path TO 'public';
ALTER FUNCTION public.update_user_magic_boxes_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.mark_booking_completed(booking_id uuid) SET search_path TO 'public';
ALTER FUNCTION public.mark_booking_missed(booking_id uuid) SET search_path TO 'public';
ALTER FUNCTION public.mark_past_bookings_as_missed() SET search_path TO 'public';
ALTER FUNCTION public.generate_coupon_code() SET search_path TO 'public';
ALTER FUNCTION public.update_campaign_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.join_waiting_list(p_user_id uuid, p_section_id uuid, p_booking_date date, p_booking_time time without time zone, p_booking_type text) SET search_path TO 'public';
ALTER FUNCTION public.leave_waiting_list(p_user_id uuid, p_section_id uuid, p_booking_date date, p_booking_time time without time zone, p_booking_type text) SET search_path TO 'public';
ALTER FUNCTION public.notify_next_in_waiting_list(p_section_id uuid, p_booking_date date, p_booking_time time without time zone, p_booking_type text) SET search_path TO 'public';
ALTER FUNCTION public.notify_videocall_changes() SET search_path TO 'public';
ALTER FUNCTION public.notify_user_welcome() SET search_path TO 'public';
ALTER FUNCTION public.admin_delete_athlete(athlete_id uuid) SET search_path TO 'public';
ALTER FUNCTION public.admin_delete_athlete_memberships(athlete_id uuid) SET search_path TO 'public';
ALTER FUNCTION public.update_exercise_results_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.exec_sql(query text) SET search_path TO 'public';
ALTER FUNCTION public.handle_new_user() SET search_path TO 'public';
ALTER FUNCTION public.force_delete_athlete(athlete_id uuid) SET search_path TO 'public';
ALTER FUNCTION public.get_suggested_velocity(athlete_id uuid, exercise_id uuid, percentage numeric) SET search_path TO 'public';
ALTER FUNCTION public.has_role(_user_id uuid, _role user_role) SET search_path TO 'public';
ALTER FUNCTION public.get_latest_1rm(athlete_id uuid, exercise_id uuid) SET search_path TO 'public';
ALTER FUNCTION public.get_user_role(_user_id uuid) SET search_path TO 'public';
ALTER FUNCTION public.get_current_user_role() SET search_path TO 'public';
ALTER FUNCTION public.notify_offer_responses() SET search_path TO 'public';
ALTER FUNCTION public.notify_offer_rejections() SET search_path TO 'public';
ALTER FUNCTION public.update_program_assignments_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path TO 'public';
ALTER FUNCTION public.update_ai_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.generate_user_qr_code() SET search_path TO 'public';
ALTER FUNCTION public.generate_receipt_number() SET search_path TO 'public';
ALTER FUNCTION public.notify_offer_created() SET search_path TO 'public';
ALTER FUNCTION public.cleanup_expired_waiting_list() SET search_path TO 'public';
ALTER FUNCTION public.pause_subscription(subscription_id uuid) SET search_path TO 'public';
ALTER FUNCTION public.resume_subscription(subscription_id uuid) SET search_path TO 'public';
ALTER FUNCTION public.create_exercise_tables() SET search_path TO '';
ALTER FUNCTION public.update_assignment_attendance() SET search_path TO '';
ALTER FUNCTION public.renew_subscription(original_subscription_id uuid) SET search_path TO 'public';
ALTER FUNCTION public.record_visit(p_user_id uuid, p_created_by uuid, p_visit_type text, p_notes text) SET search_path TO 'public';
ALTER FUNCTION public.check_and_update_expired_subscriptions() SET search_path TO 'public';
ALTER FUNCTION public.cleanup_expired_ai_chat_files() SET search_path TO 'public';
ALTER FUNCTION public.record_videocall(p_user_id uuid, p_created_by uuid, p_videocall_type text, p_notes text) SET search_path TO 'public';
ALTER FUNCTION public.can_cancel_booking(booking_id uuid) SET search_path TO 'public';
ALTER FUNCTION public.send_videocall_reminders(reminder_type text, time_window_start interval, time_window_end interval) SET search_path TO 'public';
ALTER FUNCTION public.get_user_available_bookings(user_uuid uuid) SET search_path TO 'public';
ALTER FUNCTION public.notify_new_user_registration() SET search_path TO 'public';
ALTER FUNCTION public.notify_payment_completed() SET search_path TO 'public';
ALTER FUNCTION public.notify_booking_changes() SET search_path TO 'public';

-- Fix Extension in Public warning - μετακίνηση extensions από public schema
-- Αυτό απαιτεί superuser privileges, οπότε θα το κάνουμε conditional
DO $$
BEGIN
  -- Προσπάθεια μετακίνησης uuid-ossp από public σε extensions schema
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    -- Δημιουργία extensions schema αν δεν υπάρχει
    CREATE SCHEMA IF NOT EXISTS extensions;
    -- Μετακίνηση extension
    ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Log το warning αν δεν έχουμε privileges
    RAISE WARNING 'Cannot move extensions due to insufficient privileges. This requires superuser access.';
  WHEN OTHERS THEN
    RAISE WARNING 'Error moving extension: %', SQLERRM;
END $$;
-- Δημιουργία trigger για videocall notifications στον πίνακα booking_sessions
CREATE TRIGGER videocall_booking_notifications
    AFTER INSERT OR UPDATE ON public.booking_sessions
    FOR EACH ROW
    WHEN (NEW.booking_type = 'videocall')
    EXECUTE FUNCTION public.notify_videocall_changes();
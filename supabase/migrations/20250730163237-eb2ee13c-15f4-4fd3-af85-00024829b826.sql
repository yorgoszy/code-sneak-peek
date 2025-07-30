-- Add completed and missed tracking to booking_sessions
ALTER TABLE public.booking_sessions 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS missed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT NULL;

-- Add index for attendance status for performance
CREATE INDEX IF NOT EXISTS idx_booking_sessions_attendance_status ON public.booking_sessions(attendance_status);

-- Create function to mark booking as completed
CREATE OR REPLACE FUNCTION public.mark_booking_completed(booking_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.booking_sessions 
  SET 
    attendance_status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = booking_id;
END;
$$;

-- Create function to mark booking as missed
CREATE OR REPLACE FUNCTION public.mark_booking_missed(booking_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.booking_sessions 
  SET 
    attendance_status = 'missed',
    missed_at = NOW(),
    updated_at = NOW()
  WHERE id = booking_id;
END;
$$;

-- Create function to automatically mark past bookings as missed
CREATE OR REPLACE FUNCTION public.mark_past_bookings_as_missed()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark confirmed bookings that are past their time as missed
  -- (only if they haven't been marked as completed)
  UPDATE public.booking_sessions 
  SET 
    attendance_status = 'missed',
    missed_at = NOW(),
    updated_at = NOW()
  WHERE 
    status = 'confirmed'
    AND attendance_status IS NULL
    AND (booking_date + booking_time::time)::timestamp < NOW()
    AND booking_type = 'gym_visit';
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
-- Create table for annual training phases per user per month
CREATE TABLE public.user_annual_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  phase TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.app_users(id),
  UNIQUE(user_id, year, month)
);

-- Enable RLS
ALTER TABLE public.user_annual_phases ENABLE ROW LEVEL SECURITY;

-- Policies for admin/trainer access
CREATE POLICY "Admins and trainers can view all phases"
ON public.user_annual_phases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role IN ('admin', 'trainer')
  )
);

CREATE POLICY "Admins and trainers can insert phases"
ON public.user_annual_phases
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role IN ('admin', 'trainer')
  )
);

CREATE POLICY "Admins and trainers can update phases"
ON public.user_annual_phases
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role IN ('admin', 'trainer')
  )
);

CREATE POLICY "Admins and trainers can delete phases"
ON public.user_annual_phases
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role IN ('admin', 'trainer')
  )
);

-- Users can view their own phases
CREATE POLICY "Users can view their own phases"
ON public.user_annual_phases
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.app_users
    WHERE app_users.auth_user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_user_annual_phases_updated_at
BEFORE UPDATE ON public.user_annual_phases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
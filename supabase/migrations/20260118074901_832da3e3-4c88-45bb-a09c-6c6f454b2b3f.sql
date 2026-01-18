-- Create strike_types table for storing custom strike definitions
CREATE TABLE public.strike_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('punch', 'kick', 'knee', 'elbow', 'combo', 'combo_kick_finish')),
  side TEXT CHECK (side IN ('left', 'right', 'both', NULL)),
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strike_types ENABLE ROW LEVEL SECURITY;

-- Policies for strike_types
CREATE POLICY "Coaches can view their own strike types"
  ON public.strike_types FOR SELECT
  USING (coach_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Coaches can create their own strike types"
  ON public.strike_types FOR INSERT
  WITH CHECK (coach_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Coaches can update their own strike types"
  ON public.strike_types FOR UPDATE
  USING (coach_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Coaches can delete their own strike types"
  ON public.strike_types FOR DELETE
  USING (coach_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create updated_at trigger
CREATE TRIGGER update_strike_types_updated_at
  BEFORE UPDATE ON public.strike_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
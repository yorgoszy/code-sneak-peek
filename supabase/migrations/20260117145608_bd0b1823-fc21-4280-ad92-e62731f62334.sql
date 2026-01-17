-- Create table for closed days
CREATE TABLE public.closed_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  closed_date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_by UUID REFERENCES public.app_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.closed_days ENABLE ROW LEVEL SECURITY;

-- Policy for admins/coaches to manage closed days
CREATE POLICY "Admins can manage closed days" 
ON public.closed_days 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'coach')
  )
);

-- Policy for public read access (for landing page)
CREATE POLICY "Anyone can view closed days" 
ON public.closed_days 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_closed_days_updated_at
BEFORE UPDATE ON public.closed_days
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
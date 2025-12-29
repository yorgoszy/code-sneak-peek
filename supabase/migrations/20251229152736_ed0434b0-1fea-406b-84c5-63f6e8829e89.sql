-- Create coach_profiles table for additional coach business information
CREATE TABLE public.coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL UNIQUE REFERENCES public.app_users(id) ON DELETE CASCADE,
  business_name TEXT,
  logo_url TEXT,
  vat_number TEXT, -- ΑΦΜ
  tax_office TEXT, -- ΔΟΥ
  address TEXT, -- Έδρα
  city TEXT,
  postal_code TEXT,
  services TEXT, -- Υπηρεσίες
  phone TEXT,
  website TEXT,
  bank_name TEXT,
  bank_iban TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Coaches can view their own profile"
  ON public.coach_profiles
  FOR SELECT
  USING (coach_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.app_users WHERE id = coach_id AND auth_user_id = auth.uid()
  ));

CREATE POLICY "Coaches can update their own profile"
  ON public.coach_profiles
  FOR UPDATE
  USING (coach_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.app_users WHERE id = coach_id AND auth_user_id = auth.uid()
  ));

CREATE POLICY "Coaches can insert their own profile"
  ON public.coach_profiles
  FOR INSERT
  WITH CHECK (coach_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.app_users WHERE id = coach_id AND auth_user_id = auth.uid()
  ));

-- Allow admins full access
CREATE POLICY "Admins have full access to coach profiles"
  ON public.coach_profiles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
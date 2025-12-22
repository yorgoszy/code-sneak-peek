-- Πίνακας για Μηνιαίο Προγραμματισμό (φάσεις ανά εβδομάδα)
CREATE TABLE public.user_monthly_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  week INTEGER NOT NULL CHECK (week >= 1 AND week <= 6),
  phase TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month, week, phase)
);

-- Πίνακας για Εβδομαδιαίο Προγραμματισμό (φάσεις ανά ημέρα)
CREATE TABLE public.user_weekly_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  week INTEGER NOT NULL CHECK (week >= 1 AND week <= 6),
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 7),
  phase TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month, week, day, phase)
);

-- Enable RLS
ALTER TABLE public.user_monthly_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_phases ENABLE ROW LEVEL SECURITY;

-- RLS Policies για user_monthly_phases
CREATE POLICY "Admins can manage all monthly phases"
ON public.user_monthly_phases
FOR ALL
USING (EXISTS (
  SELECT 1 FROM app_users
  WHERE app_users.auth_user_id = auth.uid()
  AND app_users.role = 'admin'
));

CREATE POLICY "Users can view their own monthly phases"
ON public.user_monthly_phases
FOR SELECT
USING (user_id IN (
  SELECT id FROM app_users WHERE auth_user_id = auth.uid()
));

-- RLS Policies για user_weekly_phases
CREATE POLICY "Admins can manage all weekly phases"
ON public.user_weekly_phases
FOR ALL
USING (EXISTS (
  SELECT 1 FROM app_users
  WHERE app_users.auth_user_id = auth.uid()
  AND app_users.role = 'admin'
));

CREATE POLICY "Users can view their own weekly phases"
ON public.user_weekly_phases
FOR SELECT
USING (user_id IN (
  SELECT id FROM app_users WHERE auth_user_id = auth.uid()
));

-- Indexes για γρηγορότερη αναζήτηση
CREATE INDEX idx_user_monthly_phases_user_year ON public.user_monthly_phases(user_id, year);
CREATE INDEX idx_user_weekly_phases_user_year_month ON public.user_weekly_phases(user_id, year, month);
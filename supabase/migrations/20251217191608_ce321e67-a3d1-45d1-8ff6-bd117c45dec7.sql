-- Create foods table with nutritional info
CREATE TABLE public.foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  calories_per_100g NUMERIC NOT NULL DEFAULT 0,
  protein_per_100g NUMERIC NOT NULL DEFAULT 0,
  carbs_per_100g NUMERIC NOT NULL DEFAULT 0,
  fat_per_100g NUMERIC NOT NULL DEFAULT 0,
  fiber_per_100g NUMERIC DEFAULT 0,
  portion_size NUMERIC DEFAULT 100,
  portion_unit TEXT DEFAULT 'g',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nutrition_plans table
CREATE TABLE public.nutrition_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  total_daily_calories NUMERIC,
  protein_target NUMERIC,
  carbs_target NUMERIC,
  fat_target NUMERIC,
  created_by UUID REFERENCES public.app_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nutrition_plan_days table (7 days per plan)
CREATE TABLE public.nutrition_plan_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.nutrition_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  total_calories NUMERIC DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nutrition_meals table (5 meals per day)
CREATE TABLE public.nutrition_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID NOT NULL REFERENCES public.nutrition_plan_days(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner')),
  meal_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_calories NUMERIC DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nutrition_meal_foods table (foods in each meal)
CREATE TABLE public.nutrition_meal_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.nutrition_meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id),
  food_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 100,
  unit TEXT DEFAULT 'g',
  calories NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  notes TEXT,
  food_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nutrition_assignments table
CREATE TABLE public.nutrition_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.nutrition_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.app_users(id),
  assigned_by UUID REFERENCES public.app_users(id),
  start_date DATE NOT NULL,
  end_date DATE,
  training_dates TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meal_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for foods (everyone can read, admins can manage)
CREATE POLICY "Anyone can view foods" ON public.foods FOR SELECT USING (true);
CREATE POLICY "Admins can manage foods" ON public.foods FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for nutrition_plans
CREATE POLICY "Admins can manage all nutrition plans" ON public.nutrition_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can view assigned nutrition plans" ON public.nutrition_plans FOR SELECT USING (
  id IN (SELECT plan_id FROM nutrition_assignments WHERE user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid()))
);

-- RLS Policies for nutrition_plan_days
CREATE POLICY "Admins can manage all nutrition plan days" ON public.nutrition_plan_days FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can view assigned plan days" ON public.nutrition_plan_days FOR SELECT USING (
  plan_id IN (SELECT plan_id FROM nutrition_assignments WHERE user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid()))
);

-- RLS Policies for nutrition_meals
CREATE POLICY "Admins can manage all nutrition meals" ON public.nutrition_meals FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can view assigned meals" ON public.nutrition_meals FOR SELECT USING (
  day_id IN (
    SELECT npd.id FROM nutrition_plan_days npd
    JOIN nutrition_assignments na ON na.plan_id = npd.plan_id
    WHERE na.user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
  )
);

-- RLS Policies for nutrition_meal_foods
CREATE POLICY "Admins can manage all meal foods" ON public.nutrition_meal_foods FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can view assigned meal foods" ON public.nutrition_meal_foods FOR SELECT USING (
  meal_id IN (
    SELECT nm.id FROM nutrition_meals nm
    JOIN nutrition_plan_days npd ON npd.id = nm.day_id
    JOIN nutrition_assignments na ON na.plan_id = npd.plan_id
    WHERE na.user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
  )
);

-- RLS Policies for nutrition_assignments
CREATE POLICY "Admins can manage all nutrition assignments" ON public.nutrition_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can view their own assignments" ON public.nutrition_assignments FOR SELECT USING (
  user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Users can create assignments for themselves" ON public.nutrition_assignments FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX idx_nutrition_plan_days_plan_id ON public.nutrition_plan_days(plan_id);
CREATE INDEX idx_nutrition_meals_day_id ON public.nutrition_meals(day_id);
CREATE INDEX idx_nutrition_meal_foods_meal_id ON public.nutrition_meal_foods(meal_id);
CREATE INDEX idx_nutrition_assignments_user_id ON public.nutrition_assignments(user_id);
CREATE INDEX idx_nutrition_assignments_plan_id ON public.nutrition_assignments(plan_id);
CREATE INDEX idx_foods_category ON public.foods(category);
-- Create knowledge_courses table for storing courses/tutorials
CREATE TABLE public.knowledge_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.app_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_courses ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all courses"
ON public.knowledge_courses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Everyone can view active courses
CREATE POLICY "Everyone can view active courses"
ON public.knowledge_courses
FOR SELECT
USING (is_active = true);

-- Create coach_course_purchases table for tracking purchases
CREATE TABLE public.coach_course_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.app_users(id),
  course_id UUID NOT NULL REFERENCES public.knowledge_courses(id) ON DELETE CASCADE,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  amount_paid NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coach_id, course_id)
);

-- Enable RLS
ALTER TABLE public.coach_course_purchases ENABLE ROW LEVEL SECURITY;

-- Admins can see all purchases
CREATE POLICY "Admins can manage all purchases"
ON public.coach_course_purchases
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Coaches can see their own purchases
CREATE POLICY "Coaches can view their own purchases"
ON public.coach_course_purchases
FOR SELECT
USING (coach_id = auth.uid());

-- Coaches can create purchases for themselves
CREATE POLICY "Coaches can create their own purchases"
ON public.coach_course_purchases
FOR INSERT
WITH CHECK (coach_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_knowledge_courses_updated_at
BEFORE UPDATE ON public.knowledge_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
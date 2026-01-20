-- Add pdf_url field to knowledge_courses
ALTER TABLE public.knowledge_courses
ADD COLUMN pdf_url TEXT;

-- Create course_questions table for Q&A
CREATE TABLE public.course_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.knowledge_courses(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.app_users(id),
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  answered_by UUID REFERENCES public.app_users(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_questions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all questions
CREATE POLICY "Admins can manage all questions"
ON public.course_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Coaches can view their own questions
CREATE POLICY "Coaches can view their own questions"
ON public.course_questions
FOR SELECT
USING (coach_id = auth.uid());

-- Coaches can create questions for themselves
CREATE POLICY "Coaches can create questions"
ON public.course_questions
FOR INSERT
WITH CHECK (coach_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_course_questions_course_id ON public.course_questions(course_id);
CREATE INDEX idx_course_questions_coach_id ON public.course_questions(coach_id);
CREATE INDEX idx_course_questions_is_read ON public.course_questions(is_read);
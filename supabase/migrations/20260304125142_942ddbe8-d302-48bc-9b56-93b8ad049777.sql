
-- Global category templates per federation
CREATE TABLE public.federation_category_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL DEFAULT 'combined',
  min_age INTEGER,
  max_age INTEGER,
  min_weight NUMERIC,
  max_weight NUMERIC,
  gender TEXT DEFAULT 'mixed',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.federation_category_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Federations manage own category templates"
  ON public.federation_category_templates
  FOR ALL
  TO authenticated
  USING (federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1))
  WITH CHECK (federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1));

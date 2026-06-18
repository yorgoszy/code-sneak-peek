CREATE TABLE public.landing_page_tree (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'el',
  tree JSONB NOT NULL DEFAULT '{"id":"root","type":"page","props":{},"style":{},"children":[]}'::jsonb,
  published_tree JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE (locale)
);

GRANT SELECT ON public.landing_page_tree TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.landing_page_tree TO authenticated;
GRANT ALL ON public.landing_page_tree TO service_role;

ALTER TABLE public.landing_page_tree ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read landing page tree"
  ON public.landing_page_tree FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert landing page tree"
  ON public.landing_page_tree FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update landing page tree"
  ON public.landing_page_tree FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete landing page tree"
  ON public.landing_page_tree FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_landing_page_tree_updated_at
  BEFORE UPDATE ON public.landing_page_tree
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed both locales with empty tree
INSERT INTO public.landing_page_tree (locale, tree) VALUES
  ('el', '{"id":"root","type":"page","props":{},"style":{"background":"hsl(var(--background))"},"children":[]}'::jsonb),
  ('en', '{"id":"root","type":"page","props":{},"style":{"background":"hsl(var(--background))"},"children":[]}'::jsonb)
ON CONFLICT (locale) DO NOTHING;
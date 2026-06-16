
-- Theme config (singleton)
CREATE TABLE public.landing_page_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_color TEXT NOT NULL DEFAULT '#00ffba',
  accent_color TEXT NOT NULL DEFAULT '#cb8954',
  bg_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color TEXT NOT NULL DEFAULT '#0a0a0a',
  heading_font TEXT NOT NULL DEFAULT 'Inter',
  body_font TEXT NOT NULL DEFAULT 'Inter',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.landing_page_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.landing_page_config TO authenticated;
GRANT ALL ON public.landing_page_config TO service_role;

ALTER TABLE public.landing_page_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read landing config"
  ON public.landing_page_config FOR SELECT
  USING (true);

CREATE POLICY "Admins manage landing config"
  ON public.landing_page_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sections
CREATE TABLE public.landing_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  cta_label TEXT,
  cta_url TEXT,
  image_url TEXT,
  bg_color TEXT,
  text_color TEXT,
  extra_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.landing_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.landing_sections TO authenticated;
GRANT ALL ON public.landing_sections TO service_role;

ALTER TABLE public.landing_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read landing sections"
  ON public.landing_sections FOR SELECT
  USING (true);

CREATE POLICY "Admins manage landing sections"
  ON public.landing_sections FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_landing_config_updated
BEFORE UPDATE ON public.landing_page_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_landing_sections_updated
BEFORE UPDATE ON public.landing_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed theme
INSERT INTO public.landing_page_config (primary_color, accent_color, bg_color, text_color, heading_font, body_font)
VALUES ('#00ffba', '#cb8954', '#ffffff', '#0a0a0a', 'Inter', 'Inter');

-- Seed sections
INSERT INTO public.landing_sections (section_key, display_order, title, subtitle, description, cta_label, cta_url) VALUES
  ('navigation',     0,  'HyperGym',                NULL,                                       NULL,                                                    NULL,            NULL),
  ('hero',           1,  'Train Like a Champion',  'Elite training for combat athletes',       'Επιστημονική προσέγγιση στην προπόνηση μαχητικών αθλημάτων.', 'Ξεκίνα τώρα',  '/auth'),
  ('elite_training', 2,  'Elite Training',          'Επαγγελματικός εξοπλισμός',                NULL,                                                    NULL,            NULL),
  ('programs',       3,  'Προγράμματα',             'Επίλεξε το πρόγραμμά σου',                 NULL,                                                    'Δες όλα',      '/shop'),
  ('about',          4,  'Σχετικά με εμάς',         'Η ομάδα του HyperGym',                     NULL,                                                    NULL,            NULL),
  ('live_matches',   5,  'Live Αγώνες',             'Παρακολούθησε ζωντανά',                    NULL,                                                    NULL,            NULL),
  ('results',        6,  'Αποτελέσματα',            'Δες τα στατιστικά των αθλητών μας',        NULL,                                                    NULL,            NULL),
  ('video_gallery',  7,  'Video Gallery',           'Αγώνες & προπονήσεις',                     NULL,                                                    NULL,            NULL),
  ('certificates',   8,  'Πιστοποιήσεις',           NULL,                                       NULL,                                                    NULL,            NULL),
  ('blog',           9,  'Blog',                    'Άρθρα & νέα',                              NULL,                                                    NULL,            NULL),
  ('gift_card',      10, 'Gift Cards',              'Κάντε δώρο μια συνδρομή',                  NULL,                                                    'Αγόρασε',      '/shop'),
  ('contact',        11, 'Επικοινωνία',             'Είμαστε εδώ για εσάς',                     NULL,                                                    NULL,            NULL),
  ('footer',         12, 'HyperGym',                NULL,                                       '© HyperGym. Όλα τα δικαιώματα διατηρούνται.',           NULL,            NULL);

-- Seed extra_data with section-specific defaults
UPDATE public.landing_sections SET extra_data = jsonb_build_object(
  'logo_text', 'HyperGym',
  'menu_items', jsonb_build_array(
    jsonb_build_object('label','Home','url','#hero'),
    jsonb_build_object('label','Προγράμματα','url','#programs'),
    jsonb_build_object('label','Σχετικά','url','#about'),
    jsonb_build_object('label','Blog','url','#blog'),
    jsonb_build_object('label','Επικοινωνία','url','#contact')
  )
) WHERE section_key = 'navigation';

UPDATE public.landing_sections SET extra_data = jsonb_build_object(
  'badge', 'Combat Sports Training',
  'secondary_cta_label', 'Μάθε περισσότερα',
  'secondary_cta_url', '#about'
) WHERE section_key = 'hero';

UPDATE public.landing_sections SET extra_data = jsonb_build_object(
  'bullets', jsonb_build_array(
    'Επιστημονική προσέγγιση',
    'Εξατομικευμένα προγράμματα',
    'Live AI Analysis'
  )
) WHERE section_key = 'about';

UPDATE public.landing_sections SET extra_data = jsonb_build_object(
  'phone', '+30 210 0000000',
  'email', 'info@hyperkids.gr',
  'address', 'Αθήνα, Ελλάδα',
  'social', jsonb_build_object(
    'instagram', 'https://instagram.com/hypergym',
    'facebook',  'https://facebook.com/hypergym',
    'youtube',   'https://youtube.com/@hypergym'
  )
) WHERE section_key = 'contact';

UPDATE public.landing_sections SET extra_data = jsonb_build_object(
  'columns', jsonb_build_array(
    jsonb_build_object('title','Εταιρεία','links', jsonb_build_array(
      jsonb_build_object('label','Σχετικά','url','#about'),
      jsonb_build_object('label','Επικοινωνία','url','#contact')
    )),
    jsonb_build_object('title','Νομικά','links', jsonb_build_array(
      jsonb_build_object('label','Όροι Χρήσης','url','/terms'),
      jsonb_build_object('label','Πολιτική Απορρήτου','url','/privacy')
    ))
  ),
  'copyright', '© HyperGym 2026'
) WHERE section_key = 'footer';

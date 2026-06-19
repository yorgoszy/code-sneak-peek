
ALTER TABLE public.landing_page_config
  ADD COLUMN IF NOT EXISTS link_color text DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS link_hover_color text DEFAULT '#00ffba',
  ADD COLUMN IF NOT EXISTS button_bg_color text DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS button_text_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS button_hover_bg_color text DEFAULT '#00ffba',
  ADD COLUMN IF NOT EXISTS button_hover_text_color text DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS nav_bg_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS nav_text_color text DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS nav_hover_color text DEFAULT '#00ffba',
  ADD COLUMN IF NOT EXISTS nav_icon_color text DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS custom_fonts jsonb DEFAULT '[]'::jsonb;

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CustomFont {
  name: string;
  url: string;
  format?: string;
}

export interface LandingTheme {
  id: string;
  primary_color: string;
  accent_color: string;
  bg_color: string;
  text_color: string;
  heading_font: string;
  body_font: string;
  link_color: string;
  link_hover_color: string;
  button_bg_color: string;
  button_text_color: string;
  button_hover_bg_color: string;
  button_hover_text_color: string;
  nav_bg_color: string;
  nav_text_color: string;
  nav_hover_color: string;
  nav_icon_color: string;
  custom_fonts: CustomFont[];
}

export interface LandingSection {
  id: string;
  section_key: string;
  display_order: number;
  is_visible: boolean;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  cta_label: string | null;
  title_en: string | null;
  subtitle_en: string | null;
  description_en: string | null;
  cta_label_en: string | null;
  cta_url: string | null;
  image_url: string | null;
  bg_color: string | null;
  text_color: string | null;
  extra_data: Record<string, any>;
}

export const SECTION_KEYS = [
  'navigation', 'hero', 'elite_training', 'programs', 'about',
  'live_matches', 'results', 'video_gallery', 'certificates',
  'blog', 'gift_card', 'contact', 'footer',
] as const;

export const SECTION_LABELS: Record<string, { el: string; en: string }> = {
  navigation:     { el: 'Πλοήγηση',       en: 'Navigation' },
  hero:           { el: 'Hero',           en: 'Hero' },
  elite_training: { el: 'Elite Training', en: 'Elite Training' },
  programs:       { el: 'Προγράμματα',    en: 'Programs' },
  about:          { el: 'Σχετικά',        en: 'About' },
  live_matches:   { el: 'Live Αγώνες',    en: 'Live Matches' },
  results:        { el: 'Αποτελέσματα',   en: 'Results' },
  video_gallery:  { el: 'Gallery Βίντεο', en: 'Video Gallery' },
  certificates:   { el: 'Πιστοποιήσεις',  en: 'Certificates' },
  blog:           { el: 'Blog',           en: 'Blog' },
  gift_card:      { el: 'Δωροκάρτα',      en: 'Gift Card' },
  contact:        { el: 'Επικοινωνία',    en: 'Contact' },
  footer:         { el: 'Υποσέλιδο',      en: 'Footer' },
};

export type Lang = 'el' | 'en';

export function localized(
  section: LandingSection | null | undefined,
  field: 'title' | 'subtitle' | 'description' | 'cta_label',
  lang: Lang
): string | null {
  if (!section) return null;
  if (lang === 'en') {
    const en = (section as any)[`${field}_en`];
    if (en) return en;
  }
  return (section as any)[field] ?? null;
}

export function useLandingTheme() {
  return useQuery({
    queryKey: ['landing-theme'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_config' as any).select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const raw = data as any;
      return {
        ...raw,
        custom_fonts: Array.isArray(raw.custom_fonts) ? raw.custom_fonts : [],
      } as LandingTheme;
    },
    staleTime: 30_000,
  });
}

export function useLandingSections() {
  return useQuery({
    queryKey: ['landing-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_sections' as any).select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as LandingSection[];
    },
    staleTime: 30_000,
  });
}

export function useLandingSection(sectionKey: string) {
  const { data: sections } = useLandingSections();
  return sections?.find((s) => s.section_key === sectionKey) ?? null;
}

export function useInvalidateLanding() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['landing-theme'] });
    qc.invalidateQueries({ queryKey: ['landing-sections'] });
  };
}

const loadedGoogleFonts = new Set<string>();
const PROJECT_FONT_NAMES = new Set(['Roobert Pro', 'Roobert', 'Robert Pro', 'RoobertPRO', 'Roobert PRO']);

function normalizeProjectFont(name: string | null | undefined) {
  if (!name) return 'Roobert Pro';
  return PROJECT_FONT_NAMES.has(name) ? 'Roobert Pro' : name;
}

function loadGoogleFont(name: string) {
  if (!name || PROJECT_FONT_NAMES.has(name) || loadedGoogleFonts.has(name)) return;
  // Skip if it's a custom uploaded font (handled separately)
  loadedGoogleFonts.add(name);
  const family = name.replace(/\s+/g, '+');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

const loadedCustomFonts = new Set<string>();
function loadCustomFont(font: CustomFont) {
  const key = `${font.name}::${font.url}`;
  if (loadedCustomFonts.has(key)) return;
  loadedCustomFonts.add(key);
  const fmt = font.format || (font.url.endsWith('.woff2') ? 'woff2' : font.url.endsWith('.woff') ? 'woff' : font.url.endsWith('.otf') ? 'opentype' : 'truetype');
  const style = document.createElement('style');
  style.setAttribute('data-custom-font', font.name);
  style.textContent = `@font-face { font-family: '${font.name}'; src: url('${font.url}') format('${fmt}'); font-display: swap; }`;
  document.head.appendChild(style);
}

export function useApplyLandingTheme(theme: LandingTheme | null | undefined) {
  useEffect(() => {
    if (!theme) return;
    // Load custom fonts first so heading/body refs to them resolve
    (theme.custom_fonts ?? []).forEach(loadCustomFont);
    const customNames = new Set((theme.custom_fonts ?? []).map((f) => f.name));
    const headingFont = normalizeProjectFont(theme.heading_font);
    const bodyFont = normalizeProjectFont(theme.body_font);
    if (!customNames.has(headingFont)) loadGoogleFont(headingFont);
    if (!customNames.has(bodyFont)) loadGoogleFont(bodyFont);

    const root = document.documentElement;
    const set = (k: string, v: string | undefined | null) => {
      if (v) root.style.setProperty(k, v);
    };
    set('--landing-primary', theme.primary_color);
    set('--landing-accent', theme.accent_color);
    set('--landing-bg', theme.bg_color);
    set('--landing-text', theme.text_color);
    set('--landing-link', theme.link_color);
    set('--landing-link-hover', theme.link_hover_color);
    set('--landing-btn-bg', theme.button_bg_color);
    set('--landing-btn-text', theme.button_text_color);
    set('--landing-btn-hover-bg', theme.button_hover_bg_color);
    set('--landing-btn-hover-text', theme.button_hover_text_color);
    set('--landing-nav-bg', theme.nav_bg_color);
    set('--landing-nav-text', theme.nav_text_color);
    set('--landing-nav-hover', theme.nav_hover_color);
    set('--landing-nav-icon', theme.nav_icon_color);
    set('--landing-font-heading', `'${headingFont}', sans-serif`);
    set('--landing-font-body', `'${bodyFont}', sans-serif`);
  }, [theme]);
}

export function backgroundCss(extra: Record<string, any> | null | undefined): string | undefined {
  const bg = extra?.background;
  if (!bg) return undefined;
  if (bg.type === 'solid' && bg.color) return bg.color;
  if (bg.type === 'gradient' && bg.from && bg.to) {
    const angle = bg.angle ?? 135;
    return `linear-gradient(${angle}deg, ${bg.from}, ${bg.to})`;
  }
  return undefined;
}

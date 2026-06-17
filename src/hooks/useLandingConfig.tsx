import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LandingTheme {
  id: string;
  primary_color: string;
  accent_color: string;
  bg_color: string;
  text_color: string;
  heading_font: string;
  body_font: string;
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

/** Returns localized field with fallback to EL. */
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
      return data as unknown as LandingTheme | null;
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

const loadedFonts = new Set<string>();
function loadGoogleFont(name: string) {
  if (!name || loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const family = name.replace(/\s+/g, '+');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function useApplyLandingTheme(theme: LandingTheme | null | undefined) {
  useEffect(() => {
    if (!theme) return;
    loadGoogleFont(theme.heading_font);
    loadGoogleFont(theme.body_font);
    const root = document.documentElement;
    root.style.setProperty('--landing-primary', theme.primary_color);
    root.style.setProperty('--landing-accent', theme.accent_color);
    root.style.setProperty('--landing-bg', theme.bg_color);
    root.style.setProperty('--landing-text', theme.text_color);
    root.style.setProperty('--landing-font-heading', `'${theme.heading_font}', sans-serif`);
    root.style.setProperty('--landing-font-body', `'${theme.body_font}', sans-serif`);
  }, [theme]);
}

/** Build a CSS background string from extra_data.background. */
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

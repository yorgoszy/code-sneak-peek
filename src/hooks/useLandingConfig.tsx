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
  cta_url: string | null;
  image_url: string | null;
  bg_color: string | null;
  text_color: string | null;
  extra_data: Record<string, any>;
}

export const SECTION_KEYS = [
  'navigation',
  'hero',
  'elite_training',
  'programs',
  'about',
  'live_matches',
  'results',
  'video_gallery',
  'certificates',
  'blog',
  'gift_card',
  'contact',
  'footer',
] as const;

export const SECTION_LABELS: Record<string, string> = {
  navigation: 'Navigation',
  hero: 'Hero',
  elite_training: 'Elite Training',
  programs: 'Programs',
  about: 'About Us',
  live_matches: 'Live Matches',
  results: 'Results',
  video_gallery: 'Video Gallery',
  certificates: 'Certificates',
  blog: 'Blog',
  gift_card: 'Gift Card',
  contact: 'Contact',
  footer: 'Footer',
};

export function useLandingTheme() {
  return useQuery({
    queryKey: ['landing-theme'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_config' as any)
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as LandingTheme | null;
    },
    staleTime: 60_000,
  });
}

export function useLandingSections() {
  return useQuery({
    queryKey: ['landing-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_sections' as any)
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as LandingSection[];
    },
    staleTime: 60_000,
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

/** Apply theme tokens + load Google fonts. Mount once on landing page root. */
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

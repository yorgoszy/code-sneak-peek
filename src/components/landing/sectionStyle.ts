import type { CSSProperties } from 'react';
import type { LandingSection } from '@/hooks/useLandingConfig';

/**
 * Build a CSS-vars style object from a section's per-section style overrides
 * (stored at section.extra_data.style). Only defined keys are emitted, so
 * undefined values fall through to the global theme variables.
 *
 * Apply on a wrapper around the section to scope the overrides locally.
 */
export function getSectionStyleVars(section: LandingSection | null | undefined): CSSProperties {
  const style: Record<string, any> = (section?.extra_data?.style ?? {}) as Record<string, any>;
  const out: Record<string, string> = {};

  const map: Array<[string, string]> = [
    ['bg_color',                '--landing-bg'],
    ['text_color',              '--landing-text'],
    ['link_color',              '--landing-link'],
    ['link_hover_color',        '--landing-link-hover'],
    ['button_bg_color',         '--landing-btn-bg'],
    ['button_text_color',       '--landing-btn-text'],
    ['button_hover_bg_color',   '--landing-btn-hover-bg'],
    ['button_hover_text_color', '--landing-btn-hover-text'],
  ];
  for (const [k, v] of map) {
    if (style[k]) out[v] = String(style[k]);
  }

  // Navigation-specific overrides
  if (section?.section_key === 'navigation') {
    if (style.bg_color)         out['--landing-nav-bg'] = String(style.bg_color);
    if (style.text_color)       out['--landing-nav-text'] = String(style.text_color);
    if (style.link_hover_color) out['--landing-nav-hover'] = String(style.link_hover_color);
    if (style.icon_color)       out['--landing-nav-icon'] = String(style.icon_color);
  }

  if (style.heading_font) out['--landing-font-heading'] = `'${style.heading_font}', sans-serif`;
  if (style.body_font)    out['--landing-font-body']    = `'${style.body_font}', sans-serif`;

  // Apply background + text color directly to the wrapper too so plain children inherit
  const inline: CSSProperties = { ...(out as any) };
  if (style.bg_color)   (inline as any).backgroundColor = style.bg_color;
  if (style.text_color) (inline as any).color = style.text_color;
  if (style.body_font)  (inline as any).fontFamily = `'${style.body_font}', sans-serif`;

  return inline;
}

export function getSectionIcon(section: LandingSection | null | undefined): { name: string | null; color: string | undefined } {
  const name = (section?.extra_data?.icon as string | undefined) ?? null;
  const style: Record<string, any> = (section?.extra_data?.style ?? {}) as Record<string, any>;
  const color = (style.section_icon_color as string | undefined) || (style.icon_color as string | undefined) || undefined;
  return { name, color };
}

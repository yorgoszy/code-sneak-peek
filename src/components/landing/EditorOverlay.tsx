import { useEffect } from 'react';

/**
 * Mounted inside Index when ?editor=1. Tags each <section> with hover/click outlines
 * and posts the section key to the parent (CMS) window on click. Also applies live
 * per-section style overrides received from the parent CMS edit panel.
 */
export const EditorOverlay = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      [data-section-key] { position: relative; cursor: pointer; outline-offset: -2px; }
      [data-section-key]:hover { outline: 2px dashed #00ffba; }
      [data-section-key].__editor-selected { outline: 2px solid #00ffba; }
      [data-section-key]::before {
        content: attr(data-section-key);
        position: absolute; top: 4px; left: 4px;
        background: #000; color: #00ffba; font: 11px monospace;
        padding: 2px 6px; z-index: 9999; pointer-events: none;
        opacity: 0; transition: opacity .15s;
      }
      [data-section-key]:hover::before, [data-section-key].__editor-selected::before { opacity: 1; }
    `;
    document.head.appendChild(style);

    // Tag every <section> with its id as data-section-key (fallback for sections without id)
    const map: Record<string, string> = {
      home: 'hero', programs: 'programs', about: 'about',
      blog: 'blog', results: 'results', footer: 'footer',
      'live-matches': 'live_matches', 'video-gallery': 'video_gallery',
      certificates: 'certificates', 'gift-card': 'gift_card',
      'elite-training': 'elite_training', 'live-program': 'elite_training',
    };
    document.querySelectorAll('section').forEach((sec) => {
      const id = sec.id || '';
      const key = map[id] || id || sec.getAttribute('data-key') || 'unknown';
      sec.setAttribute('data-section-key', key);
    });
    // Tag <nav> as navigation
    document.querySelectorAll('nav').forEach((n) => n.setAttribute('data-section-key', 'navigation'));

    const click = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // Let editable text + logo handles receive their own clicks
      if (t.closest('[data-editable], [data-logo-edit-root]')) return;
      const target = t.closest('[data-section-key]') as HTMLElement | null;
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.__editor-selected').forEach((el) => el.classList.remove('__editor-selected'));
      target.classList.add('__editor-selected');
      const key = target.getAttribute('data-section-key');
      if (key) window.parent?.postMessage({ type: 'landing-editor-select', key }, '*');
    };
    document.addEventListener('click', click, true);

    // Disable all internal navigation while in editor
    const navBlock = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-editable], [data-logo-edit-root]')) return;
      const a = t.closest('a, button');
      if (a) { e.preventDefault(); e.stopPropagation(); }
    };
    document.addEventListener('click', navBlock, true);

    // Live preview: apply per-section style overrides pushed from the CMS edit panel
    const STYLE_VAR_MAP: Array<[string, string]> = [
      ['bg_color',                '--landing-bg'],
      ['text_color',              '--landing-text'],
      ['link_color',              '--landing-link'],
      ['link_hover_color',        '--landing-link-hover'],
      ['button_bg_color',         '--landing-btn-bg'],
      ['button_text_color',       '--landing-btn-text'],
      ['button_hover_bg_color',   '--landing-btn-hover-bg'],
      ['button_hover_text_color', '--landing-btn-hover-text'],
    ];
    const NAV_VAR_MAP: Array<[string, string]> = [
      ['bg_color',         '--landing-nav-bg'],
      ['text_color',       '--landing-nav-text'],
      ['link_hover_color', '--landing-nav-hover'],
      ['icon_color',       '--landing-nav-icon'],
    ];
    const applyDraft = (sectionKey: string, s: Record<string, any>) => {
      const el = document.querySelector(`[data-section-key="${sectionKey}"]`) as HTMLElement | null;
      if (!el) return;
      const set = (k: string, v: string | undefined | null) => {
        if (v) el.style.setProperty(k, v);
        else el.style.removeProperty(k);
      };
      for (const [k, v] of STYLE_VAR_MAP) set(v, s?.[k]);
      if (sectionKey === 'navigation') {
        for (const [k, v] of NAV_VAR_MAP) set(v, s?.[k]);
      }
      set('--landing-font-heading', s?.heading_font ? `'${s.heading_font}', sans-serif` : null);
      set('--landing-font-body', s?.body_font ? `'${s.body_font}', sans-serif` : null);
      el.style.fontFamily = s?.body_font ? `'${s.body_font}', sans-serif` : '';
      el.style.backgroundColor = s?.bg_color ?? '';
      el.style.color = s?.text_color ?? '';
    };
    const onMessage = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.type !== 'landing-editor-draft' || !d.sectionKey) return;
      applyDraft(d.sectionKey, d.style ?? {});
    };
    window.addEventListener('message', onMessage);
    // Tell the parent we're ready so it can replay the current draft
    window.parent?.postMessage({ type: 'landing-editor-ready' }, '*');

    return () => {
      document.removeEventListener('click', click, true);
      document.removeEventListener('click', navBlock, true);
      window.removeEventListener('message', onMessage);
      style.remove();
    };
  }, []);

  return null;
};

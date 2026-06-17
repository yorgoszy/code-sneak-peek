import { useEffect } from 'react';

/**
 * Mounted inside Index when ?editor=1. Tags each <section> with hover/click outlines
 * and posts the section key to the parent (CMS) window on click.
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
      const target = (e.target as HTMLElement).closest('[data-section-key]') as HTMLElement | null;
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
      const a = (e.target as HTMLElement).closest('a, button');
      if (a) { e.preventDefault(); e.stopPropagation(); }
    };
    document.addEventListener('click', navBlock, true);

    return () => {
      document.removeEventListener('click', click, true);
      document.removeEventListener('click', navBlock, true);
      style.remove();
    };
  }, []);

  return null;
};

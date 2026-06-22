
import React from 'react';
import { Button } from "@/components/ui/button";
import { useLandingSection, localized, backgroundCss, type Lang } from "@/hooks/useLandingConfig";
import { useTranslations } from "@/hooks/useTranslations";
import { EditableText } from "./EditableText";
import { HeroEditableText, HeroDraggableButton, isHeroEditorMode, useBP } from "./HeroLayoutEditing";
import { TrialRequestDialog } from "./TrialRequestDialog";

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const DEFAULT_HERO_IMAGE = '/lovable-uploads/7d78ce26-3ce9-488f-9948-1cb90eac5b9e.png';

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  const cms = useLandingSection('hero');
  const { language } = useTranslations();
  const lang: Lang = language === 'en' ? 'en' : 'el';
  const editor = isHeroEditorMode();
  const bp = useBP();

  const [active, setActive] = React.useState<null | 'title' | 'subtitle' | 'tagline' | 'btn-primary' | 'btn-secondary'>(null);
  const [localLayout, setLocalLayout] = React.useState<any>(null);
  const [trialOpen, setTrialOpen] = React.useState(false);

  // Click outside hero edit roots → deactivate
  React.useEffect(() => {
    if (!editor) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-hero-edit-root]')) setActive(null);
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [editor]);

  // Deep-merge helper for hero_layout patches (handles nested bp namespaces)
  const deepMerge = (a: any, b: any): any => {
    if (!b || typeof b !== 'object' || Array.isArray(b)) return b ?? a;
    const out: any = { ...(a ?? {}) };
    for (const k of Object.keys(b)) {
      const av = out[k]; const bv = b[k];
      if (av && bv && typeof av === 'object' && typeof bv === 'object' && !Array.isArray(av) && !Array.isArray(bv)) {
        out[k] = deepMerge(av, bv);
      } else {
        out[k] = bv;
      }
    }
    return out;
  };

  // Live local patches from drag/resize handles — instant, no parent round-trip
  React.useEffect(() => {
    if (!editor) return;
    const onPatch = (e: Event) => {
      const patch = (e as CustomEvent).detail ?? {};
      setLocalLayout((prev: any) => deepMerge(prev ?? {}, patch));
    };
    window.addEventListener('hero-layout-local', onPatch as EventListener);
    return () => window.removeEventListener('hero-layout-local', onPatch as EventListener);
  }, [editor]);

  // Live draft from parent editor (undo, sidebar changes) — replace layout fully without iframe reload
  const [draftExtra, setDraftExtra] = React.useState<any>(null);
  React.useEffect(() => {
    if (!editor) return;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'landing-editor-draft' && e.data.sectionKey === 'hero') {
        setDraftExtra(e.data.extra ?? {});
        // overwrite local drag layout with the authoritative one (e.g. undo)
        if (e.data.extra?.hero_layout) setLocalLayout(e.data.extra.hero_layout);
      }
    };
    window.addEventListener('message', onMsg);
    try { window.parent?.postMessage({ type: 'landing-editor-ready' }, '*'); } catch { /* ignore */ }
    return () => window.removeEventListener('message', onMsg);
  }, [editor]);


  // Reset local override once the saved cms layout catches up
  React.useEffect(() => { setLocalLayout(null); }, [cms?.extra_data?.hero_layout]);

  const handleContactClick = () => {
    const footerSection = document.getElementById('footer');
    if (footerSection) {
      footerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (cms && cms.is_visible === false) return null;

  // Merge: cmsLayout (desktop base) → cmsLayout[bp] override → localLayout (live)
  const effectiveExtra = draftExtra ?? cms?.extra_data ?? {};
  const title = localized(cms, 'title', lang) || translations.heroTitle;
  const subtitle = localized(cms, 'subtitle', lang) || translations.heroSubtitle;
  const tagline = lang === 'en'
    ? (effectiveExtra?.tagline_en || effectiveExtra?.tagline || 'est. 2024 — thessaloniki')
    : (effectiveExtra?.tagline || 'est. 2024 — thessaloniki');
  const description = localized(cms, 'description', lang);
  const ctaLabel = translations.getStarted;
  const bgImage = cms?.image_url || DEFAULT_HERO_IMAGE;
  const gradient = backgroundCss(cms?.extra_data);

  const cmsLayoutRaw = (effectiveExtra?.hero_layout ?? {}) as any;
  const bounds = (effectiveExtra?.content_bounds ?? {}) as { left?: number; right?: number };
  const merged = deepMerge(cmsLayoutRaw, localLayout ?? {});
  const bpOverride = bp !== 'desktop' ? (merged?.[bp] ?? {}) : {};
  const layout = {
    title: { ...(merged.title ?? {}), ...(bpOverride.title ?? {}) },
    subtitle: { ...(merged.subtitle ?? {}), ...(bpOverride.subtitle ?? {}) },
    tagline: { ...(merged.tagline ?? {}), ...(bpOverride.tagline ?? {}) },
    buttons: {
      primary: { ...(merged.buttons?.primary ?? {}), ...(bpOverride.buttons?.primary ?? {}) },
      secondary: { ...(merged.buttons?.secondary ?? {}), ...(bpOverride.buttons?.secondary ?? {}) },
    },
  } as {
    title: { font?: string; size?: number; x?: number; y?: number; color?: string };
    subtitle: { font?: string; size?: number; x?: number; y?: number; color?: string };
    tagline: { font?: string; size?: number; x?: number; y?: number; color?: string };
    buttons: {
      primary: { x?: number; y?: number; scale?: number };
      secondary: { x?: number; y?: number; scale?: number };
    };
  };

  const onCtaClick = () => {
    setTrialOpen(true);
  };

  return (
    <section id="home" className="relative pt-16 min-h-screen flex items-center">
      <style>{`
        .get-started-btn { background-color: #FFFFFF !important; color: black !important; }
        .get-started-btn:hover { background-color: #e5e5e5 !important; }
        .contact-btn:hover {
          border-color: #aca097 !important;
          color: #aca097 !important;
          background-color: transparent !important;
        }
      `}</style>

      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={gradient ? { background: gradient } : { backgroundImage: `url('${bgImage}')` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>

      <div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        style={{
          paddingLeft: bounds.left != null ? `${bounds.left}px` : undefined,
          paddingRight: bounds.right != null ? `${bounds.right}px` : undefined,
        }}
      >
        <div className="text-left">
          <HeroEditableText
            kind="title"
            font={layout.title?.font}
            size={layout.title?.size}
            pos={{ x: layout.title?.x, y: layout.title?.y }}
            active={active === 'title'}
            onActivate={() => setActive('title')}
            className="mb-2 tracking-wide"
            style={{
              fontFamily: layout.title?.font ? `'${layout.title.font}', sans-serif` : "'Bebas Neue', sans-serif",
              fontSize: layout.title?.size ? `${layout.title.size}px` : undefined,
              color: layout.title?.color ?? '#FFFFFF',
            }}
          >
            <EditableText as="span" sectionKey="hero" field="title" lang={lang} value={title} />
          </HeroEditableText>

          <br />

          <HeroEditableText
            kind="subtitle"
            font={layout.subtitle?.font}
            size={layout.subtitle?.size}
            pos={{ x: layout.subtitle?.x, y: layout.subtitle?.y }}
            active={active === 'subtitle'}
            onActivate={() => setActive('subtitle')}
            className="mb-6 tracking-wide"
            style={{
              fontFamily: layout.subtitle?.font ? `'${layout.subtitle.font}', sans-serif` : "'Bebas Neue', sans-serif",
              fontSize: layout.subtitle?.size ? `${layout.subtitle.size}px` : undefined,
              color: layout.subtitle?.color ?? '#FFFFFF',
            }}
          >
            <EditableText as="span" sectionKey="hero" field="subtitle" lang={lang} value={subtitle} />
          </HeroEditableText>

          <HeroEditableText
            kind="tagline"
            font={layout.tagline?.font}
            size={layout.tagline?.size}
            pos={{ x: layout.tagline?.x, y: layout.tagline?.y }}
            active={active === 'tagline'}
            onActivate={() => setActive('tagline')}
            className="mb-6"
            style={{
              fontFamily: layout.tagline?.font ? `'${layout.tagline.font}', serif` : "'UnifrakturMaguntia', serif",
              fontSize: `${layout.tagline?.size ?? 12}px`,
              color: layout.tagline?.color ?? '#FFFFFF',
              opacity: 0.7,
              textTransform: 'lowercase',
              letterSpacing: '0.2em',
              whiteSpace: 'nowrap',
            }}
          >
            <EditableText as="span" sectionKey="hero" field="tagline" lang={lang} value={tagline} />
          </HeroEditableText>

          {(description || editor) && (
            <EditableText
              as="p"
              sectionKey="hero"
              field="description"
              lang={lang}
              value={description ?? ''}
              className="text-white/90 text-base sm:text-lg mb-6 max-w-2xl"
              multiline
            />
          )}

          <div className="flex flex-wrap gap-4 items-start">
            <HeroDraggableButton
              id="primary"
              pos={layout.buttons?.primary}
              active={active === 'btn-primary'}
              onActivate={() => setActive('btn-primary')}
            >
              <Button
                className="get-started-btn rounded-none transition-colors duration-200"
                onClick={(e) => { if (editor) { e.preventDefault(); return; } onCtaClick(); }}
              >
                {ctaLabel}
              </Button>
            </HeroDraggableButton>

            <HeroDraggableButton
              id="secondary"
              pos={layout.buttons?.secondary}
              active={active === 'btn-secondary'}
              onActivate={() => setActive('btn-secondary')}
            >
              <Button
                variant="outline"
                className="contact-btn rounded-none bg-transparent text-white border-white"
                onClick={(e) => { if (editor) { e.preventDefault(); return; } handleContactClick(); }}
              >
                {translations.contactBtn}
              </Button>
            </HeroDraggableButton>
          </div>
        </div>
      </div>
      <TrialRequestDialog open={trialOpen} onOpenChange={setTrialOpen} />
    </section>
  );
};

export default HeroSection;

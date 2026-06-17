import React, { useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu, Monitor, Tablet, Smartphone, ExternalLink, Palette } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  useLandingSections, useInvalidateLanding, type Lang,
} from '@/hooks/useLandingConfig';
import { SectionsList } from '@/components/landing-cms/SectionsList';
import { SectionEditPanel } from '@/components/landing-cms/SectionEditPanel';
import { LivePreviewFrame, type PreviewDevice } from '@/components/landing-cms/LivePreviewFrame';
import { ThemeEditor } from '@/components/landing-cms/ThemeEditor';

const LandingPageCMSWithSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();

  const [lang, setLang] = useState<Lang>('el');
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [showTheme, setShowTheme] = useState(false);

  const { data: sections = [] } = useLandingSections();
  const invalidate = useInvalidateLanding();

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.display_order - b.display_order),
    [sections],
  );

  const selected = sections.find((s) => s.id === selectedId) ?? null;

  const handleSelectByKey = (key: string) => {
    const s = sections.find((x) => x.section_key === key);
    if (s) setSelectedId(s.id);
  };

  const handleSaved = () => {
    invalidate();
    setReloadToken((n) => n + 1);
  };

  const handleChangeOrder = () => {
    invalidate();
    setReloadToken((n) => n + 1);
  };

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {isMobile && showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileSidebar(false)} />
          <div className="relative w-64 h-full">
            <Sidebar isCollapsed={false} setIsCollapsed={setIsCollapsed} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="border-b border-border bg-background px-3 py-2 flex items-center gap-2 flex-wrap">
          {isMobile && (
            <Button variant="outline" size="sm" className="rounded-none" onClick={() => setShowMobileSidebar(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-base font-semibold mr-2">Landing Page Editor</h1>

          {/* Language switch */}
          <div className="flex border border-border">
            {(['el','en'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1 text-xs ${lang === l ? 'bg-foreground text-background' : 'bg-background'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Device switch */}
          <div className="flex border border-border ml-2">
            <button onClick={() => setDevice('desktop')}
              className={`px-2 py-1 ${device==='desktop' ? 'bg-foreground text-background' : ''}`}>
              <Monitor className="w-4 h-4" />
            </button>
            <button onClick={() => setDevice('tablet')}
              className={`px-2 py-1 ${device==='tablet' ? 'bg-foreground text-background' : ''}`}>
              <Tablet className="w-4 h-4" />
            </button>
            <button onClick={() => setDevice('mobile')}
              className={`px-2 py-1 ${device==='mobile' ? 'bg-foreground text-background' : ''}`}>
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1" />

          <Sheet open={showTheme} onOpenChange={setShowTheme}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-none">
                <Palette className="w-4 h-4 mr-2" />
                {lang === 'en' ? 'Theme' : 'Θέμα'}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[420px] sm:w-[480px] overflow-y-auto rounded-none">
              <ThemeEditor />
            </SheetContent>
          </Sheet>

          <a href="/" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="rounded-none">
              <ExternalLink className="w-4 h-4 mr-2" />
              {lang === 'en' ? 'Open site' : 'Άνοιγμα'}
            </Button>
          </a>
        </div>

        {/* Body: 3 panes */}
        <div className="flex-1 flex min-h-0">
          {/* Left: sections list */}
          <div className="w-60 border-r border-border bg-background overflow-y-auto p-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground px-2 mb-2">
              {lang === 'en' ? 'Sections' : 'Ενότητες'}
            </div>
            <SectionsList
              sections={sortedSections}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={handleChangeOrder}
              lang={lang}
            />
            <p className="text-[11px] text-muted-foreground px-2 mt-3">
              {lang === 'en'
                ? 'Drag to reorder. Click a section in the preview to edit it.'
                : 'Σύρε για αναδιάταξη. Πάτα σε ενότητα στην προεπισκόπηση για επεξεργασία.'}
            </p>
          </div>

          {/* Center: live preview */}
          <div className="flex-1 min-w-0 bg-muted">
            <LivePreviewFrame
              device={device}
              lang={lang}
              reloadToken={reloadToken}
              onSelectSection={handleSelectByKey}
            />
          </div>

          {/* Right: edit panel */}
          <div className="w-[400px] border-l border-border bg-background flex flex-col min-h-0">
            {selected ? (
              <SectionEditPanel section={selected} lang={lang} onSaved={handleSaved} />
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                {lang === 'en'
                  ? 'Click a section in the preview or in the list to start editing.'
                  : 'Πάτα σε μια ενότητα στην προεπισκόπηση ή στη λίστα για να ξεκινήσεις.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageCMSWithSidebar;

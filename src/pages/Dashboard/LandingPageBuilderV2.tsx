import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu, Monitor, Tablet, Smartphone, Save, Globe, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useLandingTree,
  useSaveLandingTree,
  usePublishLandingTree,
  emptyPage,
  newId,
  type Locale,
  type PageNode,
} from '@/hooks/useLandingTree';
import { NodeRenderer } from '@/components/landing-builder/NodeRenderer';
import { toast } from 'sonner';

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: '100%',
  tablet: '820px',
  mobile: '390px',
};

const seedTree = (): PageNode => ({
  id: 'root',
  type: 'page',
  props: {},
  style: { background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' },
  children: [
    {
      id: newId('sec'),
      type: 'section',
      props: { sectionKey: 'hero', htmlId: 'hero' },
      style: {
        padding: '6rem 1.5rem',
        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
        color: '#fff',
        textAlign: 'center',
      },
      children: [
        {
          id: newId('h'),
          type: 'heading',
          props: { level: 1, text: { el: 'Καλώς ήρθες', en: 'Welcome' } },
          style: { fontSize: '3rem', fontWeight: 700, margin: '0 0 1rem' },
          children: [],
        },
        {
          id: newId('t'),
          type: 'text',
          props: { text: { el: 'Άρχισε να χτίζεις τη σελίδα σου', en: 'Start building your page' } },
          style: { fontSize: '1.125rem', opacity: 0.9, margin: '0 0 2rem' },
          children: [],
        },
        {
          id: newId('b'),
          type: 'button',
          props: { text: { el: 'Ξεκίνα', en: 'Get started' }, href: '/auth' },
          style: { background: '#fff', color: '#000' },
          children: [],
        },
      ],
    },
  ],
});

const LandingPageBuilderV2: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();

  const [locale, setLocale] = useState<Locale>('el');
  const [device, setDevice] = useState<Device>('desktop');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data, isLoading } = useLandingTree(locale);
  const [draft, setDraft] = useState<PageNode | null>(null);

  // Sync draft with fetched tree
  React.useEffect(() => {
    if (data?.tree) setDraft(data.tree);
  }, [data?.tree]);

  const save = useSaveLandingTree();
  const publish = usePublishLandingTree();

  const tree = draft ?? data?.tree ?? emptyPage();

  const handleSeed = () => {
    setDraft(seedTree());
    toast.info('Seeded — πάτα Αποθήκευση για να μείνει');
  };

  const handleReset = () => {
    if (data?.tree) setDraft(data.tree);
  };

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {isMobile && showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="relative w-64 h-full">
            <Sidebar isCollapsed={false} setIsCollapsed={setIsCollapsed} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="border-b border-border bg-background px-3 py-2 flex items-center gap-2 flex-wrap">
          {isMobile && (
            <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={() => setShowMobileSidebar(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-base font-semibold mr-2">Landing Builder v2</h1>

          {/* Language */}
          <div className="flex border border-border">
            {(['el', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  locale === l ? 'bg-foreground text-background' : 'bg-background hover:bg-muted'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Device */}
          <div className="flex border border-border ml-2">
            {([
              ['desktop', Monitor],
              ['tablet', Tablet],
              ['mobile', Smartphone],
            ] as const).map(([d, Icon]) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={`px-2 py-1 transition-colors ${
                  device === d ? 'bg-foreground text-background' : 'bg-background hover:bg-muted'
                }`}
                title={d}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={handleSeed}>
            Seed
          </Button>
          <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={handleReset} disabled={!data?.tree}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-none"
            onClick={() => draft && save.mutate({ locale, tree: draft })}
            disabled={!draft || save.isPending}
          >
            <Save className="w-4 h-4 mr-1" />
            {save.isPending ? 'Αποθήκευση...' : 'Αποθήκευση'}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="rounded-none bg-primary text-primary-foreground"
            onClick={() => draft && publish.mutate({ locale, tree: draft })}
            disabled={!draft || publish.isPending}
          >
            <Globe className="w-4 h-4 mr-1" />
            {publish.isPending ? 'Δημοσίευση...' : 'Δημοσίευση'}
          </Button>
        </div>

        {/* Body — Phase 1: canvas only. Layers + Inspector + Library land in Phase 2/3 */}
        <div className="flex-1 flex min-h-0">
          {/* Left rail placeholder (Phase 2: layers tree) */}
          <div className="hidden lg:flex w-56 border-r border-border bg-muted/30 flex-col">
            <div className="p-3 border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              Layers
            </div>
            <div className="p-3 text-xs text-muted-foreground">
              Tree view έρχεται στο Phase 2 — προς το παρόν κάνε κλικ σε στοιχείο στο canvas για να επιλέξεις.
            </div>
            {selectedId && (
              <div className="p-3 text-xs">
                Selected: <code className="bg-background px-1 py-0.5">{selectedId}</code>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 min-w-0 bg-muted/40 overflow-auto p-4 flex items-start justify-center">
            {isLoading ? (
              <div className="text-sm text-muted-foreground p-8">Φόρτωση...</div>
            ) : (
              <div
                className="bg-background shadow-xl transition-all"
                style={{
                  width: DEVICE_WIDTH[device],
                  maxWidth: '100%',
                  minHeight: '80vh',
                }}
                onClick={() => setSelectedId(null)}
              >
                <NodeRenderer
                  node={tree}
                  locale={locale}
                  editorMode
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onSelect={setSelectedId}
                  onHover={setHoveredId}
                  breakpoint={device}
                />
              </div>
            )}
          </div>

          {/* Right rail placeholder (Phase 2: inspector) */}
          <div className="hidden lg:flex w-80 border-l border-border bg-background flex-col">
            <div className="p-3 border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              Inspector
            </div>
            <div className="p-4 text-xs text-muted-foreground space-y-2">
              <p>Edit panel έρχεται στο Phase 2.</p>
              <p>Component library + drag/drop στο Phase 3.</p>
              <p>Style controls + responsive overrides στο Phase 4.</p>
              {selectedId && (
                <div className="mt-4 p-2 bg-muted">
                  <div className="font-semibold mb-1">Selected node</div>
                  <code className="text-[10px] break-all">{selectedId}</code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageBuilderV2;

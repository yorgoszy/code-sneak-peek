import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu, Monitor, Tablet, Smartphone, Save, Globe, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useLandingTree,
  useSaveLandingTree,
  usePublishLandingTree,
  emptyPage,
  newId,
  findNode,
  updateNode,
  removeNode,
  insertNode,
  type Locale,
  type PageNode,
} from '@/hooks/useLandingTree';
import { NodeRenderer } from '@/components/landing-builder/NodeRenderer';
import { LayersPanel } from '@/components/landing-builder/LayersPanel';
import { InspectorPanel } from '@/components/landing-builder/InspectorPanel';
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

// Deep clone with new ids (for duplicate)
const cloneWithNewIds = (n: PageNode): PageNode => ({
  ...n,
  id: newId(n.type.slice(0, 3)),
  children: n.children.map(cloneWithNewIds),
});

// Find parent of node
const findParent = (root: PageNode, id: string): PageNode | null => {
  for (const c of root.children) {
    if (c.id === id) return root;
    const p = findParent(c, id);
    if (p) return p;
  }
  return null;
};

const LandingPageBuilderV2: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();

  const [locale, setLocale] = useState<Locale>('el');
  const [device, setDevice] = useState<Device>('desktop');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data, isLoading } = useLandingTree(locale);

  // History stack: past, present, future
  const [past, setPast] = useState<PageNode[]>([]);
  const [present, setPresent] = useState<PageNode | null>(null);
  const [future, setFuture] = useState<PageNode[]>([]);
  const skipNextSync = useRef(false);

  // Sync from server tree only if no local edits
  useEffect(() => {
    if (data?.tree && present === null) {
      setPresent(data.tree);
    }
  }, [data?.tree, present]);

  // when locale changes, reload from server
  useEffect(() => {
    skipNextSync.current = true;
    setPast([]); setFuture([]); setPresent(null);
  }, [locale]);

  const save = useSaveLandingTree();
  const publish = usePublishLandingTree();

  const tree = present ?? data?.tree ?? emptyPage();

  const commit = useCallback((next: PageNode) => {
    setPast((p) => (present ? [...p, present].slice(-50) : p));
    setFuture([]);
    setPresent(next);
  }, [present]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => (present ? [present, ...f].slice(0, 50) : f));
      setPresent(prev);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => (present ? [...p, present].slice(-50) : p));
      setPresent(next);
      return f.slice(1);
    });
  }, [present]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const handleSeed = () => {
    commit(seedTree());
    toast.info('Seeded — πάτα Αποθήκευση για να μείνει');
  };

  const handleReset = () => {
    if (data?.tree) {
      setPast([]); setFuture([]); setPresent(data.tree);
    }
  };

  const handleNodeChange = useCallback((updater: (n: PageNode) => PageNode) => {
    if (!selectedId) return;
    commit(updateNode(tree, selectedId, updater));
  }, [selectedId, tree, commit]);

  const handleDelete = useCallback((id: string) => {
    if (id === tree.id) return;
    commit(removeNode(tree, id));
    if (selectedId === id) setSelectedId(null);
  }, [tree, commit, selectedId]);

  const handleDuplicate = useCallback((id: string) => {
    const orig = findNode(tree, id);
    const parent = findParent(tree, id);
    if (!orig || !parent) return;
    const copy = cloneWithNewIds(orig);
    const idx = parent.children.findIndex((c) => c.id === id);
    commit(insertNode(tree, parent.id, copy, idx + 1));
    setSelectedId(copy.id);
  }, [tree, commit]);

  const selectedNode = useMemo(
    () => (selectedId ? findNode(tree, selectedId) : null),
    [selectedId, tree],
  );

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

          <div className="flex border border-border ml-2">
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              className="px-2 py-1 hover:bg-muted disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              className="px-2 py-1 hover:bg-muted disabled:opacity-30"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
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
            onClick={() => present && save.mutate({ locale, tree: present })}
            disabled={!present || save.isPending}
          >
            <Save className="w-4 h-4 mr-1" />
            {save.isPending ? 'Αποθήκευση...' : 'Αποθήκευση'}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="rounded-none bg-primary text-primary-foreground"
            onClick={() => present && publish.mutate({ locale, tree: present })}
            disabled={!present || publish.isPending}
          >
            <Globe className="w-4 h-4 mr-1" />
            {publish.isPending ? 'Δημοσίευση...' : 'Δημοσίευση'}
          </Button>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Layers */}
          <div className="hidden lg:flex w-60 border-r border-border bg-muted/30 flex-col">
            <LayersPanel
              root={tree}
              locale={locale}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
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

          {/* Inspector */}
          <div className="hidden lg:flex w-80 border-l border-border bg-background flex-col">
            <InspectorPanel
              node={selectedNode}
              locale={locale}
              onChange={handleNodeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageBuilderV2;

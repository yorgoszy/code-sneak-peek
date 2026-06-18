import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// Schema-driven landing page tree (Phase 1 of full Webflow-style editor)
// ============================================================================

export type NodeType =
  | 'page'
  | 'section'
  | 'container'
  | 'columns'
  | 'column'
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'spacer'
  | 'video'
  | 'icon'
  | 'carousel'
  | 'slide'
  | 'accordion'
  | 'accordion_item'
  | 'tabs'
  | 'tab'
  | 'form'
  | 'input';

export interface LocalizedText {
  el?: string;
  en?: string;
}

export interface NodeStyle {
  // positioning
  position?: 'static' | 'relative' | 'absolute';
  top?: string; left?: string; right?: string; bottom?: string;
  width?: string; height?: string;
  minHeight?: string; maxWidth?: string;
  zIndex?: number;

  // box
  padding?: string;
  margin?: string;
  gap?: string;

  // visual
  background?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string | number;
  lineHeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderRadius?: string;
  border?: string;
  boxShadow?: string;
  opacity?: number;

  // flex
  display?: 'block' | 'flex' | 'grid' | 'inline-block' | 'none';
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: 'wrap' | 'nowrap';
  gridTemplateColumns?: string;

  // responsive overrides
  md?: Partial<Omit<NodeStyle, 'md' | 'sm'>>;
  sm?: Partial<Omit<NodeStyle, 'md' | 'sm'>>;
}

export interface NodeProps {
  // text/heading
  text?: LocalizedText | string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  tag?: string;

  // image / video
  src?: string;
  alt?: LocalizedText | string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;

  // button / link
  href?: string;
  target?: '_self' | '_blank';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';

  // icon
  iconName?: string;

  // carousel
  autoplaySpeed?: number;
  showDots?: boolean;
  showArrows?: boolean;

  // form / input
  inputType?: string;
  placeholder?: LocalizedText | string;
  name?: string;
  required?: boolean;

  // section helpers
  sectionKey?: string;
  htmlId?: string;

  [k: string]: any;
}

export interface PageNode {
  id: string;
  type: NodeType;
  props: NodeProps;
  style: NodeStyle;
  children: PageNode[];
}

export type Locale = 'el' | 'en';

export interface LandingPageTreeRow {
  id: string;
  locale: Locale;
  tree: PageNode;
  published_tree: PageNode | null;
  updated_at: string;
}

// ----- empty tree factory ---------------------------------------------------

export const emptyPage = (): PageNode => ({
  id: 'root',
  type: 'page',
  props: {},
  style: { background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' },
  children: [],
});

// ----- query ----------------------------------------------------------------

export function useLandingTree(locale: Locale = 'el', preferPublished = false) {
  return useQuery({
    queryKey: ['landing-tree', locale, preferPublished],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_tree' as any)
        .select('*')
        .eq('locale', locale)
        .maybeSingle();
      if (error) throw error;
      const row = data as unknown as LandingPageTreeRow | null;
      if (!row) return { tree: emptyPage(), row: null as LandingPageTreeRow | null };
      const tree = preferPublished && row.published_tree ? row.published_tree : row.tree;
      return { tree: tree ?? emptyPage(), row };
    },
    staleTime: 10_000,
  });
}

// ----- mutations ------------------------------------------------------------

export function useSaveLandingTree() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ locale, tree }: { locale: Locale; tree: PageNode }) => {
      const { data: existing } = await supabase
        .from('landing_page_tree' as any)
        .select('id')
        .eq('locale', locale)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('landing_page_tree' as any)
          .update({ tree: tree as any })
          .eq('locale', locale);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('landing_page_tree' as any)
          .insert({ locale, tree: tree as any });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['landing-tree', vars.locale] });
      toast.success('Αποθηκεύτηκε');
    },
    onError: (e: any) => toast.error('Σφάλμα αποθήκευσης: ' + (e?.message ?? String(e))),
  });
}

export function usePublishLandingTree() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ locale, tree }: { locale: Locale; tree: PageNode }) => {
      const { error } = await supabase
        .from('landing_page_tree' as any)
        .update({ tree: tree as any, published_tree: tree as any })
        .eq('locale', locale);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['landing-tree', vars.locale] });
      toast.success('Δημοσιεύτηκε');
    },
    onError: (e: any) => toast.error('Σφάλμα δημοσίευσης: ' + (e?.message ?? String(e))),
  });
}

// ----- tree helpers ---------------------------------------------------------

export function getLocalized(value: LocalizedText | string | undefined, locale: Locale): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] ?? value.el ?? value.en ?? '';
}

export function findNode(root: PageNode, id: string): PageNode | null {
  if (root.id === id) return root;
  for (const c of root.children) {
    const f = findNode(c, id);
    if (f) return f;
  }
  return null;
}

export function updateNode(
  root: PageNode,
  id: string,
  updater: (n: PageNode) => PageNode,
): PageNode {
  if (root.id === id) return updater(root);
  return { ...root, children: root.children.map((c) => updateNode(c, id, updater)) };
}

export function removeNode(root: PageNode, id: string): PageNode {
  return {
    ...root,
    children: root.children
      .filter((c) => c.id !== id)
      .map((c) => removeNode(c, id)),
  };
}

export function insertNode(
  root: PageNode,
  parentId: string,
  node: PageNode,
  index?: number,
): PageNode {
  if (root.id === parentId) {
    const children = [...root.children];
    if (typeof index === 'number') children.splice(index, 0, node);
    else children.push(node);
    return { ...root, children };
  }
  return {
    ...root,
    children: root.children.map((c) => insertNode(c, parentId, node, index)),
  };
}

export function newId(prefix = 'n'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

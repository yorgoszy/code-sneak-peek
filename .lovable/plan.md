# Full Webflow-style Landing Page Editor

Επιλέχθηκε option C. Αυτό είναι πολυβδομαδιαίο έργο — θα χτιστεί σε **5 phases** και κάθε phase θα είναι ξεχωριστό prompt. Δεν μπορώ να κάνω τα πάντα σε ένα call χωρίς να σπάσουν πράγματα. Παρακάτω είναι ο πλήρης χάρτης· θα ξεκινήσω την υλοποίηση από το **Phase 1** σε αυτό το prompt.

---

## Αρχιτεκτονική

**Schema-driven**: Όλη η σελίδα = JSON tree από `nodes`. Ο editor επεξεργάζεται το tree· ο runtime renderer το διαβάζει και φτιάχνει DOM.

```text
LandingPage (root)
├── Section (hero)
│   ├── Container
│   │   ├── Heading
│   │   ├── Text
│   │   └── Button
│   └── Image
└── Section (features)
    └── Carousel
        ├── Slide
        └── Slide
```

### Node schema
```ts
type Node = {
  id: string;
  type: 'section' | 'container' | 'heading' | 'text' | 'image' | 'button'
      | 'carousel' | 'accordion' | 'tabs' | 'video' | 'spacer' | 'columns' | 'icon' | 'form';
  props: { text?, src?, href?, level?, ...componentSpecific };
  style: {
    // free-form
    position?: 'static' | 'absolute';
    top?, left?, right?, bottom?, width?, height?;
    // box
    padding?, margin?, gap?;
    // visual
    background?, color?, fontFamily?, fontSize?, fontWeight?, borderRadius?, boxShadow?;
    // flex
    display?, flexDirection?, justifyContent?, alignItems?;
    // responsive overrides
    md?: Partial<Style>;
    sm?: Partial<Style>;
  };
  children: Node[];
};
```

### DB
```sql
-- New table
landing_page_tree (
  id uuid pk,
  locale text default 'el',          -- 'el' | 'en'
  tree jsonb not null,                -- root node
  published_tree jsonb,               -- last published snapshot
  updated_at timestamptz
)
```
Old `landing_sections` παραμένει για backwards compat, θα γίνει migrate σε Phase 5.

---

## Phase 1 — Foundation (αυτό το prompt)

**Παραδοτέα:**
1. Fix τα 2 bugs που ανέφερες:
   - EN toggle click δουλεύει
   - Theme color save apply στο live preview
2. Νέο schema + DB table `landing_page_tree`
3. `<NodeRenderer>` component — δέχεται node tree και κάνει render σε production
4. Seed: μεταφορά υπάρχοντος Hero/Sections σε αρχικό tree
5. Νέος route `/dashboard/landing-page-v2` με placeholder canvas (read-only render του tree)

**Out of scope σε Phase 1:** drag, layers, edit panel.

---

## Phase 2 — Visual Editor Shell

- 3-pane layout: **Layers (αριστερά) | Canvas (κέντρο) | Inspector (δεξιά)**
- Click node σε canvas → select → highlight outline
- Inspector: edit text/props για selected node
- Layers panel: tree view με expand/collapse, select sync με canvas
- Undo/redo (zundo)
- Save → write tree στο DB, invalidate cache

## Phase 3 — Drag & Drop

- **Component library panel** (4η στήλη ή modal): text, heading, button, image, container, columns, spacer, video, carousel, accordion, tabs, form, icon
- Drag από library → drop σε canvas σε valid position (μέσα σε container)
- Drag υπάρχον node στο layers panel για reorder/reparent
- **Free-form mode toggle**: όταν container έχει `position: relative`, τα children γίνονται draggable με absolute coords + resize handles
- Snap to grid, alignment guides

## Phase 4 — Style System & Responsive

- Inspector tabs: **Content | Style | Layout | Effects**
- Color picker, gradient editor, typography (font/size/weight), spacing (padding/margin visual), borders, shadows
- Breakpoint switcher: Desktop / Tablet / Mobile → εφαρμόζει overrides στο `style.md` / `style.sm`
- Asset picker integration (upload εικόνες από uploader)

## Phase 5 — Components, i18n, Publish

- Πλήρης υλοποίηση όλων των component types στον NodeRenderer (carousel με embla, accordion με shadcn, κτλ)
- i18n: κάθε text node έχει `{ el, en }` strings, ο renderer διαλέγει βάσει `i18n.language`
- Publish button: `tree` → `published_tree`. Public landing διαβάζει published_tree.
- Migration: convert υπάρχον `landing_sections` σε αρχικό tree
- Delete `LandingPageCMSWithSidebar.tsx` (v1), redirect στο v2

---

## Τεχνικές αποφάσεις

- **DnD lib**: `@dnd-kit/core` (ήδη installed) για layers reorder + library drops. Για free-form absolute drag, custom mouse handlers (πιο controllable από dnd-kit για XY).
- **State**: zustand store για editor (selected node id, hovered, tree, history). React Query για persistence.
- **Renderer**: Recursive `<NodeRenderer node={node} editor={boolean} onSelect={fn} />`. Σε editor mode wraps κάθε node με outline + click handler. Σε production mode plain DOM.
- **Style → CSS**: helper `nodeStyleToCss(style, breakpoint)` που merges base + responsive override.
- **Performance**: tree μπορεί να γίνει βαρύ — memoize NodeRenderer per node.id, virtualize layers panel αν >100 nodes.

---

## Εκτίμηση credits / risk

| Phase | Πολυπλοκότητα | Πιθανότητα να δουλέψει 1ο try |
|---|---|---|
| 1 | Μέτρια | Υψηλή |
| 2 | Υψηλή | Μέτρια |
| 3 | **Πολύ υψηλή** | Χαμηλή (θα χρειαστούν 2-3 iterations) |
| 4 | Υψηλή | Μέτρια |
| 5 | Μέτρια | Υψηλή |

**Σύνολο: ~10-15 prompts** μέχρι σταθερό state. Free-form drag (Phase 3) είναι το πιο επικίνδυνο κομμάτι.

Πάμε με Phase 1 τώρα;

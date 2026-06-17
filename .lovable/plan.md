# Landing Page Visual Editor + i18n

## Στόχος
Μετατροπή του `/dashboard/landing-page` από form-based CMS σε **visual live editor** όπου ο admin βλέπει το πραγματικό landing page και κάνει αλλαγές κατευθείαν πάνω του (click-to-edit, drag-to-reorder, inline panels).

---

## 1. Διγλωσσία (EL/EN) στο CMS

- Προσθήκη `title_en`, `subtitle_en`, `description_en`, `cta_label_en` στο `landing_sections` (migration).
- `extra_data` ήδη JSONB → προσθέτουμε κλειδιά `*_en` παράλληλα (π.χ. `menu_items[].label_en`).
- Toggle EL/EN στο πάνω μέρος του editor → αλλάζει ποιο πεδίο επεξεργάζεται.
- Frontend (`HeroSection` κ.λπ.) διαβάζει βάσει `i18n.language` με fallback στο ελληνικό.

## 2. Visual Live Editor (`/dashboard/landing-page`)

### Layout
```text
+----------------------------------------------------------+
| Top bar: [EL|EN] [Desktop|Tablet|Mobile] [Save] [Publish]|
+--------------------+-------------------------------------+
| Sections panel     |                                     |
| (drag to reorder)  |     LIVE PREVIEW (iframe of /)      |
| ☰ Hero       👁    |     - click element → edit panel    |
| ☰ Programs   👁    |     - hover → blue outline          |
| ☰ About      👁    |     - selected → green outline      |
| ☰ ...              |                                     |
+--------------------+-------------------------------------+
                     | Right edit panel (when selected):   |
                     | Text / Image / Color / Gradient /   |
                     | Font / CTA url / Visibility         |
```

### Πώς δουλεύει το click-to-edit
- Live preview = `<iframe src="/?editor=1">`.
- Στο `Index.tsx`, όταν `?editor=1` → φορτώνει `EditorOverlay` που τυλίγει κάθε section με `data-section-key`.
- Hover → outline· click → `postMessage({type:'select', key})` στο parent (CMS page).
- Parent ανοίγει το `SectionEditPanel` με τα σωστά πεδία (text/image/cta/colors/gradient).
- Κάθε αλλαγή → optimistic update στη βάση + `postMessage({type:'refresh'})` ώστε το iframe να ξαναφέρει τα δεδομένα (χωρίς full reload, μέσω React Query invalidate).

### Drag & drop
- Στο αριστερό panel (sections list) με `@dnd-kit/sortable` → ενημερώνει `display_order`.
- Toggle visibility (`is_visible`) με icon.

### Edit panel — διαθέσιμα controls ανά section
- **Text fields** (title/subtitle/description/cta) με EL/EN tabs.
- **Image** uploader (υπάρχει `LandingImageUploader`).
- **Background**: solid color picker **ή** gradient builder (2 stops + angle) → αποθηκεύεται σε `extra_data.background` ως `{type:'solid'|'gradient', ...}`.
- **Logo** (μόνο navigation/footer): image uploader στο `extra_data.logo_url`.
- **CTA**: label + url.
- **Font override** ανά section (προαιρετικό, στο `extra_data.font`).

### Theme tab (παραμένει)
Global colors + Google Fonts όπως ήδη υπάρχει, με προσθήκη global gradient preset.

---

## Tech notes
- Νέα αρχεία:
  - `src/pages/Dashboard/LandingPageCMSWithSidebar.tsx` (rewrite σε visual layout).
  - `src/components/landing-cms/LivePreviewFrame.tsx` (iframe + postMessage bridge).
  - `src/components/landing-cms/SectionsList.tsx` (dnd-kit list).
  - `src/components/landing-cms/SectionEditPanel.tsx` (dynamic form ανά section_key).
  - `src/components/landing-cms/GradientPicker.tsx`.
  - `src/components/landing/EditorOverlay.tsx` (τρέχει μόνο όταν `?editor=1`).
- Migration: ALTER TABLE `landing_sections` ADD COLUMNS EN.
- Dependency: `@dnd-kit/core` + `@dnd-kit/sortable` (αν δεν υπάρχει ήδη).
- i18n: χρήση υπάρχουσας `src/i18n/config.ts`· νέο namespace `landingCms`.

## Εκτός scope (για επόμενο βήμα)
- Full free-form drag των elements μέσα στο section (Webflow-style). Εδώ κάνουμε **structured editing**: κάθε section έχει συγκεκριμένα editable spots, drag μόνο για ordering των sections. Αυτό κρατά το frontend καθαρό και responsive.

---

## Ερώτηση πριν προχωρήσω
Συμφωνείς με **structured visual editor** (click element → edit panel, drag για reorder sections), ή θέλεις **free-form Webflow-style** όπου σέρνεις οτιδήποτε οπουδήποτε; Το δεύτερο είναι 5-10× μεγαλύτερη δουλειά και σπάει το responsive design.

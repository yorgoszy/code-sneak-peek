## Στόχος
Νέο menu **"Landing Page"** στο admin sidebar που επιτρέπει πλήρες CMS για κάθε section της landing (Hero, Programs, About, Live Matches, Results, Video Gallery, Certificates, Blog, Gift Card, Contact, Footer, Navigation): κείμενα, εικόνες, χρώματα, γραμματοσειρά, ορατότητα και σειρά.

## 1. Database (νέο schema)

Νέοι πίνακες:

**`landing_page_config`** (singleton row για global theme)
- `id` (uuid, default singleton)
- `primary_color`, `accent_color`, `bg_color`, `text_color` (text - hex)
- `heading_font`, `body_font` (text - Google Font name)
- `updated_at`

**`landing_sections`** (μία γραμμή ανά section)
- `id` (uuid)
- `section_key` (text unique: 'hero', 'programs', 'about', 'live_matches', 'results', 'video_gallery', 'certificates', 'blog', 'gift_card', 'contact', 'footer', 'navigation')
- `display_order` (int) — σειρά εμφάνισης
- `is_visible` (boolean) — on/off
- `title`, `subtitle`, `description` (text)
- `cta_label`, `cta_url` (text)
- `image_url` (text) — κύρια εικόνα (π.χ. hero background)
- `bg_color`, `text_color` (text, nullable — overrides global)
- `extra_data` (jsonb) — extra πεδία ανά section (badges, items, social links, secondary images, footer columns κλπ.)
- `updated_at`

**RLS**: read = public (anon + authenticated). write = admin only μέσω `has_role(auth.uid(),'admin')`.

**Storage bucket** `landing-images` (public) για uploads εικόνων.

**Seed**: pre-populate και τους 12 sections με τα τρέχοντα default κείμενα/εικόνες.

## 2. Admin UI

Νέο menu item **"Landing Page"** (icon: `LayoutTemplate`) στο `AdminSidebar` πριν από τα settings.

Σελίδα `/dashboard/landing-page` (`LandingPageCMSWithSidebar.tsx`) με:

- **Tab 1: Theme** — color pickers (primary/accent/bg/text), Google Font dropdown (~15 επιλογές: Roboto, Inter, Montserrat, Poppins, Lato, Open Sans, Raleway, Playfair Display, Oswald, Bebas Neue, Robert Pro κλπ.) για heading & body, live preview.
- **Tab 2: Sections** — accordion λίστα με drag-and-drop reorder, toggle visibility, και ανά section editor:
  - Πεδία title/subtitle/description (textareas)
  - CTA label + url
  - Image upload (στο `landing-images` bucket) με preview
  - Section-specific extra πεδία (μέσω `extra_data` jsonb form), π.χ.:
    - Contact: phone, email, address, social links
    - Footer: columns με links
    - About: bullet points
    - Certificates: λίστα εικόνων

Κάθε αλλαγή κάνει upsert στη `landing_sections` / `landing_page_config`.

## 3. Frontend integration

- Νέο hook `useLandingConfig()` που φορτώνει theme + όλα τα sections (cached με React Query).
- `LandingThemeProvider` που:
  - Φορτώνει δυναμικά το Google Font (link tag στο `<head>`)
  - Εφαρμόζει CSS variables (`--landing-primary`, `--landing-accent`, `--landing-bg`, `--landing-text`, `--font-heading`, `--font-body`) στο root του Index page.
- Κάθε section component (`HeroSection`, `AboutSection`, κλπ.) παίρνει props ή διαβάζει από context τα title/subtitle/description/image_url/extra_data αντί για hardcoded.
- `Index.tsx` mapping: render μόνο sections με `is_visible=true`, ταξινομημένα κατά `display_order`, μέσω registry `{ hero: HeroSection, programs: ProgramsSection, ... }`.
- Fallback σε υπάρχοντα defaults αν λείπει κάτι από DB.

## 4. Σειρά υλοποίησης

1. Migration: tables + RLS + grants + storage bucket + seed.
2. `useLandingConfig` hook + `LandingThemeProvider`.
3. Refactor κάθε landing section ώστε να δέχεται data από config (12 αρχεία).
4. `Index.tsx` δυναμικό rendering.
5. Admin σελίδα `LandingPageCMSWithSidebar.tsx` με tabs Theme + Sections.
6. Προσθήκη menu item στο `AdminSidebar` + route στο `App.tsx`.

## Τεχνικές σημειώσεις

- Google Fonts loader: δυναμικά inject `<link href="https://fonts.googleapis.com/css2?family=...">` στο `<head>` και CSS vars για font-family.
- Image upload: `supabase.storage.from('landing-images').upload(...)`, παίρνουμε public URL, αποθηκεύουμε στο `image_url`.
- Drag-and-drop: `@dnd-kit/core` (ήδη στο project ή install).
- Όλα τα κουμπιά `rounded-none` σύμφωνα με το project style guide.
- Sidebar pattern (mobile/desktop) ακολουθεί το υπάρχον responsive layout standard.

## Εκτός scope (μπορούμε σε επόμενο γύρο)
- Versioning / preview-before-publish.
- Multi-language (Ελληνικά/Αγγλικά) — προς το παρόν ένα set κειμένων.
- WYSIWYG rich text editor (χρησιμοποιούμε plain textareas + Markdown support).
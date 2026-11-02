# Architecture rules

- Coach booking appointments use a dedicated weekly section view derived from persisted section hours and appointments; day/section selection feeds the existing attendee list and cancellation controls without changing booking writes.

- Coach Online Booking and today's overview classes share a paginated coach-scoped appointment loader; the summary counts unique attendees for today's gym bookings, excludes cancelled/missed bookings, and retains completed attendance so the daily roster remains accurate.

- User deletion uses one admin-checked transactional cleanup RPC followed by verified Auth deletion; failed Auth removal remains retryable in the confirmation dialog and never reports success.

- BlueDatePicker accepts typed dd/MM/yyyy dates and calendar selection while preserving yyyy-MM-dd values for existing forms; invalid text blocks form submission through native validity.

- Section cards render a read-only schedule preview from persisted available_hours, displaying only configured time rows; editing stays in the existing selector to avoid accidental schedule changes.

- Coach Online Booking uses multiple gym_visit coach-owned booking_sections and persisted appointment coach_id; scoped BookingSectionsManagement is shared with global sections, which filter coach_id null. Database validation enforces app_users.coach_id, private aggregate functions expose occupancy without user details, and coach subscriptions count persisted appointments rather than global packages. Global videocalls remain separate.

- Global subscription types store an optional assigned_role; protected database triggers validate admin configuration and grant paid active subscriptions through user_roles, with app_users.role mirrored for existing dashboard compatibility. Role activation never deletes owned data or downgrades a higher plan.

- Section calendars query persisted bookings and explicitly section-attributed manual visits for the viewed user and week; historical slots remain visible outside current opening hours. Manual attendance uses an RLS-respecting atomic section/package RPC, and legacy unattributed visits are never assigned using current user settings.

- Gym booking section restrictions are validated on booking and waiting-list writes; linked visit packages resolve sections from their source subscription type. The profile uses one unified Live Program-style time/day matrix within the viewed user's coach scope; day clicks open a shared schedule dialog independent of subscription access, while section slots check booking availability separately. Persisted bookings and attributed visits remain visible, so visibility never grants booking access.

- Notification profile links resolve the recipient user ID independently of optional bookings and payment/offer row IDs; gym confirmations and package emails do not require a videocall booking.
- Visit decrement uses a package-ID-scoped, RLS-respecting atomic RPC; legacy history is matched by purchase window and excludes booking rows, so counter restoration cannot partially commit or affect another package.

- Club upgrades reuse the ThaiHub additions catalog and a dedicated authenticated Stripe endpoint; only verified paid sessions or signed webhooks call the service-only atomic activation, preserving account identity and source expiry. Pending orders and Stripe idempotency keys prevent duplicate checkout/conversion; existing subscription checkout remains separate.
- Upgrade quotes, checkout and return verification share the viewed account ID, accessible only to its owner or a server-verified admin; server quotes supply the displayed amount so admin previews never charge or convert the wrong account.

- Bar Velocity live tracking samples a user-selected target and follows a nearby connected color patch; losing the target stops the attempt rather than switching to a global color centroid.

- Brand landing pages have separate public routes and hostname selection at the root; admin preview links retain the landing page for signed-in users so each brand can be designed independently.
- ThaiHub landing copy uses its own bilingual dictionary and persisted language choice, isolated from dashboard translations; a shared plan catalog defines cumulative package features and display prices, while enquiry links remain email-based until checkout is configured to avoid implying active billing or access enforcement.

- Coach fiscal settings live separately from editable coach profiles and are admin-managed through RLS; AADE credentials stay in per-coach server-only project secrets, and issuance remains disabled until a server verifies the connection.

- Coach annual planning reuses AnnualPlanning with an explicit coach scope, both embedded in profiles and inside CoachLayout; user queries, assigned phases, and group recipients share that scope to avoid mixing coaches.
- Saved macrocycles store coach ownership and enforce it through RLS; coach-scoped views filter that ownership and saves use the viewed coach so admin-created coach plans remain isolated.

- Fight-view dialogs reuse `useFightStats` and `FightTimelineChart` from the analysis overview so metrics and round charts share the same source and corner mapping.
- Editor statistics derive from the editable strike markers and remain visible without video playback, so saved analysis and subsequent corrections use the same data.
- Coach profile and dashboard overviews reuse `CoachOverview`; creation shortcuts pass a one-shot `action=create` parameter to existing coach pages while preserving `coachId`, so forms retain their existing save and access rules.
- Coach overview counts use coach-scoped queries, exact counts for active records and paginated identifier unions for tested users, so totals never truncate at PostgREST's row limit and each tested user counts once.
- Club profiles redirect to the shared coach dashboard with their user ID; overview filtering resolves the viewed owner's role (including admin previews), and Club navigation uses a shared exact-path allowlist. Club Online Booking reuses the coach page; dedicated gym-only ownership policies allow own sections and appointments without extending videocall permissions. `is_coach_safe` and CoachContext reuse coach ownership infrastructure for Club users.
- Auth: same-user SIGNED_IN/TOKEN_REFRESHED on tab return must not reset session or show loading; no refetch on window focus (it made pages appear to reload).
- ThaiHub landing plan purchases require a signed-in account and server-priced Stripe checkout; verified payments use service-only atomic activation to resolve the global subscription type by assigned_role and reuse its protected role trigger, keeping the purchased plan, user_roles and Users tabs consistent without overwriting existing privileged accounts.

- PWA updates: vite-plugin-pwa uses registerType autoUpdate with skipWaiting/clientsClaim; main.tsx checks registration.update() on every entry and reloads once only within 30s of page load when a new SW takes control — never reload mid-session (protects unsaved work). SW registration stays blocked on preview/iframe hosts.

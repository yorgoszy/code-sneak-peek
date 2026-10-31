# Architecture rules

- Gym booking section restrictions are validated on booking and waiting-list writes; linked visit packages resolve sections from their source subscription type, and UI filtering reacts to late availability so saved restrictions cannot be bypassed.

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
- Club profiles redirect to the shared coach dashboard with their user ID; overview filtering resolves the viewed owner's role (including admin previews), and Club navigation uses a shared exact-path allowlist so the same limited options stay consistent. `is_coach_safe` and CoachContext reuse coach ownership infrastructure for Club users.
- Auth: same-user SIGNED_IN/TOKEN_REFRESHED on tab return must not reset session or show loading; no refetch on window focus (it made pages appear to reload).
- ThaiHub landing plan purchases require a signed-in account, then a server-priced Stripe checkout; only a verified paid session or signed webhook calls the service-only activation, which assigns the plan role to plain users only so existing roles are never overwritten.

# Architecture rules

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

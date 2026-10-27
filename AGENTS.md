# Architecture rules

- Coach annual planning reuses AnnualPlanning with an explicit coach scope, both embedded in profiles and inside CoachLayout; user queries, assigned phases, and group recipients share that scope to avoid mixing coaches.
- Saved macrocycles store coach ownership and enforce it through RLS; coach-scoped views filter that ownership and saves use the viewed coach so admin-created coach plans remain isolated.

- Fight-view dialogs reuse `useFightStats` and `FightTimelineChart` from the analysis overview so metrics and round charts share the same source and corner mapping.
- Editor statistics derive from the editable strike markers and remain visible without video playback, so saved analysis and subsequent corrections use the same data.
- Coach profile and dashboard overviews reuse `CoachOverview`; creation shortcuts pass a one-shot `action=create` parameter to existing coach pages while preserving `coachId`, so forms retain their existing save and access rules.
- Coach overview counts use coach-scoped queries, exact counts for active records and paginated identifier unions for tested users, so totals never truncate at PostgREST's row limit and each tested user counts once.
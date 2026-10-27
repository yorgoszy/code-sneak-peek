# Architecture rules

- Fight-view dialogs reuse `useFightStats` and `FightTimelineChart` from the analysis overview so metrics and round charts share the same source and corner mapping.
- Editor statistics derive from the editable strike markers and remain visible without video playback, so saved analysis and subsequent corrections use the same data.
- Coach profile and dashboard overviews reuse `CoachOverview`; creation shortcuts pass a one-shot `action=create` parameter to existing coach pages while preserving `coachId`, so forms retain their existing save and access rules.
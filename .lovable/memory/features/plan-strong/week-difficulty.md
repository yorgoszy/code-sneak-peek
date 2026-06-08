---
name: Plan Strong Week Difficulty
description: Week difficulty labels derived from MAIN VARIANT %1RM and persisted in plan_strong_drafts.data.weekDifficulties
type: feature
---
MAIN VARIANT %1RM → label mapping (±3 tolerance):
- 15% → Light (blue header)
- 22% → Medium (green header)
- 28% → Heavy (yellow header)
- 35% → Very Heavy (red header)

Helpers exported from `src/pages/PlanStrong/planStrongCalc.ts`:
- `getWeekDifficulty(frac)` → 'Light'|'Medium'|'Heavy'|'Very Heavy'|null
- `computeWeekDifficulties(mainPct[])` → array of labels

Persisted on save in `plan_strong_drafts.data.weekDifficulties` (array of 4) so it can be consumed from athlete profile, AI chat, and other modules without recomputing.

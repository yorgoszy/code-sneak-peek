// Module-level ref to track the currently active preview user (tab) inside
// the program builder. Used by useExerciseActions so add/remove/update/duplicate
// operations on a warm-up block with per-user exercises can target only the
// active user's list.

let currentUserId: string | null = null;

export const setActivePreviewUser = (id: string | null) => {
  currentUserId = id;
};

export const getActivePreviewUser = (): string | null => currentUserId;

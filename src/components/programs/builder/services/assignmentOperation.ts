/** One in-flight builder operation; acquire synchronously before any network work. */
export const createAssignmentOperation = () => {
  let busy = false;
  return {
    acquire() {
      if (busy) return false;
      busy = true;
      return true;
    },
    release() { busy = false; },
    get busy() { return busy; }
  };
};

export const assignedProgramCopy = (program: any, userId: string, weeks: any[]) => ({
  ...program,
  id: undefined,
  user_id: userId,
  user_ids: [userId],
  weeks,
  status: 'active',
  is_template: false,
  is_sellable: false,
  deferBuilderRefresh: true,
});

/** Personalized assigned copies belong in active programs, not the draft library. */
export const isProgramLibraryEntry = (program: { status?: string; user_id?: string | null; is_template?: boolean }) =>
  !(program.status === 'active' && program.user_id && !program.is_template);
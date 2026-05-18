/**
 * For multi-athlete warm-up blocks, swap program_exercises with the user-specific
 * list (program_exercises_by_user[userId]) before saving the program for that user.
 * Also strips the program_exercises_by_user field so it doesn't leak into DB writes.
 */
export const applyUserWarmUps = (weeks: any[], userId: string): any[] => {
  return (weeks || []).map(week => ({
    ...week,
    program_days: (week.program_days || []).map((day: any) => ({
      ...day,
      program_blocks: (day.program_blocks || []).map((block: any) => {
        const { program_exercises_by_user, ...rest } = block;
        if (
          block.training_type === 'warm up' &&
          program_exercises_by_user &&
          program_exercises_by_user[userId]
        ) {
          return { ...rest, program_exercises: program_exercises_by_user[userId] };
        }
        return rest;
      })
    }))
  }));
};

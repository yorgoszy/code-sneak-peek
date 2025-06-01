
import type { EnrichedAssignment } from "./types";

export const isValidAssignment = (assignment: EnrichedAssignment): boolean => {
  // Check if assignment has enriched program data
  if (!('programs' in assignment) || !assignment.programs) {
    console.log('❌ Assignment without valid program:', assignment?.id);
    return false;
  }
  
  // If no dates are set, include the assignment
  if (!assignment.start_date || !assignment.end_date) {
    console.log('✅ Including assignment without dates:', assignment.id);
    return true;
  }
  
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const startDate = new Date(assignment.start_date);
  const endDate = new Date(assignment.end_date);
  
  // Program is active if:
  // 1. It has started and not ended (active)
  // 2. It starts within the next week (coming soon)
  const isActive = startDate <= today && endDate >= today;
  const isComingSoon = startDate > today && startDate <= nextWeek;
  
  console.log('📊 Date check for assignment:', assignment.id, {
    startDate: assignment.start_date,
    endDate: assignment.end_date,
    isActive,
    isComingSoon,
    willInclude: isActive || isComingSoon
  });
  
  return isActive || isComingSoon;
};

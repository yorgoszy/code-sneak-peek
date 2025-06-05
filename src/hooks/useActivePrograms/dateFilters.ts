
import type { EnrichedAssignment } from "./types";

export const isValidAssignment = (assignment: EnrichedAssignment): boolean => {
  console.log('🔍 Validating assignment:', assignment.id);
  console.log('📅 Assignment dates check:', {
    id: assignment.id,
    start_date: assignment.start_date,
    end_date: assignment.end_date,
    training_dates: assignment.training_dates,
    training_dates_length: assignment.training_dates?.length || 0
  });

  // Check if assignment has enriched program data
  if (!('programs' in assignment) || !assignment.programs) {
    console.log('❌ Assignment without valid program:', assignment?.id);
    return false;
  }
  
  // Χρησιμοποιούμε το training_dates array αντί για start_date/end_date
  if (!assignment.training_dates || assignment.training_dates.length === 0) {
    console.log('⚠️ Assignment without training dates:', assignment.id);
    return false;
  }
  
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  // Βρίσκουμε την πρώτη και τελευταία ημερομηνία από το training_dates array
  const trainingDates = assignment.training_dates.map(date => new Date(date)).sort((a, b) => a.getTime() - b.getTime());
  const firstTrainingDate = trainingDates[0];
  const lastTrainingDate = trainingDates[trainingDates.length - 1];
  
  console.log('📊 Date comparison for assignment:', assignment.id, {
    today: today.toISOString().split('T')[0],
    nextWeek: nextWeek.toISOString().split('T')[0],
    firstTrainingDate: firstTrainingDate.toISOString().split('T')[0],
    lastTrainingDate: lastTrainingDate.toISOString().split('T')[0],
    totalTrainingDates: trainingDates.length
  });
  
  // Program is active if:
  // 1. It has started and not ended (active)
  // 2. It starts within the next week (coming soon)
  const isActive = firstTrainingDate <= today && lastTrainingDate >= today;
  const isComingSoon = firstTrainingDate > today && firstTrainingDate <= nextWeek;
  
  console.log('📊 Date validation result for assignment:', assignment.id, {
    isActive,
    isComingSoon,
    willInclude: isActive || isComingSoon
  });
  
  return isActive || isComingSoon;
};

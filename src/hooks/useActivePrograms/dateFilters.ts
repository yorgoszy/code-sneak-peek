
import { formatDateToLocalString } from "@/utils/dateUtils";
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
  const todayString = formatDateToLocalString(today);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekString = formatDateToLocalString(nextWeek);
  
  // Βρίσκουμε την πρώτη και τελευταία ημερομηνία από το training_dates array
  const trainingDates = assignment.training_dates.sort();
  const firstTrainingDate = trainingDates[0];
  const lastTrainingDate = trainingDates[trainingDates.length - 1];
  
  console.log('📊 Date comparison for assignment:', assignment.id, {
    todayString,
    nextWeekString,
    firstTrainingDate,
    lastTrainingDate,
    totalTrainingDates: trainingDates.length
  });
  
  // Υπολογισμός ημερομηνίας μία εβδομάδα μετά την τελευταία προπόνηση
  const lastTrainingDateObj = new Date(lastTrainingDate);
  const oneWeekAfterEnd = new Date(lastTrainingDateObj);
  oneWeekAfterEnd.setDate(oneWeekAfterEnd.getDate() + 7);
  const oneWeekAfterEndString = formatDateToLocalString(oneWeekAfterEnd);
  
  // Program is active if:
  // 1. It has started and not ended (active)
  // 2. It starts within the next week (coming soon)
  // 3. It completed within the last week (recently completed)
  const isActive = firstTrainingDate <= todayString && lastTrainingDate >= todayString;
  const isComingSoon = firstTrainingDate > todayString && firstTrainingDate <= nextWeekString;
  const isRecentlyCompleted = lastTrainingDate < todayString && oneWeekAfterEndString >= todayString;
  
  console.log('📊 Date validation result for assignment:', assignment.id, {
    isActive,
    isComingSoon,
    isRecentlyCompleted,
    willInclude: isActive || isComingSoon || isRecentlyCompleted
  });
  
  return isActive || isComingSoon || isRecentlyCompleted;
};

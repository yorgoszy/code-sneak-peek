
import { supabase } from "@/integrations/supabase/client";

export const calculateWeekAndDay = async (
  assignmentId: string,
  scheduledDate: string
): Promise<{ weekNumber: number; dayNumber: number; programId: string }> => {
  // Παίρνουμε το assignment και τα training_dates για να υπολογίσουμε το σωστό week/day number
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('program_assignments')
    .select('program_id, training_dates')
    .eq('id', assignmentId)
    .single();

  if (assignmentError) {
    console.error('❌ Error fetching assignment:', assignmentError);
    throw assignmentError;
  }

  if (!assignmentData?.program_id) {
    throw new Error('No program_id found for assignment');
  }

  // Υπολογίζουμε το week_number και day_number βάσει της θέσης της ημερομηνίας στο training_dates array
  const trainingDates = assignmentData.training_dates || [];
  const dateIndex = trainingDates.findIndex((date: string) => date === scheduledDate);
  
  console.log('📅 Training dates:', trainingDates);
  console.log('📍 Date index for', scheduledDate, ':', dateIndex);

  let weekNumber = 1;
  let dayNumber = 1;

  if (dateIndex >= 0) {
    // Παίρνουμε τη δομή του προγράμματος για να υπολογίσουμε σωστά
    const { data: programData, error: programError } = await supabase
      .from('programs')
      .select(`
        program_weeks (
          week_number,
          program_days (
            day_number
          )
        )
      `)
      .eq('id', assignmentData.program_id)
      .single();

    if (!programError && programData?.program_weeks?.[0]?.program_days) {
      const daysPerWeek = programData.program_weeks[0].program_days.length;
      weekNumber = Math.floor(dateIndex / daysPerWeek) + 1;
      dayNumber = (dateIndex % daysPerWeek) + 1;
    }
  }

  console.log('📊 Calculated week/day:', { weekNumber, dayNumber });

  return {
    weekNumber,
    dayNumber,
    programId: assignmentData.program_id
  };
};

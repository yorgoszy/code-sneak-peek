
import { supabase } from '@/integrations/supabase/client';
import { formatDateToLocalString } from '@/utils/dateUtils';

export const assignmentService = {
  async saveAssignment(assignmentData: any) {
    try {
      console.log('💾 Assignment Service - Saving assignment:', assignmentData);

      // Διασφαλίζουμε ότι οι ημερομηνίες είναι σε σωστό format χωρίς timezone conversion
      let formattedTrainingDates: string[] = [];
      
      if (assignmentData.trainingDates && Array.isArray(assignmentData.trainingDates)) {
        formattedTrainingDates = assignmentData.trainingDates.map((date: Date | string) => {
          if (typeof date === 'string') {
            // Αν είναι ήδη string, διασφαλίζουμε ότι είναι σε σωστό format
            if (date.includes('T')) {
              // Αν έχει timestamp, παίρνουμε μόνο το date part
              return date.split('T')[0];
            }
            return date;
          }
          // Αν είναι Date object, χρησιμοποιούμε την utility function
          return formatDateToLocalString(date);
        });
      }

      console.log('📅 Assignment Service - Original dates:', assignmentData.trainingDates);
      console.log('📅 Assignment Service - Formatted dates:', formattedTrainingDates);

      // Βρίσκουμε την πρώτη και τελευταία ημερομηνία
      const sortedDates = [...formattedTrainingDates].sort();
      const startDate = sortedDates[0] || formatDateToLocalString(new Date());
      const endDate = sortedDates[sortedDates.length - 1] || startDate;

      console.log('📊 Assignment Service - Date range:', { startDate, endDate });

      // Αποθήκευση στη βάση δεδομένων
      const { data, error } = await supabase
        .from('program_assignments')
        .insert([{
          program_id: assignmentData.program.id,
          user_id: assignmentData.userId,
          training_dates: formattedTrainingDates,
          status: 'active',
          assignment_type: 'individual',
          start_date: startDate,
          end_date: endDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('❌ Assignment Service - Error saving assignment:', error);
        throw error;
      }

      console.log('✅ Assignment Service - Assignment saved successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Assignment Service - Unexpected error:', error);
      throw error;
    }
  }
};

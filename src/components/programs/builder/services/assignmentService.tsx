
import { supabase } from '@/integrations/supabase/client';
import { formatDateToLocalString } from '@/utils/dateUtils';

export const assignmentService = {
  async saveAssignment(assignmentData: any) {
    try {
      console.log('💾 [AssignmentService] Starting saveAssignment with data:', assignmentData);

      // Διασφαλίζουμε ότι οι ημερομηνίες είναι σε σωστό format χωρίς timezone conversion
      let formattedTrainingDates: string[] = [];
      
      if (assignmentData.trainingDates && Array.isArray(assignmentData.trainingDates)) {
        console.log('💾 [AssignmentService] Processing training dates:', assignmentData.trainingDates);
        
        formattedTrainingDates = assignmentData.trainingDates.map((date: Date | string, index: number) => {
          console.log(`💾 [AssignmentService] Processing date ${index}:`, {
            originalValue: date,
            type: typeof date,
            isString: typeof date === 'string',
            isDate: date instanceof Date
          });
          
          if (typeof date === 'string') {
            // Αν είναι ήδη string, διασφαλίζουμε ότι είναι σε σωστό format
            if (date.includes('T')) {
              // Αν έχει timestamp, παίρνουμε μόνο το date part
              const dateOnly = date.split('T')[0];
              console.log(`💾 [AssignmentService] String with timestamp converted: ${date} → ${dateOnly}`);
              return dateOnly;
            }
            console.log(`💾 [AssignmentService] String date kept as is: ${date}`);
            return date;
          }
          // Αν είναι Date object, χρησιμοποιούμε την utility function
          const formatted = formatDateToLocalString(date);
          console.log(`💾 [AssignmentService] Date object converted: ${date} → ${formatted}`, {
            dateFullYear: date.getFullYear(),
            dateMonth: date.getMonth(),
            dateDate: date.getDate(),
            dateTimezoneOffset: date.getTimezoneOffset()
          });
          return formatted;
        });
      }

      console.log('💾 [AssignmentService] Final formatted dates:', formattedTrainingDates);

      // Βρίσκουμε την πρώτη και τελευταία ημερομηνία
      const sortedDates = [...formattedTrainingDates].sort();
      const startDate = sortedDates[0] || formatDateToLocalString(new Date());
      const endDate = sortedDates[sortedDates.length - 1] || startDate;

      console.log('💾 [AssignmentService] Date range calculated:', { 
        startDate, 
        endDate,
        sortedDates 
      });

      const insertData = {
        program_id: assignmentData.program.id,
        user_id: assignmentData.userId,
        training_dates: formattedTrainingDates,
        status: 'active',
        assignment_type: 'individual',
        start_date: startDate,
        end_date: endDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 [AssignmentService] Data to insert into database:', insertData);

      // Αποθήκευση στη βάση δεδομένων
      const { data, error } = await supabase
        .from('program_assignments')
        .insert([insertData])
        .select();

      if (error) {
        console.error('❌ [AssignmentService] Database error:', error);
        throw error;
      }

      console.log('✅ [AssignmentService] Assignment saved successfully. Database returned:', data);
      
      // Επαληθεύουμε τα δεδομένα που αποθηκεύτηκαν
      if (data && data[0] && data[0].training_dates) {
        console.log('✅ [AssignmentService] Verification - dates as stored in database:', data[0].training_dates);
      }

      return data;
    } catch (error) {
      console.error('❌ [AssignmentService] Unexpected error:', error);
      throw error;
    }
  }
};

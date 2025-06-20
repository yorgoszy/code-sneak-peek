
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

      // ΚΡΙΤΙΚΟ: Πρώτα ελέγχουμε αν το πρόγραμμα έχει τη σωστή δομή (weeks, days, blocks, exercises)
      await this.ensureProgramStructureExists(assignmentData.program);

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
  },

  async ensureProgramStructureExists(program: any) {
    console.log('🏗️ [AssignmentService] Checking program structure for:', program.id);
    
    // Ελέγχουμε αν υπάρχουν weeks για το πρόγραμμα - ΔΙΟΡΘΩΣΗ του query
    const { data: existingWeeks, error: weeksError } = await supabase
      .from('program_weeks')
      .select(`
        id,
        name,
        week_number,
        program_days!fk_program_days_week_id(
          id,
          name,
          day_number,
          program_blocks(
            id,
            name,
            block_order,
            program_exercises(
              id,
              sets,
              reps,
              kg,
              percentage_1rm,
              velocity_ms,
              tempo,
              rest,
              notes,
              exercise_order,
              exercises(id, name, description, video_url)
            )
          )
        )
      `)
      .eq('program_id', program.id);

    if (weeksError) {
      console.error('❌ [AssignmentService] Error checking program weeks:', weeksError);
      throw weeksError;
    }

    if (!existingWeeks || existingWeeks.length === 0) {
      console.log('⚠️ [AssignmentService] No program structure found, creating from program data...');
      
      // Αν δεν υπάρχει δομή, τη δημιουργούμε από τα δεδομένα του προγράμματος
      if (program.weeks && program.weeks.length > 0) {
        await this.createProgramStructure(program.id, program.weeks);
      } else {
        console.error('❌ [AssignmentService] No weeks data available to create structure');
        throw new Error('Το πρόγραμμα δεν έχει δομή (weeks, days, blocks)');
      }
    } else {
      console.log('✅ [AssignmentService] Program structure exists:', existingWeeks.length, 'weeks');
    }
  },

  async createProgramStructure(programId: string, weeks: any[]) {
    console.log('🏗️ [AssignmentService] Creating program structure for:', programId);
    
    for (const week of weeks) {
      console.log('📅 Creating week:', week.name, 'with', week.program_days?.length || 0, 'days');
      
      const { data: weekData, error: weekError } = await supabase
        .from('program_weeks')
        .insert([{
          program_id: programId,
          name: week.name,
          week_number: week.week_number
        }])
        .select()
        .single();

      if (weekError) {
        console.error('❌ Error creating week:', weekError);
        throw weekError;
      }

      console.log('✅ Week created:', weekData.id);

      if (!week.program_days || week.program_days.length === 0) {
        console.log('No days to create for week:', week.name);
        continue;
      }

      for (const day of week.program_days) {
        console.log('📋 Creating day:', day.name, 'with', day.program_blocks?.length || 0, 'blocks');
        
        const { data: dayData, error: dayError } = await supabase
          .from('program_days')
          .insert([{
            week_id: weekData.id,
            name: day.name,
            day_number: day.day_number,
            estimated_duration_minutes: day.estimated_duration_minutes || 60
          }])
          .select()
          .single();

        if (dayError) {
          console.error('❌ Error creating day:', dayError);
          throw dayError;
        }

        console.log('✅ Day created:', dayData.id);

        if (!day.program_blocks || day.program_blocks.length === 0) {
          console.log('No blocks to create for day:', day.name);
          continue;
        }

        for (const block of day.program_blocks) {
          console.log('🧱 Creating block:', block.name, 'with', block.program_exercises?.length || 0, 'exercises');
          
          const { data: blockData, error: blockError } = await supabase
            .from('program_blocks')
            .insert([{
              day_id: dayData.id,
              name: block.name,
              block_order: block.block_order
            }])
            .select()
            .single();

          if (blockError) {
            console.error('❌ Error creating block:', blockError);
            throw blockError;
          }

          console.log('✅ Block created:', blockData.id);

          if (!block.program_exercises || block.program_exercises.length === 0) {
            console.log('No exercises to create for block:', block.name);
            continue;
          }

          for (const exercise of block.program_exercises) {
            if (!exercise.exercise_id) {
              console.log('Skipping exercise without exercise_id');
              continue;
            }

            console.log('💪 Creating exercise:', exercise.exercises?.name || 'Unknown', 'with params:', {
              sets: exercise.sets,
              reps: exercise.reps,
              kg: exercise.kg,
              percentage_1rm: exercise.percentage_1rm,
              velocity_ms: exercise.velocity_ms,
              tempo: exercise.tempo,
              rest: exercise.rest
            });

            const { error: exerciseError } = await supabase
              .from('program_exercises')
              .insert([{
                block_id: blockData.id,
                exercise_id: exercise.exercise_id,
                sets: exercise.sets || 1,
                reps: exercise.reps || '',
                kg: exercise.kg || '',
                percentage_1rm: exercise.percentage_1rm ? parseFloat(exercise.percentage_1rm.toString()) : null,
                velocity_ms: exercise.velocity_ms ? parseFloat(exercise.velocity_ms.toString()) : null,
                tempo: exercise.tempo || '',
                rest: exercise.rest || '',
                notes: exercise.notes || '',
                exercise_order: exercise.exercise_order || 1
              }]);

            if (exerciseError) {
              console.error('❌ Error creating exercise:', exerciseError);
              throw exerciseError;
            }

            console.log('✅ Exercise created successfully');
          }
        }
      }
    }
    
    console.log('🎉 Program structure creation completed successfully');
  }
};

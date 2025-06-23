
import { supabase } from '@/integrations/supabase/client';
import { formatDateToLocalString } from '@/utils/dateUtils';

export const assignmentService = {
  async saveAssignment(assignmentData: any) {
    try {
      console.log('💾 [AssignmentService] Starting saveAssignment with data:', assignmentData);

      if (!assignmentData.program?.id) {
        throw new Error('Λείπει το ID του προγράμματος');
      }

      if (!assignmentData.userId) {
        throw new Error('Λείπει το ID του χρήστη');
      }

      if (!assignmentData.trainingDates || assignmentData.trainingDates.length === 0) {
        throw new Error('Λείπουν οι ημερομηνίες προπόνησης');
      }

      // Διασφαλίζουμε ότι οι ημερομηνίες είναι σε σωστό format
      let formattedTrainingDates: string[] = [];
      
      if (assignmentData.trainingDates && Array.isArray(assignmentData.trainingDates)) {
        console.log('💾 [AssignmentService] Processing training dates:', assignmentData.trainingDates);
        
        formattedTrainingDates = assignmentData.trainingDates.map((date: Date | string, index: number) => {
          console.log(`💾 [AssignmentService] Processing date ${index}:`, date);
          
          if (typeof date === 'string') {
            if (date.includes('T')) {
              const dateOnly = date.split('T')[0];
              console.log(`💾 [AssignmentService] String with timestamp converted: ${date} → ${dateOnly}`);
              return dateOnly;
            }
            return date;
          }
          const formatted = formatDateToLocalString(date);
          console.log(`💾 [AssignmentService] Date object converted: ${date} → ${formatted}`);
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

      // Ελέγχουμε αν το πρόγραμμα έχει τη σωστή δομή
      await this.ensureProgramStructureExists(assignmentData.program);

      // Αποθήκευση στη βάση δεδομένων
      const { data, error } = await supabase
        .from('program_assignments')
        .insert([insertData])
        .select();

      if (error) {
        console.error('❌ [AssignmentService] Database error:', error);
        throw new Error(`Σφάλμα βάσης δεδομένων: ${error.message}`);
      }

      console.log('✅ [AssignmentService] Assignment saved successfully:', data);
      return data;

    } catch (error) {
      console.error('❌ [AssignmentService] Error in saveAssignment:', error);
      throw error;
    }
  },

  async ensureProgramStructureExists(program: any) {
    console.log('🏗️ [AssignmentService] Checking program structure for:', program.id);
    
    try {
      // Ελέγχουμε αν υπάρχουν weeks για το πρόγραμμα
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
        throw new Error(`Σφάλμα ελέγχου δομής προγράμματος: ${weeksError.message}`);
      }

      if (!existingWeeks || existingWeeks.length === 0) {
        console.log('⚠️ [AssignmentService] No program structure found, creating...');
        
        if (program.weeks && program.weeks.length > 0) {
          await this.createProgramStructure(program.id, program.weeks);
        } else {
          throw new Error('Το πρόγραμμα δεν έχει δομή εβδομάδων');
        }
      } else {
        console.log('✅ [AssignmentService] Program structure exists:', existingWeeks.length, 'weeks');
      }
    } catch (error) {
      console.error('❌ [AssignmentService] Error in ensureProgramStructureExists:', error);
      throw error;
    }
  },

  async createProgramStructure(programId: string, weeks: any[]) {
    console.log('🏗️ [AssignmentService] Creating program structure for:', programId);
    
    try {
      for (const week of weeks) {
        console.log('📅 Creating week:', week.name);
        
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
          throw new Error(`Σφάλμα δημιουργίας εβδομάδας: ${weekError.message}`);
        }

        console.log('✅ Week created:', weekData.id);

        if (week.program_days && week.program_days.length > 0) {
          for (const day of week.program_days) {
            console.log('📋 Creating day:', day.name);
            
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
              throw new Error(`Σφάλμα δημιουργίας ημέρας: ${dayError.message}`);
            }

            console.log('✅ Day created:', dayData.id);

            if (day.program_blocks && day.program_blocks.length > 0) {
              for (const block of day.program_blocks) {
                console.log('🧱 Creating block:', block.name);
                
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
                  throw new Error(`Σφάλμα δημιουργίας block: ${blockError.message}`);
                }

                console.log('✅ Block created:', blockData.id);

                if (block.program_exercises && block.program_exercises.length > 0) {
                  for (const exercise of block.program_exercises) {
                    if (!exercise.exercise_id) {
                      console.log('⚠️ Skipping exercise without exercise_id');
                      continue;
                    }

                    console.log('💪 Creating exercise:', exercise.exercises?.name || 'Unknown');

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
                      throw new Error(`Σφάλμα δημιουργίας άσκησης: ${exerciseError.message}`);
                    }

                    console.log('✅ Exercise created successfully');
                  }
                }
              }
            }
          }
        }
      }
      
      console.log('🎉 Program structure creation completed successfully');
    } catch (error) {
      console.error('❌ [AssignmentService] Error in createProgramStructure:', error);
      throw error;
    }
  }
};

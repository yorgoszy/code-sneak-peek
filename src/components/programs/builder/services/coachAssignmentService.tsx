import { supabase } from '@/integrations/supabase/client';
import { formatDateToLocalString } from '@/utils/dateUtils';
import { parseNumberWithComma } from '@/utils/timeCalculations';

/**
 * Service ειδικά για assignments σε coach_users (αθλητές coach)
 * Χρησιμοποιεί το coach_user_id αντί για user_id
 */
export const coachAssignmentService = {
  async saveAssignment(assignmentData: any) {
    try {
      console.log('💾 [CoachAssignmentService] Starting saveAssignment with data:', assignmentData);

      if (!assignmentData.program?.id) {
        throw new Error('Λείπει το ID του προγράμματος');
      }

      if (!assignmentData.coachUserId) {
        throw new Error('Λείπει το ID του αθλητή (coach_user)');
      }

      if (!assignmentData.coachId) {
        throw new Error('Λείπει το ID του coach');
      }

      if (!assignmentData.trainingDates || assignmentData.trainingDates.length === 0) {
        throw new Error('Λείπουν οι ημερομηνίες προπόνησης');
      }

      // Διασφαλίζουμε ότι οι ημερομηνίες είναι σε σωστό format
      let formattedTrainingDates: string[] = [];
      
      if (assignmentData.trainingDates && Array.isArray(assignmentData.trainingDates)) {
        formattedTrainingDates = assignmentData.trainingDates.map((date: Date | string) => {
          let dateStr: string;
          
          if (typeof date === 'string') {
            if (date.includes('T')) {
              dateStr = date.split('T')[0];
            } else {
              dateStr = date;
            }
          } else {
            const localDate = new Date(date);
            localDate.setHours(12, 0, 0, 0);
            dateStr = localDate.toISOString().split('T')[0];
          }
          
          return dateStr;
        });
      }

      console.log('💾 [CoachAssignmentService] Final formatted dates:', formattedTrainingDates);

      const sortedDates = [...formattedTrainingDates].sort();
      const startDate = sortedDates[0] || formatDateToLocalString(new Date());
      const endDate = sortedDates[sortedDates.length - 1] || startDate;

      // ΣΗΜΑΝΤΙΚΟ: Χρησιμοποιούμε user_id τώρα (αντί coach_user_id)
      // Οι αθλητές είναι πλέον στο app_users με coach_id filter

      // Αν δεν μας δώσουν assignedBy, το infer-άρουμε από τον logged-in χρήστη (app_users.id)
      let inferredAssignedBy: string | null = assignmentData.assignedBy || assignmentData.coachId || null;
      if (!inferredAssignedBy) {
        const { data: auth } = await supabase.auth.getUser();
        const authUserId = auth.user?.id;
        if (authUserId) {
          const { data: me } = await supabase
            .from('app_users')
            .select('id')
            .eq('auth_user_id', authUserId)
            .maybeSingle();
          inferredAssignedBy = me?.id ?? null;
        }
      }

      const insertData = {
        program_id: assignmentData.program.id,
        user_id: assignmentData.coachUserId, // ID από app_users table
        coach_id: assignmentData.coachId, // ID του coach
        coach_user_id: null, // Deprecated - πλέον χρησιμοποιούμε user_id
        assigned_by: inferredAssignedBy, // ποιος έκανε την ανάθεση
        training_dates: formattedTrainingDates,
        status: 'active',
        assignment_type: 'individual',
        is_group_assignment: false,
        start_date: startDate,
        end_date: endDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 [CoachAssignmentService] Data to insert:', insertData);

      // Ελέγχουμε αν το πρόγραμμα έχει τη σωστή δομή
      await this.ensureProgramStructureExists(assignmentData.program);

      // Αποθήκευση στη βάση δεδομένων
      const { data, error } = await supabase
        .from('program_assignments')
        .insert([insertData])
        .select();

      if (error) {
        console.error('❌ [CoachAssignmentService] Database error:', error);
        throw new Error(`Σφάλμα βάσης δεδομένων: ${error.message}`);
      }

      console.log('✅ [CoachAssignmentService] Assignment saved successfully:', data);
      return data;

    } catch (error) {
      console.error('❌ [CoachAssignmentService] Error in saveAssignment:', error);
      throw error;
    }
  },

  async ensureProgramStructureExists(program: any) {
    console.log('🏗️ [CoachAssignmentService] Checking program structure for:', program.id);
    
    try {
      console.log('🗑️ [CoachAssignmentService] Deleting existing structure and recreating...');
      
      await this.deleteExistingStructure(program.id);
      
      if (program.weeks && program.weeks.length > 0) {
        console.log('🏗️ [CoachAssignmentService] Creating new structure with', program.weeks.length, 'weeks');
        await this.createProgramStructure(program.id, program.weeks);
        console.log('✅ [CoachAssignmentService] Program structure recreated successfully');
      } else {
        throw new Error('Το πρόγραμμα δεν έχει δομή εβδομάδων');
      }
    } catch (error) {
      console.error('❌ [CoachAssignmentService] Error in ensureProgramStructureExists:', error);
      throw error;
    }
  },

  async deleteExistingStructure(programId: string) {
    console.log('🗑️ [CoachAssignmentService] Deleting existing structure for program:', programId);
    
    try {
      const { data: weeks } = await supabase
        .from('program_weeks')
        .select('id')
        .eq('program_id', programId);

      if (weeks && weeks.length > 0) {
        const weekIds = weeks.map(w => w.id);
        
        const { data: days } = await supabase
          .from('program_days')
          .select('id')
          .in('week_id', weekIds);

        if (days && days.length > 0) {
          const dayIds = days.map(d => d.id);
          
          const { data: blocks } = await supabase
            .from('program_blocks')
            .select('id')
            .in('day_id', dayIds);

          if (blocks && blocks.length > 0) {
            const blockIds = blocks.map(b => b.id);
            
            await supabase
              .from('program_exercises')
              .delete()
              .in('block_id', blockIds);
          }
          
          await supabase
            .from('program_blocks')
            .delete()
            .in('day_id', dayIds);
        }
        
        await supabase
          .from('program_days')
          .delete()
          .in('week_id', weekIds);
      }
      
      await supabase
        .from('program_weeks')
        .delete()
        .eq('program_id', programId);
      
      console.log('✅ [CoachAssignmentService] Existing structure deleted');
    } catch (error) {
      console.error('❌ [CoachAssignmentService] Error deleting structure:', error);
    }
  },

  async createProgramStructure(programId: string, weeks: any[]) {
    console.log('🏗️ [CoachAssignmentService] Creating program structure for:', programId);
    
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
          throw new Error(`Σφάλμα δημιουργίας εβδομάδας: ${weekError.message}`);
        }

        if (week.program_days && week.program_days.length > 0) {
          for (const day of week.program_days) {
            const { data: dayData, error: dayError } = await supabase
              .from('program_days')
              .insert([{
                week_id: weekData.id,
                name: day.name,
                day_number: day.day_number,
                estimated_duration_minutes: day.estimated_duration_minutes || 60,
                is_test_day: !!day.is_test_day,
                test_types: day.test_types || [],
                is_competition_day: !!day.is_competition_day
              }])
              .select()
              .single();

            if (dayError) {
              throw new Error(`Σφάλμα δημιουργίας ημέρας: ${dayError.message}`);
            }

            if (day.program_blocks && day.program_blocks.length > 0) {
              for (const block of day.program_blocks) {
                const { data: blockData, error: blockError } = await supabase
                  .from('program_blocks')
                  .insert([{
                    day_id: dayData.id,
                    name: block.name,
                    block_order: block.block_order,
                    training_type: block.training_type || null,
                    workout_format: block.workout_format || null,
                    workout_duration: block.workout_duration || null,
                    block_sets: block.block_sets || 1
                  }])
                  .select()
                  .single();

                if (blockError) {
                  throw new Error(`Σφάλμα δημιουργίας block: ${blockError.message}`);
                }

                if (block.program_exercises && block.program_exercises.length > 0) {
                  const sortedExercises = [...block.program_exercises].sort((a, b) => {
                    const orderA = Number(a.exercise_order) || 0;
                    const orderB = Number(b.exercise_order) || 0;
                    return orderA - orderB;
                  });

                  for (const exercise of sortedExercises) {
                    if (!exercise.exercise_id) continue;

                    let percentage1rmValue = null;
                    if (exercise.percentage_1rm !== undefined && exercise.percentage_1rm !== null && exercise.percentage_1rm !== '') {
                      percentage1rmValue = parseNumberWithComma(exercise.percentage_1rm);
                    }

                    let velocityValue = null;
                    if (exercise.velocity_ms !== undefined && exercise.velocity_ms !== null && exercise.velocity_ms !== '') {
                      velocityValue = parseNumberWithComma(exercise.velocity_ms);
                    }

                    const insertData = {
                      block_id: blockData.id,
                      exercise_id: exercise.exercise_id,
                      sets: exercise.sets || 1,
                      reps: exercise.reps || '',
                      reps_mode: exercise.reps_mode || 'reps',
                      kg: exercise.kg || '',
                      kg_mode: exercise.kg_mode || 'kg',
                      percentage_1rm: percentage1rmValue,
                      velocity_ms: velocityValue,
                      tempo: exercise.tempo || '',
                      rest: exercise.rest || '',
                      notes: exercise.notes || '',
                      exercise_order: exercise.exercise_order || 1
                    };

                    const { error: exerciseError } = await supabase
                      .from('program_exercises')
                      .insert([insertData]);

                    if (exerciseError) {
                      throw new Error(`Σφάλμα δημιουργίας άσκησης: ${exerciseError.message}`);
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      console.log('🎉 Program structure creation completed successfully');
    } catch (error) {
      console.error('❌ [CoachAssignmentService] Error in createProgramStructure:', error);
      throw error;
    }
  }
};

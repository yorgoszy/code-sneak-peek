
import { supabase } from '@/integrations/supabase/client';
import { formatDateToLocalString } from '@/utils/dateUtils';
import { parseNumberWithComma } from '@/utils/timeCalculations';

type BuilderWeek = any;

/**
 * Normalizes builder structure to ensure required ordering fields exist.
 * This prevents partial structure creation when week_number/day_number/etc are missing.
 */
const normalizeWeeks = (weeks: BuilderWeek[]): BuilderWeek[] => {
  return (weeks || []).map((week: any, wIdx: number) => {
    const week_number = Number(week.week_number ?? wIdx + 1);
    const program_days = (week.program_days || []).map((day: any, dIdx: number) => {
      const day_number = Number(day.day_number ?? dIdx + 1);
      const program_blocks = (day.program_blocks || []).map((block: any, bIdx: number) => {
        const block_order = Number(block.block_order ?? bIdx + 1);
        const program_exercises = (block.program_exercises || []).map((ex: any, eIdx: number) => ({
          ...ex,
          exercise_order: Number(ex.exercise_order ?? eIdx + 1),
        }));
        return { ...block, block_order, program_exercises };
      });
      return { ...day, day_number, program_blocks };
    });
    return { ...week, week_number, program_days };
  });
};

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

      // Προαιρετικά: όταν κάνουμε ανάθεση “μέσα” από προφίλ coach (admin acting as coach), περνάμε coachId
      const coachId: string | undefined = assignmentData.coachId || undefined;

      // Αν ΔΕΝ μας δώσουν assignedBy/coachId, το infer-άρουμε από τον τρέχοντα χρήστη
      // (program_assignments.assigned_by είναι FK προς app_users.id, όχι auth.uid)
      let inferredAssignedBy: string | null = assignmentData.assignedBy || coachId || null;
      let inferredCoachId: string | undefined = coachId;

      if (!inferredAssignedBy || !inferredCoachId) {
        const { data: auth } = await supabase.auth.getUser();
        const authUserId = auth.user?.id;

        if (authUserId) {
          const { data: me, error: meErr } = await supabase
            .from('app_users')
            .select('id, role')
            .eq('auth_user_id', authUserId)
            .maybeSingle();

          if (meErr) {
            console.warn('⚠️ [AssignmentService] Could not resolve current app_user:', meErr);
          }

          if (me?.id) {
            // Το assigned_by πρέπει να δείχνει ποιος έκανε την ανάθεση (coach/admin)
            inferredAssignedBy = inferredAssignedBy || me.id;

            // Αν δεν έχει coachId και είναι coach ή admin, βάζουμε το id τους
            // Έτσι τα assignments φιλτράρονται σωστά ανά coach/admin
            if (!inferredCoachId && (me.role === 'coach' || me.role === 'admin')) {
              inferredCoachId = me.id;
            }
          }
        }
      }

      if (!assignmentData.trainingDates || assignmentData.trainingDates.length === 0) {
        throw new Error('Λείπουν οι ημερομηνίες προπόνησης');
      }

      // Διασφαλίζουμε ότι οι ημερομηνίες είναι σε σωστό format και ώρα 12:00 PM
      let formattedTrainingDates: string[] = [];
      
      if (assignmentData.trainingDates && Array.isArray(assignmentData.trainingDates)) {
        console.log('💾 [AssignmentService] Processing training dates:', assignmentData.trainingDates);
        
        formattedTrainingDates = assignmentData.trainingDates.map((date: Date | string, index: number) => {
          console.log(`💾 [AssignmentService] Processing date ${index}:`, date);
          
          let dateStr: string;
          
          if (typeof date === 'string') {
            if (date.includes('T')) {
              dateStr = date.split('T')[0];
            } else {
              dateStr = date;
            }
          } else {
            // For Date objects, use noon time to avoid timezone issues
            const localDate = new Date(date);
            localDate.setHours(12, 0, 0, 0); // Set to 12:00 PM local time
            dateStr = localDate.toISOString().split('T')[0];
          }
          
          console.log(`💾 [AssignmentService] Date converted: ${date} → ${dateStr}`);
          return dateStr;
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

      const insertData: any = {
        program_id: assignmentData.program.id,
        user_id: assignmentData.userId,
        training_dates: formattedTrainingDates,
        status: 'active',
        assignment_type: 'individual',
        is_group_assignment: false,
        start_date: startDate,
        end_date: endDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Ποιος έκανε την ανάθεση (coach/admin)
        assigned_by: inferredAssignedBy,
      };

      // Αν έχει “υπεύθυνο” coach για το assignment, το γράφουμε ώστε να μπορεί να φιλτραριστεί εύκολα στα coach dashboards
      if (inferredCoachId) {
        insertData.coach_id = inferredCoachId;
      }

      console.log('💾 [AssignmentService] Data to insert into database:', insertData);

      // ΒΕΛΤΙΣΤΟΠΟΙΗΣΗ: Αν skipStructureRecreation=true, παραλείπουμε τη δημιουργία δομής
      // (η δομή δημιουργήθηκε ήδη από τον πρώτο χρήστη)
      if (!assignmentData.skipStructureRecreation) {
        console.log('🏗️ [AssignmentService] Creating/updating program structure...');
        await this.ensureProgramStructureExists(assignmentData.program);
      } else {
        console.log('⏭️ [AssignmentService] Skipping structure recreation (already created for another user)');
      }

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
      // ✅ Normalize to avoid missing week_number/day_number causing partial insert failures
      const normalizedWeeks = normalizeWeeks(program.weeks || []);

      // ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: Πάντα διαγράφουμε και ξαναδημιουργούμε τη δομή
      // για να διασφαλίσουμε ότι οι αλλαγές αποθηκεύονται σωστά
      console.log('🗑️ [AssignmentService] Deleting existing structure and recreating...');

      // Διαγραφή υπάρχουσας δομής
      await this.deleteExistingStructure(program.id);

      // Δημιουργία νέας δομής από τον builder
      if (normalizedWeeks.length > 0) {
        console.log('🏗️ [AssignmentService] Creating new structure with', normalizedWeeks.length, 'weeks');
        await this.createProgramStructure(program.id, normalizedWeeks);
        console.log('✅ [AssignmentService] Program structure recreated successfully');
      } else {
        throw new Error('Το πρόγραμμα δεν έχει δομή εβδομάδων');
      }
    } catch (error) {
      console.error('❌ [AssignmentService] Error in ensureProgramStructureExists:', error);
      throw error;
    }
  },

  async deleteExistingStructure(programId: string) {
    console.log('🗑️ [AssignmentService] Deleting existing structure for program:', programId);
    
    try {
      // 1. Βρίσκουμε όλα τα weeks
      const { data: weeks } = await supabase
        .from('program_weeks')
        .select('id')
        .eq('program_id', programId);

      if (weeks && weeks.length > 0) {
        const weekIds = weeks.map(w => w.id);
        
        // 2. Βρίσκουμε τις days
        const { data: days } = await supabase
          .from('program_days')
          .select('id')
          .in('week_id', weekIds);

        if (days && days.length > 0) {
          const dayIds = days.map(d => d.id);
          
          // 3. Βρίσκουμε τα blocks
          const { data: blocks } = await supabase
            .from('program_blocks')
            .select('id')
            .in('day_id', dayIds);

          if (blocks && blocks.length > 0) {
            const blockIds = blocks.map(b => b.id);
            
            // 4. Διαγράφουμε exercises
            await supabase
              .from('program_exercises')
              .delete()
              .in('block_id', blockIds);
          }
          
          // 5. Διαγράφουμε blocks
          await supabase
            .from('program_blocks')
            .delete()
            .in('day_id', dayIds);
        }
        
        // 6. Διαγράφουμε days
        await supabase
          .from('program_days')
          .delete()
          .in('week_id', weekIds);
      }
      
      // 7. Διαγράφουμε weeks
      await supabase
        .from('program_weeks')
        .delete()
        .eq('program_id', programId);
      
      console.log('✅ [AssignmentService] Existing structure deleted');
    } catch (error) {
      console.error('❌ [AssignmentService] Error deleting structure:', error);
      // Δεν πετάμε error για να συνεχίσει η διαδικασία
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
            console.log('📋 Creating day:', day.name, 'is_competition_day:', day.is_competition_day);
            
            const { data: dayData, error: dayError } = await supabase
              .from('program_days')
              .insert([{
                week_id: weekData.id,
                name: day.name,
                day_number: day.day_number,
                estimated_duration_minutes: day.estimated_duration_minutes || 60,
                is_test_day: !!day.is_test_day,
                test_types: day.test_types || [],
                is_competition_day: !!day.is_competition_day,
                is_esd_day: !!(day as any).is_esd_day,
                is_recovery_day: !!(day as any).is_recovery_day
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
                    block_order: block.block_order,
                    training_type: block.training_type || null,
                    workout_format: block.workout_format || null,
                    workout_duration: block.workout_duration || null,
                    block_sets: block.block_sets || 1
                  }])
                  .select()
                  .single();

                if (blockError) {
                  console.error('❌ Error creating block:', blockError);
                  throw new Error(`Σφάλμα δημιουργίας block: ${blockError.message}`);
                }

                if (!blockData || !blockData.id) {
                  console.error('❌ Block data is null or missing id');
                  throw new Error('Σφάλμα δημιουργίας block: Δεν επιστράφηκε ID');
                }

                console.log('✅ Block created:', blockData.id);

                if (block.program_exercises && block.program_exercises.length > 0) {
                  // 🚨 ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: Ταξινομούμε τις ασκήσεις ΜΟΝΟ με βάση το exercise_order
                  console.log('🚨 [ASSIGNMENT CREATE] Before sorting exercises in block:', block.name);
                  block.program_exercises.forEach((ex, index) => {
                    console.log(`🚨 [ASSIGNMENT CREATE]   ${index + 1}. ${ex.exercises?.name} (order: ${ex.exercise_order})`);
                  });

                  const sortedExercises = [...block.program_exercises].sort((a, b) => {
                    const orderA = Number(a.exercise_order) || 0;
                    const orderB = Number(b.exercise_order) || 0;
                    console.log(`🚨 [ASSIGNMENT CREATE] Sorting: ${orderA} vs ${orderB} for ${a.exercises?.name} vs ${b.exercises?.name}`);
                    return orderA - orderB;
                  });
                  
                  console.log('🚨 [ASSIGNMENT CREATE] After sorting exercises:');
                  sortedExercises.forEach((ex, index) => {
                    console.log(`🚨 [ASSIGNMENT CREATE]   ${index + 1}. ${ex.exercises?.name} (order: ${ex.exercise_order})`);
                  });

                  for (const exercise of sortedExercises) {
                    if (!exercise.exercise_id) {
                      console.log('⚠️ Skipping exercise without exercise_id');
                      continue;
                    }

                    console.log('💪 Creating exercise:', exercise.exercises?.name || 'Unknown', 'with order:', exercise.exercise_order);

                    // Parse percentage_1rm και velocity_ms σωστά, υποστηρίζοντας κόμμα ως δεκαδικό διαχωριστή
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
                      sets: sanitizeSetsForDb(exercise.sets),
                      reps: exercise.reps || '',
                      reps_mode: exercise.reps_mode || 'reps',
                      kg: exercise.kg || '',
                      kg_mode: exercise.kg_mode || 'kg',
                      percentage_1rm: percentage1rmValue,
                      velocity_ms: velocityValue,
                      tempo: exercise.tempo || '',
                      rest: exercise.rest || '',
                      notes: exercise.notes || '',
                      exercise_order: exercise.exercise_order || 1 // ΚΡΙΤΙΚΟ: Διατηρούμε τη σειρά
                    };

                    console.log('🚨 [ASSIGNMENT CREATE] Final insert data:', {
                      exercise_name: exercise.exercises?.name,
                      exercise_order: insertData.exercise_order,
                      block_name: block.name
                    });

                    const { error: exerciseError } = await supabase
                      .from('program_exercises')
                      .insert([insertData]);

                    if (exerciseError) {
                      console.error('❌ Error creating exercise:', exerciseError);
                      throw new Error(`Σφάλμα δημιουργίας άσκησης: ${exerciseError.message}`);
                    }

                    console.log('✅ Exercise created successfully with order:', exercise.exercise_order);
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

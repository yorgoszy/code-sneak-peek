
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProgramBuilder } from "@/components/programs/builder/ProgramBuilder";
import { User, Exercise } from "@/components/programs/types";
import { useProgramBuilderState } from "@/components/programs/builder/hooks/useProgramBuilderState";
import { useProgramBuilderActions } from "@/components/programs/builder/hooks/useProgramBuilderActions";
import { Button } from "@/components/ui/button";

const ProgramBuilderPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { program, updateProgram, resetProgram, generateId } = useProgramBuilderState(exercises);
  
  const actions = useProgramBuilderActions(program, (newProgram) => {
    updateProgram(newProgram);
  }, generateId, exercises);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, exercisesData] = await Promise.all([
        supabase.from('app_users').select('id, name, email').order('name'),
        supabase.from('exercises').select('id, name').order('name')
      ]);
      
      setUsers(usersData.data || []);
      setExercises(exercisesData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async () => {
    if (!program.name) {
      toast.error('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }

    try {
      // Create the main program
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .insert([{
          name: program.name,
          description: program.description,
          athlete_id: program.athlete_id || null
        }])
        .select()
        .single();

      if (programError) throw programError;

      // Create weeks, days, blocks, and exercises
      for (const week of program.weeks) {
        const { data: weekData, error: weekError } = await supabase
          .from('program_weeks')
          .insert([{
            program_id: programData.id,
            name: week.name,
            week_number: week.week_number
          }])
          .select()
          .single();

        if (weekError) throw weekError;

        for (const day of week.days) {
          const { data: dayData, error: dayError } = await supabase
            .from('program_days')
            .insert([{
              week_id: weekData.id,
              name: day.name,
              day_number: day.day_number
            }])
            .select()
            .single();

          if (dayError) throw dayError;

          for (const block of day.blocks) {
            const { data: blockData, error: blockError } = await supabase
              .from('program_blocks')
              .insert([{
                day_id: dayData.id,
                name: block.name,
                block_order: block.block_order
              }])
              .select()
              .single();

            if (blockError) throw blockError;

            for (const exercise of block.exercises) {
              if (!exercise.exercise_id) continue;

              let calculatedKg = exercise.kg;
              let suggestedVelocity = null;

              // Calculate kg from percentage if athlete is selected and percentage is provided
              if (program.athlete_id && exercise.percentage_1rm > 0) {
                const { data: oneRmData } = await supabase
                  .rpc('get_latest_1rm', {
                    athlete_id: program.athlete_id,
                    exercise_id: exercise.exercise_id
                  });

                if (oneRmData) {
                  calculatedKg = Math.round(oneRmData * (exercise.percentage_1rm / 100)).toString();
                  
                  // Get suggested velocity
                  const { data: velocityData } = await supabase
                    .rpc('get_suggested_velocity', {
                      athlete_id: program.athlete_id,
                      exercise_id: exercise.exercise_id,
                      percentage: exercise.percentage_1rm
                    });

                  if (velocityData) {
                    suggestedVelocity = velocityData;
                  }
                }
              }

              const { error: exerciseError } = await supabase
                .from('program_exercises')
                .insert([{
                  block_id: blockData.id,
                  exercise_id: exercise.exercise_id,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  kg: calculatedKg,
                  percentage_1rm: exercise.percentage_1rm || null,
                  velocity_ms: exercise.velocity_ms ? parseFloat(exercise.velocity_ms) : suggestedVelocity,
                  tempo: exercise.tempo,
                  rest: exercise.rest,
                  notes: '',
                  exercise_order: exercise.exercise_order
                }]);

              if (exerciseError) throw exerciseError;
            }
          }
        }
      }

      toast.success('Το πρόγραμμα δημιουργήθηκε επιτυχώς');
      resetProgram();
      // Close window after successful save
      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error('Σφάλμα δημιουργίας προγράμματος');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Φόρτωση...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Δημιουργία Νέου Προγράμματος</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-none"
              onClick={() => window.close()}
            >
              Ακύρωση
            </Button>
            <Button 
              onClick={handleSaveProgram} 
              className="rounded-none bg-green-600 hover:bg-green-700"
            >
              Αποθήκευση Προγράμματος
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-none shadow-sm p-6">
          <ProgramBuilder
            program={program}
            users={users}
            exercises={exercises}
            onNameChange={(name) => updateProgram({ name })}
            onDescriptionChange={(description) => updateProgram({ description })}
            onAthleteChange={(athlete_id) => updateProgram({ athlete_id })}
            onAddWeek={actions.addWeek}
            onRemoveWeek={actions.removeWeek}
            onDuplicateWeek={actions.duplicateWeek}
            onUpdateWeekName={actions.updateWeekName}
            onAddDay={actions.addDay}
            onRemoveDay={actions.removeDay}
            onDuplicateDay={actions.duplicateDay}
            onUpdateDayName={actions.updateDayName}
            onAddBlock={actions.addBlock}
            onRemoveBlock={actions.removeBlock}
            onDuplicateBlock={actions.duplicateBlock}
            onUpdateBlockName={actions.updateBlockName}
            onAddExercise={actions.addExercise}
            onRemoveExercise={actions.removeExercise}
            onUpdateExercise={actions.updateExercise}
            onDuplicateExercise={actions.duplicateExercise}
            onReorderWeeks={actions.reorderWeeks}
            onReorderDays={actions.reorderDays}
            onReorderBlocks={actions.reorderBlocks}
            onReorderExercises={actions.reorderExercises}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgramBuilderPage;

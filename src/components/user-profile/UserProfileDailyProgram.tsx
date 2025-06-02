
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Dumbbell } from 'lucide-react';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface UserProfileDailyProgramProps {
  user: any;
}

export const UserProfileDailyProgram: React.FC<UserProfileDailyProgramProps> = ({ user }) => {
  const [todaysPrograms, setTodaysPrograms] = useState<EnrichedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  useEffect(() => {
    fetchTodaysPrograms();
  }, [user.id]);

  const fetchTodaysPrograms = async () => {
    try {
      setLoading(true);
      
      const { data: assignments, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs!inner (
            id,
            name,
            description,
            program_weeks (
              id,
              name,
              week_number,
              program_days (
                id,
                name,
                day_number,
                estimated_duration_minutes,
                program_blocks (
                  id,
                  name,
                  block_order,
                  program_exercises (
                    id,
                    exercise_id,
                    sets,
                    reps,
                    kg,
                    percentage_1rm,
                    velocity_ms,
                    tempo,
                    rest,
                    notes,
                    exercise_order,
                    exercises (
                      id,
                      name,
                      description
                    )
                  )
                )
              )
            )
          ),
          app_users (
            id,
            name,
            email,
            photo_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .contains('training_dates', [todayString]);

      if (error) {
        console.error('Error fetching today programs:', error);
        return;
      }

      setTodaysPrograms(assignments || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Φόρτωση προγράμματος ημέρας...</div>
      </div>
    );
  }

  if (todaysPrograms.length === 0) {
    return (
      <div className="text-center p-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Δεν υπάρχει πρόγραμμα για σήμερα
        </h3>
        <p className="text-gray-600">
          Δεν έχει προγραμματιστεί προπόνηση για την ημερομηνία {format(today, 'dd/MM/yyyy')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Calendar className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Πρόγραμμα για σήμερα
          </h2>
          <p className="text-sm text-gray-600">
            {format(today, 'EEEE, dd MMMM yyyy', { locale: { localize: { day: () => '' } } })}
          </p>
        </div>
      </div>

      {todaysPrograms.map((assignment) => {
        const program = assignment.programs;
        if (!program) return null;

        // Βρίσκουμε την ημέρα που αντιστοιχεί στο σήμερα
        const todayDay = program.program_weeks
          .flatMap(week => week.program_days)
          .find(day => {
            // Για απλότητα, παίρνουμε την πρώτη ημέρα που βρίσκουμε
            // Μπορεί να χρειάζεται πιο σύνθετη λογική ανάλογα με το πώς αντιστοιχίζονται οι ημέρες
            return day;
          });

        if (!todayDay) return null;

        const totalDuration = todayDay.estimated_duration_minutes || 0;

        return (
          <div key={assignment.id} className="bg-white border border-gray-200 rounded-none p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {program.name}
                </h3>
                {program.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {program.description}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {totalDuration > 0 && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{totalDuration} λεπτά</span>
                  </div>
                )}
                <Badge variant="outline" className="rounded-none">
                  {assignment.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Dumbbell className="h-4 w-4" />
                <span>{todayDay.name}</span>
              </h4>

              {todayDay.program_blocks.map((block) => (
                <div key={block.id} className="border border-gray-100 rounded-none p-4">
                  <h5 className="font-medium text-gray-800 mb-3">
                    {block.name}
                  </h5>
                  
                  <div className="space-y-2">
                    {block.program_exercises
                      .sort((a, b) => a.exercise_order - b.exercise_order)
                      .map((exercise) => (
                        <div key={exercise.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">
                              {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{exercise.sets} sets</span>
                            <span>{exercise.reps} reps</span>
                            {exercise.kg && <span>{exercise.kg} kg</span>}
                            {exercise.percentage_1rm && <span>{exercise.percentage_1rm}% 1RM</span>}
                            {exercise.rest && <span>Ανάπαυση: {exercise.rest}</span>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

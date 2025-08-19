
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, Zap, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TrainingAnalyticsProps {
  userId: string;
}

interface WorkoutAnalysis {
  strength_hours: number;
  endurance_hours: number;
  power_hours: number;
  speed_hours: number;
  total_hours: number;
}

export const TrainingAnalytics: React.FC<TrainingAnalyticsProps> = ({ userId }) => {
  const [analysis, setAnalysis] = useState<WorkoutAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingAnalysis();
  }, [userId]);

  const fetchTrainingAnalysis = async () => {
    try {
      setLoading(true);
      
      // Φέρνουμε τα προγράμματα του χρήστη με διευκρίνιση της σχέσης
      const { data: assignments } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs!program_assignments_program_id_fkey(
            *,
            program_weeks(
              *,
              program_days(
                *,
                program_blocks(
                  *,
                  program_exercises(
                    *,
                    exercises(name),
                    sets,
                    reps,
                    percentage_1rm,
                    velocity_ms,
                    tempo,
                    rest
                  )
                )
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!assignments || assignments.length === 0) {
        setAnalysis({
          strength_hours: 0,
          endurance_hours: 0,
          power_hours: 0,
          speed_hours: 0,
          total_hours: 0
        });
        return;
      }

      const workoutAnalysis = {
        strength_hours: 0,
        endurance_hours: 0,
        power_hours: 0,
        speed_hours: 0
      };

      assignments.forEach(assignment => {
        if (assignment.programs?.program_weeks) {
          assignment.programs.program_weeks.forEach((week: any) => {
            week.program_days?.forEach((day: any) => {
              day.program_blocks?.forEach((block: any) => {
                block.program_exercises?.forEach((exercise: any) => {
                  const type = categorizeExerciseType(exercise);
                  const duration = calculateExerciseDuration(exercise);
                  workoutAnalysis[`${type}_hours`] += duration;
                });
              });
            });
          });
        }
      });

      const total = Object.values(workoutAnalysis).reduce((sum, hours) => sum + hours, 0);

      setAnalysis({
        ...workoutAnalysis,
        total_hours: total
      });

    } catch (error) {
      console.error('Σφάλμα ανάλυσης προπονήσεων:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeExerciseType = (exercise: any): 'strength' | 'endurance' | 'power' | 'speed' => {
    const reps = parseInt(exercise.reps) || 0;
    const percentage = parseFloat(exercise.percentage_1rm) || 0;
    const velocity = parseFloat(exercise.velocity_ms) || 0;

    // Δύναμη: >85% 1RM ή ≤5 reps
    if (percentage > 85 || reps <= 5) return 'strength';
    
    // Αντοχή: <65% 1RM ή >12 reps
    if (percentage < 65 || reps > 12) return 'endurance';
    
    // Ταχύτητα: Υψηλή ταχύτητα και χαμηλό φορτίο
    if (velocity > 0.8 && percentage < 60) return 'speed';
    
    // Ισχύς: Μέσα στο εύρος 30-60% 1RM
    return 'power';
  };

  const calculateExerciseDuration = (exercise: any): number => {
    const sets = parseInt(exercise.sets) || 1;
    const reps = parseInt(exercise.reps) || 1;
    const tempo = exercise.tempo || '2.1.2';
    const rest = parseInt(exercise.rest) || 60;

    // Υπολογίζει τον χρόνο του tempo
    const tempoPhases = tempo.split('.').map(phase => parseInt(phase) || 2);
    const tempoSeconds = tempoPhases.reduce((sum, phase) => sum + phase, 0);
    
    // Συνολικός χρόνος: (sets * reps * tempo) + (sets-1) * rest
    const totalSeconds = (sets * reps * tempoSeconds) + ((sets - 1) * rest);
    return totalSeconds / 3600; // μετατροπή σε ώρες
  };

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} λεπτά`;
    }
    return `${hours.toFixed(1)} ώρες`;
  };

  const getPercentage = (hours: number, total: number): number => {
    return total > 0 ? (hours / total) * 100 : 0;
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            Ανάλυση Προπονήσεων
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-500">Φόρτωση ανάλυσης...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || analysis.total_hours === 0) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            Ανάλυση Προπονήσεων
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-500">Δεν υπάρχουν δεδομένα προπονήσεων</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            Ανάλυση Προπονήσεων
            <span className="text-xs md:text-sm font-normal text-gray-600 ml-auto">
              Σύνολο: {formatHours(analysis.total_hours)}
            </span>
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Προπόνηση Δύναμης */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Δύναμη</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatHours(analysis.strength_hours)}
            </span>
          </div>
          <Progress 
            value={getPercentage(analysis.strength_hours, analysis.total_hours)} 
            className="h-2"
          />
        </div>

        {/* Προπόνηση Αντοχής */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Αντοχή</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatHours(analysis.endurance_hours)}
            </span>
          </div>
          <Progress 
            value={getPercentage(analysis.endurance_hours, analysis.total_hours)} 
            className="h-2"
          />
        </div>

        {/* Προπόνηση Ισχύος */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium">Ισχύς</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatHours(analysis.power_hours)}
            </span>
          </div>
          <Progress 
            value={getPercentage(analysis.power_hours, analysis.total_hours)} 
            className="h-2"
          />
        </div>

        {/* Προπόνηση Ταχύτητας */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium">Ταχύτητα</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatHours(analysis.speed_hours)}
            </span>
          </div>
          <Progress 
            value={getPercentage(analysis.speed_hours, analysis.total_hours)} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};

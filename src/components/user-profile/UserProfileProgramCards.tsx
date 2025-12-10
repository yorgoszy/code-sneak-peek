
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from 'react-i18next';
import { useAllPrograms } from "@/hooks/useAllPrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { ProgramCard } from "@/components/active-programs/ProgramCard";
import { TrainingTypesPieChart } from "./TrainingTypesPieChart";
import { WorkoutStatsTabsSection } from "./WorkoutStatsTabsSection";
import { format } from "date-fns";
import { parseRepsToTime, parseTempoToSeconds, parseRestTime } from '@/utils/timeCalculations';

interface UserProfileProgramCardsProps {
  userProfile: any;
}

export const UserProfileProgramCards: React.FC<UserProfileProgramCardsProps> = ({ userProfile }) => {
  const { t } = useTranslation();
  const { data: allActivePrograms = [], isLoading, error, refetch } = useAllPrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);

  // Filter programs for the specific user
  const userPrograms = allActivePrograms.filter(program => program.user_id === userProfile.id);

  // Fetch all workout completions - same as calendar and ProgramCards
  useEffect(() => {
    const loadCompletions = async () => {
      if (userPrograms.length > 0) {
        const allCompletions = await getAllWorkoutCompletions();
        // Filter completions for this user's assignments
        const userAssignmentIds = userPrograms.map(p => p.id);
        const userCompletions = allCompletions.filter(c => userAssignmentIds.includes(c.assignment_id));
        setWorkoutCompletions(userCompletions);
      }
    };
    loadCompletions();
  }, [userPrograms.length, userProfile.id, getAllWorkoutCompletions]);

  // Υπολογισμός διάρκειας προπόνησης
  const calculateWorkoutDuration = (program: any, dateIndex: number): number => {
    const programData = program.programs;
    if (!programData?.program_weeks) return 0;

    const weeks = programData.program_weeks;
    let targetDay = null;
    let currentDayCount = 0;

    for (const week of weeks) {
      const daysInWeek = week.program_days?.length || 0;
      if (dateIndex >= currentDayCount && dateIndex < currentDayCount + daysInWeek) {
        const dayIndexInWeek = dateIndex - currentDayCount;
        targetDay = week.program_days?.[dayIndexInWeek] || null;
        break;
      }
      currentDayCount += daysInWeek;
    }

    if (!targetDay?.program_blocks) return 0;

    let totalSeconds = 0;
    targetDay.program_blocks.forEach((block: any) => {
      block.program_exercises?.forEach((exercise: any) => {
        if (exercise.exercise_id) {
          const sets = exercise.sets || 0;
          const repsData = parseRepsToTime(exercise.reps);
          const isTimeMode = exercise.reps_mode === 'time' || repsData.isTime;

          if (isTimeMode) {
            const workTime = sets * repsData.seconds;
            const restTime = parseRestTime(exercise.rest || '');
            totalSeconds += workTime + (sets * restTime);
          } else {
            const tempo = parseTempoToSeconds(exercise.tempo || '');
            const restTime = parseRestTime(exercise.rest || '');
            const workTime = sets * repsData.count * tempo;
            totalSeconds += workTime + (sets * restTime);
          }
        }
      });
    });

    return totalSeconds / 60;
  };

  // Week stats calculation
  const weekStats = React.useMemo(() => {
    const now = new Date();
    const startOfWeekDate = new Date(now);
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeekDate.setDate(now.getDate() - daysToSubtract);
    startOfWeekDate.setHours(0, 0, 0, 0);

    let scheduledMinutes = 0, actualMinutes = 0, missed = 0;
    let scheduledWorkouts = 0, completedWorkouts = 0;

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeekDate);
      day.setDate(startOfWeekDate.getDate() + i);
      weekDays.push(day);
    }

    for (const day of weekDays) {
      const dateStr = format(day, 'yyyy-MM-dd');
      for (const program of userPrograms) {
        if (!program.training_dates) continue;
        const dateIndex = program.training_dates.findIndex((d: string) => d === dateStr);
        if (dateIndex === -1) continue;

        scheduledWorkouts++;
        const workoutMinutes = calculateWorkoutDuration(program, dateIndex);
        scheduledMinutes += workoutMinutes;

        const completion = workoutCompletions.find(c => c.assignment_id === program.id && c.scheduled_date === dateStr);
        if (completion?.status === 'completed') {
          completedWorkouts++;
          actualMinutes += workoutMinutes;
        } else {
          const today = new Date();
          const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          if (isPast || completion?.status === 'missed') missed++;
        }
      }
    }

    return {
      scheduledMinutes,
      actualMinutes,
      missedWorkouts: missed,
      completedWorkouts,
      scheduledWorkouts,
    };
  }, [userPrograms, workoutCompletions]);

  // Month stats calculation
  const monthStats = React.useMemo(() => {
    const current = new Date();
    const monthStr = format(current, 'yyyy-MM');
    let scheduled = 0, completed = 0, missed = 0, totalMinutes = 0;

    for (const program of userPrograms) {
      if (!program.training_dates) continue;
      const monthlyDates = program.training_dates.filter((d: string) => d && d.startsWith(monthStr));
      for (const date of monthlyDates) {
        scheduled++;
        const completion = workoutCompletions.find(c => c.assignment_id === program.id && c.scheduled_date === date);
        if (completion?.status === 'completed') {
          completed++;
          const dateIndex = program.training_dates.indexOf(date);
          totalMinutes += calculateWorkoutDuration(program, dateIndex);
        } else {
          const workoutDate = new Date(date);
          const today = new Date();
          const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          if (isPast || completion?.status === 'missed') missed++;
        }
      }
    }

    return {
      completedWorkouts: completed,
      totalTrainingMinutes: totalMinutes,
      totalVolume: 0,
      missedWorkouts: missed,
      scheduledWorkouts: scheduled,
    };
  }, [userPrograms, workoutCompletions]);

  // Calculate stats the same way as calendar and ProgramCards
  const calculateProgramStats = (assignment: any) => {
    const trainingDates = assignment.training_dates || [];
    const assignmentCompletions = workoutCompletions.filter(c => c.assignment_id === assignment.id);
    
    let completed = 0;
    let missed = 0;
    const total = trainingDates.length;
    const today = new Date();
    
    // Για κάθε training date, έλεγξε το status
    for (const date of trainingDates) {
      const completion = assignmentCompletions.find(c => c.scheduled_date === date);
      
      if (completion?.status === 'completed') {
        completed++;
      } else {
        // Έλεγχος αν έχει περάσει η ημερομηνία
        const workoutDate = new Date(date);
        const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        if (isPast || completion?.status === 'missed') {
          missed++;
        }
      }
    }
    
    // Το progress υπολογίζεται από completed + missed (όλες οι "ολοκληρωμένες" προπονήσεις)
    const processedWorkouts = completed + missed;
    const progress = total > 0 ? Math.round((processedWorkouts / total) * 100) : 0;
    
    // Ελέγχουμε αν το πρόγραμμα έχει χάσει όλες τις προπονήσεις
    const isAllMissed = total > 0 && missed === total && completed === 0;
    
    return {
      completed,
      total,
      missed,
      progress,
      isAllMissed
    };
  };

  // Calculate stats for each program
  const programsWithStats = userPrograms.map(assignment => ({
    assignment,
    stats: calculateProgramStats(assignment)
  }));

  // Διαχωρισμός προγραμμάτων σε ενεργά, ολοκληρωμένα επιτυχώς και χαμένα βάσει status και progress
  const activeIncompletePrograms = programsWithStats.filter(item => 
    item.assignment.status === 'active' && item.stats?.progress < 100
  );
  
  // Ολοκληρωμένα με επιτυχία - έχουν completed workouts
  const successfullyCompletedPrograms = programsWithStats.filter(item => 
    (item.assignment.status === 'completed' || item.stats?.progress >= 100) && 
    item.stats?.completed > 0 && 
    !item.stats?.isAllMissed
  );
  
  // Χαμένα/Αποτυχημένα προγράμματα - όλες οι προπονήσεις έχουν χαθεί
  const missedPrograms = programsWithStats.filter(item => 
    (item.assignment.status === 'completed' || item.stats?.progress >= 100) && 
    item.stats?.isAllMissed
  );
  
  // Συνολικά ολοκληρωμένα (επιτυχή + χαμένα)
  const allCompletedPrograms = [...successfullyCompletedPrograms, ...missedPrograms];

  const handleDelete = async (assignmentId: string) => {
    // Regular users typically cannot delete programs
    console.log('Delete not allowed for user profiles');
  };

  if (isLoading) {
    return (
      <Card className="rounded-none">
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            {t('programs.loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-none">
        <CardContent>
          <div className="text-center py-8 text-red-500">
            {t('programs.error')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userPrograms.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('programs.noActivePrograms')}</p>
            <p className="text-sm">{t('programs.contactTrainer')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workout Stats Section */}
      <WorkoutStatsTabsSection 
        userId={userProfile?.id} 
        customMonthStats={monthStats} 
        customWeekStats={weekStats} 
        userPrograms={userPrograms} 
        workoutCompletions={workoutCompletions} 
      />

      {/* Training Types Analytics */}
      <TrainingTypesPieChart userId={userProfile.id} />

      <Card className="rounded-none">
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none">
              <TabsTrigger value="active" className="rounded-none flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3" />
                {t('programs.active')} ({activeIncompletePrograms.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-none flex items-center gap-2 text-sm">
                <CheckCircle className="h-3 w-3" />
                {t('programs.completed')} ({allCompletedPrograms.length})
              </TabsTrigger>
            </TabsList>

          <TabsContent value="active" className="mt-4">
            {activeIncompletePrograms.length > 0 ? (
              <div className="space-y-4">
                {activeIncompletePrograms.map((item) => (
                  <div key={item.assignment.id} className="flex justify-center">
                    <ProgramCard
                      assignment={item.assignment}
                      workoutStats={item.stats}
                      onRefresh={refetch}
                      onDelete={handleDelete}
                      userMode={true}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">{t('programs.noActiveProgramsFound')}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {allCompletedPrograms.length > 0 ? (
              <div className="space-y-4">
                {/* Επιτυχώς ολοκληρωμένα προγράμματα */}
                {successfullyCompletedPrograms.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {t('programs.successfullyCompleted')} ({successfullyCompletedPrograms.length})
                    </h4>
                    {successfullyCompletedPrograms.map((item) => (
                      <div key={item.assignment.id} className="flex justify-center">
                        <ProgramCard
                          assignment={item.assignment}
                          workoutStats={item.stats}
                          onRefresh={refetch}
                          onDelete={handleDelete}
                          userMode={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Χαμένα προγράμματα */}
                {missedPrograms.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-red-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-red-500" />
                      {t('programs.failedAllMissed')} ({missedPrograms.length})
                    </h4>
                    {missedPrograms.map((item) => (
                      <div key={item.assignment.id} className="flex justify-center opacity-75">
                        <ProgramCard
                          assignment={item.assignment}
                          workoutStats={item.stats}
                          onRefresh={refetch}
                          onDelete={handleDelete}
                          userMode={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">{t('programs.noCompletedPrograms')}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

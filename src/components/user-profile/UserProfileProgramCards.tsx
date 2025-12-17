
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle, Clock, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useTranslation } from 'react-i18next';
import { useAllPrograms } from "@/hooks/useAllPrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { ProgramCard } from "@/components/active-programs/ProgramCard";
import { TrainingTypesPieChart } from "./TrainingTypesPieChart";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { format } from "date-fns";
import { el } from "date-fns/locale";

interface UserProfileProgramCardsProps {
  userProfile: any;
}

export const UserProfileProgramCards: React.FC<UserProfileProgramCardsProps> = ({ userProfile }) => {
  const { t } = useTranslation();
  const { data: allActivePrograms = [], isLoading, error, refetch } = useAllPrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [selectedProgramData, setSelectedProgramData] = useState<any>(null);

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
    
    // Υπολογισμός average RPE
    const rpeScores = assignmentCompletions
      .filter(c => c.status === 'completed' && c.rpe_score)
      .map(c => c.rpe_score as number);
    const averageRpe = rpeScores.length > 0 
      ? rpeScores.reduce((a, b) => a + b, 0) / rpeScores.length 
      : undefined;
    
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
      isAllMissed,
      averageRpe
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

  // Calendar functions
  const getDayProgram = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    for (const program of userPrograms) {
      if (!program.training_dates) continue;
      
      const dateIndex = program.training_dates.findIndex((d: string) => d === dateStr);
      if (dateIndex === -1) continue;

      const weeks = program.programs?.program_weeks || [];
      if (weeks.length === 0) continue;

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

      if (targetDay) {
        const completion = workoutCompletions.find(c => 
          c.assignment_id === program.id && 
          c.scheduled_date === dateStr
        );
        
        return {
          program,
          dateIndex,
          targetDay,
          isCompleted: completion?.status === 'completed',
          status: completion?.status || 'scheduled'
        };
      }
    }
    return null;
  };

  const getDateStatus = (date: Date) => {
    const dayProgram = getDayProgram(date);
    if (!dayProgram) return null;
    
    const today = new Date();
    const workoutDate = new Date(date);
    const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (dayProgram.status === 'completed') {
      return 'completed';
    } else if (dayProgram.status === 'missed') {
      return 'missed';
    } else if (isPast && dayProgram.status !== 'completed') {
      return 'missed';
    } else {
      return 'scheduled';
    }
  };

  const handleDayClick = (date: Date) => {
    const dayProgram = getDayProgram(date);
    if (dayProgram) {
      setSelectedDate(date);
      setSelectedProgramData(dayProgram);
      setIsDayDialogOpen(true);
    }
  };

  const handleRefresh = async () => {
    const allCompletions = await getAllWorkoutCompletions();
    const userAssignmentIds = userPrograms.map(p => p.id);
    const userCompletions = allCompletions.filter(c => userAssignmentIds.includes(c.assignment_id));
    setWorkoutCompletions(userCompletions);
  };

  const workoutStatus = selectedProgramData?.status || 'no_workout';

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
      {/* Training Types Analytics */}
      <TrainingTypesPieChart userId={userProfile.id} />

      {/* Training Calendar */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <CalendarDays className="h-4 w-4 md:h-5 md:w-5" />
            Ημερολόγιο Προπονήσεων
            {(() => {
              const currentMonth = selectedDate || new Date();
              const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
              const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
              
              let monthTotal = 0;
              let monthCompleted = 0;
              let monthMissed = 0;
              
              for (const program of userPrograms) {
                const trainingDates = program.training_dates || [];
                for (const dateStr of trainingDates) {
                  const date = new Date(dateStr);
                  if (date >= monthStart && date <= monthEnd) {
                    monthTotal++;
                    const status = getDateStatus(date);
                    if (status === 'completed') monthCompleted++;
                    else if (status === 'missed') monthMissed++;
                  }
                }
              }
              
              if (monthTotal === 0) return null;
              
              return (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  ({monthTotal} προπ. · <span className="text-green-600">{monthCompleted} ✓</span> · <span className="text-red-500">{monthMissed} ✗</span>)
                </span>
              );
            })()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onDayClick={handleDayClick}
            locale={el}
            className="rounded-none border"
            modifiers={{
              scheduled: (date) => getDateStatus(date) === 'scheduled',
              completed: (date) => getDateStatus(date) === 'completed',
              missed: (date) => getDateStatus(date) === 'missed',
            }}
            modifiersStyles={{
              scheduled: { backgroundColor: '#fef3c7', color: '#92400e' },
              completed: { backgroundColor: '#d1fae5', color: '#065f46' },
              missed: { backgroundColor: '#fee2e2', color: '#991b1b' },
            }}
          />
        </CardContent>
      </Card>

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

      {selectedProgramData && selectedDate && (
        <DayProgramDialog
          isOpen={isDayDialogOpen}
          onClose={() => setIsDayDialogOpen(false)}
          program={selectedProgramData.program}
          selectedDate={selectedDate}
          workoutStatus={workoutStatus}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

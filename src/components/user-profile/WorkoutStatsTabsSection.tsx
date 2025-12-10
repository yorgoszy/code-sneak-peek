import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkoutStatsFromDB } from "@/hooks/useWorkoutStatsFromDB";
import { AlertTriangle, Activity, Clock, Dumbbell, Database } from "lucide-react";
import { TodayExercisesCard } from "./TodayExercisesCard";

interface WorkoutStatsTabsSectionProps {
  userId: string;
  onTabChange?: (tab: 'month' | 'week' | 'day') => void;
  userPrograms?: any[];
  workoutCompletions?: any[];
}

export const WorkoutStatsTabsSection = ({ userId, onTabChange, userPrograms = [], workoutCompletions = [] }: WorkoutStatsTabsSectionProps) => {
  const { monthStats, weekStats, allTimeStats, loading } = useWorkoutStatsFromDB(userId);
  
  const hasCompletedWorkouts = allTimeStats.completedWorkouts > 0;

  const NoStatsMessage = () => (
    <div className="text-center py-8 bg-white border rounded-none">
      <Dumbbell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
      <p className="text-gray-500 text-sm">Δεν υπάρχουν ολοκληρωμένες προπονήσεις</p>
      <p className="text-gray-400 text-xs mt-1">Ολοκλήρωσε μια προπόνηση για να δεις τα στατιστικά σου</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        Στατιστικά Προπονήσεων
        {hasCompletedWorkouts && (
          <span title="Δεδομένα από βάση">
            <Database className="h-4 w-4 text-[#00ffba]" />
          </span>
        )}
      </h3>
      
      <Tabs defaultValue="month" className="w-full" onValueChange={(value) => onTabChange?.(value as 'month' | 'week' | 'day')}>
        <TabsList className="grid w-full grid-cols-3 rounded-none">
          <TabsTrigger value="month" className="rounded-none">Μήνας</TabsTrigger>
          <TabsTrigger value="week" className="rounded-none">Εβδομάδα</TabsTrigger>
          <TabsTrigger value="day" className="rounded-none">Ημέρα</TabsTrigger>
        </TabsList>
        
        <TabsContent value="month" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Φόρτωση στατιστικών μήνα...</p>
            </div>
          ) : !hasCompletedWorkouts ? (
            <NoStatsMessage />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white p-3 border rounded-none">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-[#00ffba]" />
                  <span className="text-xs font-medium text-gray-600">Ολοκληρωμένες</span>
                </div>
                <div className="text-xl font-bold text-[#00ffba]">{monthStats.completedWorkouts}</div>
                <p className="text-[10px] text-gray-500">προπονήσεις μήνα</p>
              </div>
              
              <div className="bg-white p-3 border rounded-none">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-gray-600">Χρόνος</span>
                </div>
                <div className="text-xl font-bold text-blue-500">
                  {Math.floor(monthStats.totalDurationMinutes / 60)}:{String(monthStats.totalDurationMinutes % 60).padStart(2, '0')}
                </div>
                <p className="text-[10px] text-gray-500">ώρες:λεπτά</p>
              </div>
              
              <div className="bg-white p-3 border rounded-none">
                <div className="flex items-center gap-2 mb-1">
                  <Dumbbell className="h-4 w-4 text-[#cb8954]" />
                  <span className="text-xs font-medium text-gray-600">Όγκος</span>
                </div>
                <div className="text-xl font-bold text-[#cb8954]">
                  {(monthStats.totalVolume / 1000).toFixed(1)}
                </div>
                <p className="text-[10px] text-gray-500">τόνοι (tn)</p>
              </div>
              
              <div className="bg-white p-3 border rounded-none">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium text-gray-600">Χαμένες</span>
                </div>
                <div className="text-xl font-bold text-red-500">{monthStats.missedWorkouts}</div>
                <p className="text-[10px] text-gray-500">προπονήσεις</p>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="week" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Φόρτωση στατιστικών εβδομάδας...</p>
            </div>
          ) : !hasCompletedWorkouts ? (
            <NoStatsMessage />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white p-2 border rounded-none flex flex-col h-16 md:h-20">
                <h4 className="text-[10px] md:text-xs font-medium text-gray-700 mb-1 flex items-center space-x-1">
                  <Activity className="h-3 w-3 text-[#00ffba]" />
                  <span>Προπονήσεις</span>
                </h4>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="text-sm md:text-base font-semibold text-[#00ffba]">
                    {weekStats.completedWorkouts}/{weekStats.totalWorkouts}
                  </div>
                  <p className="text-[10px] text-gray-500">Ολοκληρωμένες</p>
                </div>
              </div>

              <div className="bg-white p-2 border rounded-none flex flex-col h-16 md:h-20">
                <h4 className="text-[10px] md:text-xs font-medium text-gray-700 mb-1 flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span>Ώρες</span>
                </h4>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="text-sm md:text-base font-semibold text-blue-500">
                    {Math.floor(weekStats.totalDurationMinutes / 60)}:{String(weekStats.totalDurationMinutes % 60).padStart(2, '0')}
                  </div>
                  <p className="text-[10px] text-gray-500">Ολοκληρώθηκαν</p>
                </div>
              </div>
              
              <div className="bg-white p-2 border rounded-none flex flex-col h-16 md:h-20">
                <h4 className="text-[10px] md:text-xs font-medium text-gray-700 mb-1 flex items-center space-x-1">
                  <Dumbbell className="h-3 w-3 text-[#cb8954]" />
                  <span>Όγκος</span>
                </h4>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="text-sm md:text-base font-semibold text-[#cb8954]">
                    {(weekStats.totalVolume / 1000).toFixed(1)} tn
                  </div>
                  <p className="text-[10px] text-gray-500">Εβδομάδα</p>
                </div>
              </div>
              
              <div className="bg-white p-2 border rounded-none flex flex-col h-16 md:h-20">
                <h4 className="text-[10px] md:text-xs font-medium text-gray-700 mb-1">
                  <span className="flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <span>Χαμένες</span>
                  </span>
                </h4>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="text-sm md:text-base font-semibold text-red-600">
                    {weekStats.missedWorkouts}
                  </div>
                  <p className="text-[10px] text-gray-500">Εβδομάδα</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="day" className="space-y-4">
          <TodayExercisesCard 
            userPrograms={userPrograms} 
            workoutCompletions={workoutCompletions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutStatsCards } from "./WorkoutStatsCards";
import { DayWeekStatsCards } from "./DayWeekStatsCards";
import { useWorkoutStats } from "./hooks/useWorkoutStats";
import { useDayWeekStats } from "./hooks/useDayWeekStats";
import { useWeekStats } from "./hooks/useWeekStats";

interface CustomMonthStats {
  completedWorkouts: number;
  totalTrainingHours: number;
  totalVolume: number;
  missedWorkouts: number;
  scheduledWorkouts?: number;
}

interface WorkoutStatsTabsSectionProps {
  userId: string;
  onTabChange?: (tab: 'month' | 'week' | 'day') => void;
  customMonthStats?: CustomMonthStats;
}

export const WorkoutStatsTabsSection = ({ userId, onTabChange, customMonthStats }: WorkoutStatsTabsSectionProps) => {
  const { stats: workoutStats, loading: workoutStatsLoading } = useWorkoutStats(userId);
  const { stats: dayWeekStats, loading: dayWeekStatsLoading } = useDayWeekStats(userId);
  const { stats: weekStats, loading: weekStatsLoading } = useWeekStats(userId);
  const monthStatsForCards = customMonthStats ? { currentMonth: customMonthStats, improvements: { workoutsImprovement: 0, hoursImprovement: 0, volumeImprovement: 0 } } : workoutStats;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Στατιστικά Προπονήσεων</h3>
      
      <Tabs defaultValue="month" className="w-full" onValueChange={(value) => onTabChange?.(value as 'month' | 'week' | 'day')}>
        <TabsList className="grid w-full grid-cols-3 rounded-none">
          <TabsTrigger value="month" className="rounded-none">Μήνας</TabsTrigger>
          <TabsTrigger value="week" className="rounded-none">Εβδομάδα</TabsTrigger>
          <TabsTrigger value="day" className="rounded-none">Ημέρα</TabsTrigger>
        </TabsList>
        
        <TabsContent value="month" className="space-y-4">
          {(workoutStatsLoading && !customMonthStats) ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Φόρτωση στατιστικών μήνα...</p>
            </div>
          ) : (
            <WorkoutStatsCards stats={monthStatsForCards as any} />
          )}
        </TabsContent>
        
        <TabsContent value="week" className="space-y-4">
          {weekStatsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Φόρτωση στατιστικών εβδομάδας...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 border rounded-none flex flex-col h-16 md:h-20">
                <h4 className="text-[10px] md:text-xs font-medium text-gray-700 mb-1">Προγρ. Ώρες</h4>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="text-sm md:text-base font-semibold text-blue-600">
                    {Math.floor(weekStats.scheduledMinutes / 60)}:{String(weekStats.scheduledMinutes % 60).padStart(2, '0')}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Εβδομάδα
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-2 border rounded-none flex flex-col h-16 md:h-20">
                <h4 className="text-[10px] md:text-xs font-medium text-gray-700 mb-1">Πραγμ. Ώρες</h4>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="text-sm md:text-base font-semibold text-green-600">
                    {Math.floor(weekStats.actualMinutes / 60)}:{String(weekStats.actualMinutes % 60).padStart(2, '0')}/{Math.floor(weekStats.scheduledMinutes / 60)}:{String(weekStats.scheduledMinutes % 60).padStart(2, '0')}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Ολοκληρώθηκαν
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-2 border rounded-none flex flex-col h-16 md:h-20">
                <h4 className="text-[10px] md:text-xs font-medium text-gray-700 mb-1">Χαμένες</h4>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="text-sm md:text-base font-semibold text-orange-600">
                    {weekStats.missedWorkouts}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Εβδομάδα
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="day" className="space-y-4">
          {dayWeekStatsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Φόρτωση στατιστικών ημέρας...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="bg-white p-2 md:p-3 border rounded-none flex flex-col h-20 md:h-24">
                <h4 className="text-xs font-medium text-gray-700 mb-1">Όγκος</h4>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="text-sm md:text-base font-semibold text-purple-600">
                    {dayWeekStats.currentDay.volume >= 1000 
                      ? `${(dayWeekStats.currentDay.volume / 1000).toFixed(1)}tn`
                      : `${dayWeekStats.currentDay.volume}kg`
                    }
                  </div>
                  <p className="text-xs text-gray-500">
                    Σήμερα
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-2 md:p-3 border rounded-none flex flex-col h-20 md:h-24">
                <h4 className="text-xs font-medium text-gray-700 mb-1">Ώρες</h4>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="text-sm md:text-base font-semibold text-green-600">
                    {dayWeekStats.currentDay.hours}h
                  </div>
                  <p className="text-xs text-gray-500">
                    Σήμερα
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

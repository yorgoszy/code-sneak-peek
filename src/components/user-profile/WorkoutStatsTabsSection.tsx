
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutStatsCards } from "./WorkoutStatsCards";
import { DayWeekStatsCards } from "./DayWeekStatsCards";
import { useWorkoutStats } from "./hooks/useWorkoutStats";
import { useDayWeekStats } from "./hooks/useDayWeekStats";

interface WorkoutStatsTabsSectionProps {
  userId: string;
}

export const WorkoutStatsTabsSection = ({ userId }: WorkoutStatsTabsSectionProps) => {
  const { stats: workoutStats, loading: workoutStatsLoading } = useWorkoutStats(userId);
  const { stats: dayWeekStats, loading: dayWeekStatsLoading } = useDayWeekStats(userId);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Στατιστικά Προπονήσεων</h3>
      
      <Tabs defaultValue="month" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none">
          <TabsTrigger value="month" className="rounded-none">Μήνας</TabsTrigger>
          <TabsTrigger value="week" className="rounded-none">Εβδομάδα</TabsTrigger>
          <TabsTrigger value="day" className="rounded-none">Ημέρα</TabsTrigger>
        </TabsList>
        
        <TabsContent value="month" className="space-y-4">
          {workoutStatsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Φόρτωση στατιστικών μήνα...</p>
            </div>
          ) : (
            <WorkoutStatsCards stats={workoutStats} />
          )}
        </TabsContent>
        
        <TabsContent value="week" className="space-y-4">
          {dayWeekStatsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Φόρτωση στατιστικών εβδομάδας...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 border rounded-none">
                <h4 className="text-md font-medium text-gray-700 mb-4">Στατιστικά Εβδομάδας</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Όγκος:</span>
                    <span className="ml-2 text-lg font-semibold">
                      {dayWeekStats.currentWeek.volume >= 1000 
                        ? `${(dayWeekStats.currentWeek.volume / 1000).toFixed(1)}tn`
                        : `${dayWeekStats.currentWeek.volume}kg`
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Ώρες:</span>
                    <span className="ml-2 text-lg font-semibold">{dayWeekStats.currentWeek.hours}h</span>
                  </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 border rounded-none">
                <h4 className="text-md font-medium text-gray-700 mb-4">Στατιστικά Σήμερα</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Όγκος:</span>
                    <span className="ml-2 text-lg font-semibold">
                      {dayWeekStats.currentDay.volume >= 1000 
                        ? `${(dayWeekStats.currentDay.volume / 1000).toFixed(1)}tn`
                        : `${dayWeekStats.currentDay.volume}kg`
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Ώρες:</span>
                    <span className="ml-2 text-lg font-semibold">{dayWeekStats.currentDay.hours}h</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

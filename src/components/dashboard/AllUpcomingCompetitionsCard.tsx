import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trophy } from "lucide-react";
import { useMemo } from "react";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { format, differenceInCalendarDays } from "date-fns";
import { el } from "date-fns/locale";

interface UpcomingCompetition {
  date: string;
  userName?: string;
  userId?: string;
  programName?: string;
  dayName?: string;
}

export const AllUpcomingCompetitionsCard = () => {
  const { data: activePrograms, isLoading } = useActivePrograms();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const upcomingCompetitions = useMemo<UpcomingCompetition[]>(() => {
    const comps: UpcomingCompetition[] = [];
    if (!activePrograms) return comps;

    for (const assignment of activePrograms) {
      const trainingDates = assignment.training_dates || [];
      const program = assignment.programs as any;
      const user = (assignment as any).app_users as any;
      const weeks = program?.program_weeks || [];
      if (!weeks?.length) continue;

      const daysPerWeek = weeks[0]?.program_days?.length || 0;
      if (!daysPerWeek) continue;

      weeks.forEach((week: any, weekIndex: number) => {
        (week.program_days || []).forEach((day: any, dayIndex: number) => {
          if (day?.is_competition_day) {
            const totalDayIndex = (weekIndex * daysPerWeek) + dayIndex;
            if (totalDayIndex < trainingDates.length) {
              const dateStr = trainingDates[totalDayIndex];
              if (dateStr >= todayStr) {
                comps.push({
                  date: dateStr,
                  userName: user?.name,
                  userId: user?.id,
                  programName: program?.name,
                  dayName: day?.name
                });
              }
            }
          }
        });
      });
    }

    comps.sort((a, b) => a.date.localeCompare(b.date));
    return comps;
  }, [activePrograms, todayStr]);

  const loading = isLoading;

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-[#cb8954]" />
          Επερχόμενοι Αγώνες
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <p>Φόρτωση...</p>
          </div>
        ) : upcomingCompetitions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Δεν υπάρχουν επερχόμενοι αγώνες</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {upcomingCompetitions.map((comp, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-none border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-[#cb8954]" />
                <div>
                  <p className="font-medium text-sm">
                    {format(new Date(comp.date), 'EEEE, d MMMM', { locale: el })}
                  </p>
                  {comp.userName && (
                    <p className="text-xs text-gray-600">{comp.userName}</p>
                  )}
                  {comp.dayName && (
                    <p className="text-xs text-gray-500 italic">{comp.dayName}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {comp.programName && (
                  <p className="text-xs font-medium text-gray-900">{comp.programName}</p>
                )}
                <p className="text-xs text-gray-600">
                  {(() => {
                    const daysLeft = differenceInCalendarDays(new Date(comp.date), new Date());
                    return daysLeft === 0 ? 'σήμερα' : daysLeft === 1 ? 'αύριο' : `σε ${daysLeft} μέρες`;
                  })()}
                </p>
              </div>
            </div>
          ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

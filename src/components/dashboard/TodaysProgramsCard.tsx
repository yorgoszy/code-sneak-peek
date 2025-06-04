
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { CalendarDay } from "@/components/active-programs/calendar/CalendarDay";
import { format } from "date-fns";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface TodaysProgramsCardProps {
  todaysPrograms: EnrichedAssignment[];
  allCompletions: any[];
  onRefresh: () => void;
}

export const TodaysProgramsCard = ({ todaysPrograms, allCompletions, onRefresh }: TodaysProgramsCardProps) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Σημερινά Προγράμματα ({format(new Date(), 'dd/MM/yyyy')})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CalendarDay
          day={new Date()}
          currentDate={new Date()}
          programs={todaysPrograms}
          allCompletions={allCompletions}
          onRefresh={onRefresh}
          isCompactMode={false}
        />
      </CardContent>
    </Card>
  );
};

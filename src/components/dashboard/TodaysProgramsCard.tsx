
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { formatDateToLocalString } from "@/utils/dateUtils";
import { TodaysProgramsList } from "./TodaysProgramsList";

interface TodaysProgramsCardProps {
  todaysPrograms: any[];
  allCompletions: any[];
  onRefresh: () => void;
  onProgramClick: (assignment: any) => void;
}

export const TodaysProgramsCard = ({ 
  todaysPrograms, 
  allCompletions, 
  onRefresh,
  onProgramClick 
}: TodaysProgramsCardProps) => {
  const today = new Date();
  const todayString = formatDateToLocalString(today);
  
  return (
    <Card className="rounded-none w-full max-w-full">
      <CardHeader className="p-2 sm:p-6">
        <CardTitle className="flex items-center text-sm sm:text-base">
          <Activity className="h-4 w-4 mr-2" />
          Σημερινά Προγράμματα ({todayString.split('-').reverse().join('/')})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {todaysPrograms.length > 0 ? (
          <TodaysProgramsList 
            programs={todaysPrograms}
            completions={allCompletions}
            onProgramClick={onProgramClick}
            onRefresh={onRefresh}
          />
        ) : (
          <div className="text-center py-4 sm:py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-base">Δεν έχετε ενεργά προγράμματα</p>
            <p className="text-[10px] sm:text-sm">Επικοινωνήστε με τον προπονητή σας για ανάθεση προγράμματος</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



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
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Σημερινά Προγράμματα ({todayString.split('-').reverse().join('/')})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todaysPrograms.length > 0 ? (
          <TodaysProgramsList 
            programs={todaysPrograms}
            completions={allCompletions}
            onProgramClick={onProgramClick}
            onRefresh={onRefresh}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Δεν έχετε ενεργά προγράμματα</p>
            <p className="text-sm">Επικοινωνήστε με τον προπονητή σας για ανάθεση προγράμματος</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

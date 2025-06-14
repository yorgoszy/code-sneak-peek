
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Play } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

// Δέχεται και customTitle
interface TodaysProgramsSectionProps {
  programsForToday: EnrichedAssignment[];
  workoutCompletions: any[];
  todayStr: string;
  onProgramClick: (assignment: any) => void;
  customTitle?: string;
}

export const TodaysProgramsSection: React.FC<TodaysProgramsSectionProps> = ({
  programsForToday,
  workoutCompletions,
  todayStr,
  onProgramClick,
  customTitle
}) => {
  const getWorkoutStatus = (assignment: any) => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignment.id && c.scheduled_date === todayStr
    );
    return completion?.status || 'scheduled';
  };

  // Εξάγω ημερομηνία από σήμερα (π.χ. 'Τρίτη 10/06')
  const parsedDate = todayStr ? new Date(todayStr) : new Date();
  const day = format(parsedDate, 'EEEE', { locale: el });
  const dateStrShort = format(parsedDate, 'dd/MM', { locale: el });
  const sectionTitle = customTitle || `Προγράμματα ${capitalizeFirstLetter(day)} ${dateStrShort}`;

  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>{sectionTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {programsForToday.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Δεν υπάρχουν προγραμματισμένες προπονήσεις για αυτή την ημέρα
          </div>
        ) : (
          <div className="space-y-3">
            {programsForToday.map(assignment => {
              const status = getWorkoutStatus(assignment);
              
              return (
                <div
                  key={assignment.id}
                  onClick={() => onProgramClick(assignment)}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-none hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={assignment.app_users?.photo_url || undefined} />
                      <AvatarFallback className="bg-gray-200">
                        <User className="w-6 h-6 text-gray-500" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h4 className="font-medium">{assignment.app_users?.name}</h4>
                      <p className="text-sm text-gray-600">{assignment.programs?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-none text-xs ${
                      status === 'completed' ? 'bg-[#00ffba]/10 text-[#00ffba]' :
                      status === 'missed' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {status === 'completed' ? 'Ολοκληρωμένη' :
                       status === 'missed' ? 'Χαμένη' : 'Προγραμματισμένη'}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none"
                      title="Προβολή Προπόνησης"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


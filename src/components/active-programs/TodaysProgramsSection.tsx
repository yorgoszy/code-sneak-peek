
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Play } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { format, isToday } from "date-fns";
import { el } from "date-fns/locale";

interface TodaysProgramsSectionProps {
  programsForToday: EnrichedAssignment[];
  workoutCompletions: any[];
  todayStr: string;
  onProgramClick: (assignment: any) => void;
}

export const TodaysProgramsSection: React.FC<TodaysProgramsSectionProps> = ({
  programsForToday,
  workoutCompletions,
  todayStr,
  onProgramClick
}) => {
  const getWorkoutStatus = (assignment: any) => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignment.id && c.scheduled_date === todayStr
    );
    
    const currentStatus = completion?.status || 'scheduled';
    
    // Ελέγχουμε αν η ημερομηνία έχει περάσει
    const today = new Date();
    const workoutDate = new Date(todayStr);
    const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Αν έχει περάσει η μέρα και δεν έχει ολοκληρωθεί → missed
    if (isPast && currentStatus !== 'completed') {
      return 'missed';
    }
    
    return currentStatus;
  };

  // Μετατρέπουμε το todayStr σε Date
  const selectedDateObj = new Date(todayStr);
  const isTodaySelected = isToday(selectedDateObj);

  // Μορφοποίηση: "Προγράμματα για Τετάρτη 12/06/2025"
  const dayText = isTodaySelected
    ? "Προγράμματα Σήμερα"
    : `Προγράμματα για ${format(selectedDateObj, "EEEE dd/MM/yyyy", { locale: el })}`;

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>{dayText}</CardTitle>
      </CardHeader>
      <CardContent>
        {programsForToday.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Δεν υπάρχουν προγραμματισμένες προπονήσεις για {isTodaySelected ? "σήμερα" : "αυτή την ημέρα"}
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

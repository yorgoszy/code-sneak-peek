
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

  const getRpeScore = (assignment: any): number | null => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignment.id && c.scheduled_date === todayStr
    );
    return completion?.rpe_score || null;
  };

  const getRpeColor = (rpe: number) => {
    if (rpe <= 6) return 'bg-green-500';
    if (rpe <= 8) return 'bg-yellow-500';
    return 'bg-red-500';
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
          <div className="space-y-2 md:space-y-3">
            {programsForToday.map(assignment => {
              const status = getWorkoutStatus(assignment);
              
              return (
                <div
                  key={assignment.id}
                  onClick={() => onProgramClick(assignment)}
                  className="relative p-3 bg-white border border-gray-200 rounded-none hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Κουμπί play και τικ ολοκλήρωσης - πάνω δεξιά */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none p-1.5 h-auto"
                      title="Προβολή Προπόνησης"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    {status === 'completed' && (
                      <div className="w-4 h-4 bg-[#00ffba] rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pr-16">
                    <Avatar className="w-8 h-8 flex-shrink-0 rounded-full">
                      <AvatarImage 
                        src={assignment.app_users?.photo_url || undefined} 
                        className="object-cover rounded-full"
                      />
                      <AvatarFallback className="bg-gray-200 rounded-full">
                        <User className="w-4 h-4 text-gray-500" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate flex items-center gap-1">
                        {assignment.app_users?.name}
                        {status === 'completed' && getRpeScore(assignment) && (
                          <span className={`text-[9px] text-white px-1 py-0.5 rounded-none font-bold ${getRpeColor(getRpeScore(assignment)!)} flex-shrink-0`}>
                            RPE {getRpeScore(assignment)}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-600 truncate">{assignment.programs?.name}</p>
                      {status !== 'completed' && (
                        <div className={`inline-block px-2 py-0.5 rounded-none text-xs mt-1 ${
                          status === 'missed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {status === 'missed' ? 'Χαμένη' : 'Προγραμματισμένη'}
                        </div>
                      )}
                    </div>
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

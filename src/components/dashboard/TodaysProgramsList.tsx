
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Play, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface TodaysProgramsListProps {
  programs: any[];
  completions: any[];
  onProgramClick: (assignment: any) => void;
  onRefresh: () => void;
}

export const TodaysProgramsList: React.FC<TodaysProgramsListProps> = ({
  programs,
  completions,
  onProgramClick,
  onRefresh
}) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const getWorkoutStatus = (assignmentId: string) => {
    const completion = completions.find(c => 
      c.assignment_id === assignmentId && c.scheduled_date === todayStr
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

  const getRpeScore = (assignmentId: string): number | null => {
    const completion = completions.find(c => 
      c.assignment_id === assignmentId && c.scheduled_date === todayStr
    );
    return completion?.rpe_score || null;
  };

  const getRpeColor = (rpe: number) => {
    if (rpe <= 6) return 'bg-green-500';
    if (rpe <= 8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      {programs.map((assignment) => {
        const status = getWorkoutStatus(assignment.id);
        const isCompleted = status === 'completed';
        const isMissed = status === 'missed';

        return (
          <div 
            key={assignment.id}
            onClick={() => onProgramClick(assignment)}
            className="flex items-center justify-between p-2 border border-gray-200 rounded-none hover:bg-gray-50 h-12 cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={assignment.app_users?.photo_url || undefined} />
                <AvatarFallback className="bg-gray-200">
                  <User className="w-4 h-4 text-gray-500" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs truncate flex items-center gap-1">
                  {assignment.app_users?.name}
                  {isCompleted && getRpeScore(assignment.id) && (
                    <span className={`text-[9px] text-white px-1 py-0.5 rounded-none font-bold ${getRpeColor(getRpeScore(assignment.id)!)} flex-shrink-0`}>
                      RPE {getRpeScore(assignment.id)}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-600 truncate">
                  {assignment.programs?.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-[#00ffba]" />
              ) : isMissed ? (
                <CheckCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Play className="h-4 w-4 text-gray-600" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

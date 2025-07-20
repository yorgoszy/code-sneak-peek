
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-3">
      {programs.map((assignment) => {
        const status = getWorkoutStatus(assignment.id);
        const isCompleted = status === 'completed';
        const isMissed = status === 'missed';

        return (
          <div 
            key={assignment.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-none hover:bg-gray-50"
          >
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="w-10 h-10">
                <AvatarImage src={assignment.app_users?.photo_url || undefined} />
                <AvatarFallback className="bg-gray-200">
                  <User className="w-5 h-5 text-gray-500" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {assignment.app_users?.name}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {assignment.programs?.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`rounded-none text-xs ${
                  isCompleted 
                    ? 'bg-[#00ffba]/10 text-[#00ffba] border-[#00ffba]' 
                    : isMissed
                    ? 'bg-red-100 text-red-600 border-red-300'
                    : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}
              >
                {isCompleted ? 'Completed' : isMissed ? 'Missed' : 'Scheduled'}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onProgramClick(assignment)}
                className="h-8 w-8 p-0 rounded-none"
                title={isCompleted ? "Προβολή ολοκληρωμένης προπόνησης" : "Έναρξη προπόνησης"}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-[#00ffba]" />
                ) : isMissed ? (
                  <CheckCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

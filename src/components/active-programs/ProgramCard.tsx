
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Eye, Edit, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { ProgramViewer } from './ProgramViewer';
import { DaySelector } from './DaySelector';
import { AttendanceDialog } from './AttendanceDialog';
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ assignment, onRefresh }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerMode, setViewerMode] = useState<'view' | 'start'>('view');
  const [daySelectorOpen, setDaySelectorOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [workoutStats, setWorkoutStats] = useState({
    completed: 0,
    total: 0,
    missed: 0
  });

  const { getWorkoutCompletions } = useWorkoutCompletions();

  useEffect(() => {
    const fetchWorkoutStats = async () => {
      try {
        const completions = await getWorkoutCompletions(assignment.id);
        const totalWorkouts = assignment.training_dates?.length || 0;
        const completedWorkouts = completions.filter(c => c.status === 'completed').length;
        const missedWorkouts = completions.filter(c => c.status === 'missed').length;
        
        setWorkoutStats({
          completed: completedWorkouts,
          total: totalWorkouts,
          missed: missedWorkouts
        });
      } catch (error) {
        console.error('Error fetching workout stats:', error);
      }
    };

    fetchWorkoutStats();
  }, [assignment.id, getWorkoutCompletions]);

  const userName = assignment.app_users?.name || 'Άγνωστος χρήστης';
  
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  const handleStart = () => {
    setDaySelectorOpen(true);
  };

  const handleDaySelected = (weekIndex: number, dayIndex: number) => {
    setSelectedWeek(weekIndex);
    setSelectedDay(dayIndex);
    setViewerMode('start');
    setViewerOpen(true);
  };

  const handleView = () => {
    setViewerMode('view');
    setViewerOpen(true);
  };

  const handleEdit = () => {
    console.log('Edit program:', assignment.id);
  };

  const handleComplete = () => {
    setAttendanceOpen(true);
  };

  const progressPercentage = workoutStats.total > 0 ? Math.round((workoutStats.completed / workoutStats.total) * 100) : 0;

  return (
    <>
      <Card className="rounded-none hover:shadow-md transition-shadow h-12">
        <CardContent className="p-2 h-full">
          <div className="flex items-center gap-2 h-full">
            {/* Avatar */}
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage 
                src={assignment.app_users?.photo_url} 
                alt={userName}
              />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {getUserInitials(userName)}
              </AvatarFallback>
            </Avatar>
            
            {/* Program Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-gray-900 truncate">
                {assignment.programs?.name || 'Άγνωστο Πρόγραμμα'}
              </h3>
              <p className="text-xs text-gray-600 truncate">
                {userName}
              </p>
            </div>
            
            {/* Progress Stats */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-xs text-gray-700">
                {workoutStats.completed}/{workoutStats.total}
              </div>
              {workoutStats.missed > 0 && (
                <div className="text-xs text-red-600 font-medium">
                  -{workoutStats.missed}
                </div>
              )}
              <div className="w-12">
                <Progress value={progressPercentage} className="h-1" />
              </div>
            </div>
            
            {/* Status Badge */}
            <Badge 
              variant={getStatusBadgeVariant(assignment.status)} 
              className="rounded-none text-xs px-1 py-0.5 flex-shrink-0"
            >
              {assignment.status === 'active' ? 'Ενεργό' : assignment.status}
            </Badge>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-none h-6 w-6 p-0"
                onClick={handleStart}
                title="Έναρξη"
              >
                <Play className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-none h-6 w-6 p-0"
                onClick={handleView}
                title="Προβολή"
              >
                <Eye className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-none h-6 w-6 p-0"
                onClick={handleEdit}
                title="Επεξεργασία"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-none h-6 w-6 p-0"
                onClick={handleComplete}
                title="Ολοκλήρωση"
              >
                <CheckCircle2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DaySelector
        assignment={assignment}
        isOpen={daySelectorOpen}
        onClose={() => setDaySelectorOpen(false)}
        onSelectDay={handleDaySelected}
      />

      <ProgramViewer
        assignment={assignment}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        mode={viewerMode}
        selectedWeek={selectedWeek}
        selectedDay={selectedDay}
      />

      <AttendanceDialog
        assignment={assignment}
        isOpen={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
      />
    </>
  );
};

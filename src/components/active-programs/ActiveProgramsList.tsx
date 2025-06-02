
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Edit, Eye, Play, CheckCircle2 } from "lucide-react";
import { ActiveProgramsActions } from './ActiveProgramsActions';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ActiveProgramsListProps {
  programs: EnrichedAssignment[];
  onRefresh?: () => void;
}

export const ActiveProgramsList: React.FC<ActiveProgramsListProps> = ({ programs, onRefresh }) => {
  const formatTrainingDates = (dates: string[] | undefined) => {
    if (!dates || dates.length === 0) return 'Δεν έχουν οριστεί ημερομηνίες';
    
    // Sort dates and show first few
    const sortedDates = [...dates].sort();
    if (sortedDates.length <= 3) {
      return sortedDates.map(date => new Date(date).toLocaleDateString('el-GR')).join(', ');
    }
    
    const firstTwo = sortedDates.slice(0, 2).map(date => new Date(date).toLocaleDateString('el-GR'));
    return `${firstTwo.join(', ')} και ${sortedDates.length - 2} ακόμη`;
  };

  const getProgramStats = (program: any) => {
    if (!program?.programs?.program_weeks) {
      return { weeksCount: 0, daysCount: 0, trainingDatesCount: 0 };
    }
    
    const weeks = program.programs.program_weeks;
    const weeksCount = weeks.length;
    const daysCount = weeks.reduce((total: number, week: any) => 
      total + (week.program_days?.length || 0), 0);
    const trainingDatesCount = program.training_dates?.length || 0;
    
    return { weeksCount, daysCount, trainingDatesCount };
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (programs.length === 0) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Ενεργά Προγράμματα
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Δεν έχετε ενεργά προγράμματα</p>
            <p className="text-sm">Επικοινωνήστε με τον προπονητή σας για ανάθεση προγράμματος</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Λίστα Προγραμμάτων</h2>
        <Badge variant="outline" className="rounded-none">
          {programs.length} {programs.length === 1 ? 'Πρόγραμμα' : 'Προγράμματα'}
        </Badge>
      </div>
      
      <div className="grid gap-4">
        {programs.map((assignment) => {
          const { weeksCount, daysCount, trainingDatesCount } = getProgramStats(assignment);
          const progress = assignment.progress || 0;
          const userName = assignment.app_users?.name || 'Άγνωστος χρήστης';
          
          return (
            <Card key={assignment.id} className="rounded-none hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={assignment.app_users?.photo_url} 
                        alt={userName}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getUserInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">
                        {assignment.programs?.name || 'Άγνωστο Πρόγραμμα'}
                      </CardTitle>
                      {assignment.programs?.description && (
                        <p className="text-sm text-gray-600">
                          {assignment.programs.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{userName}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getStatusBadgeVariant(assignment.status)} 
                      className="rounded-none"
                    >
                      {assignment.status === 'active' ? 'Ενεργό' : assignment.status}
                    </Badge>
                    <ActiveProgramsActions 
                      assignment={assignment} 
                      onRefresh={onRefresh}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Πρόοδος */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Πρόοδος</span>
                    <span className="text-gray-600">{progress}%</span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2" 
                  />
                </div>
                
                {/* Στατιστικά προγράμματος */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-lg font-semibold text-blue-600">{weeksCount}</div>
                    <div className="text-xs text-gray-600">Εβδομάδες</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-lg font-semibold text-green-600">{daysCount}</div>
                    <div className="text-xs text-gray-600">Ημέρες</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-lg font-semibold text-purple-600">{trainingDatesCount}</div>
                    <div className="text-xs text-gray-600">Προπονήσεις</div>
                  </div>
                </div>
                
                {/* Ημερομηνίες προπόνησης */}
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Ημερομηνίες προπόνησης:</span>
                  </div>
                  <div className="text-gray-600 ml-6 bg-gray-50 p-2 rounded">
                    {formatTrainingDates(assignment.training_dates)}
                  </div>
                </div>
                
                {/* Περίοδος προγράμματος */}
                {(assignment.start_date || assignment.end_date) && (
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Περίοδος:</span>
                    </div>
                    <div className="text-gray-600 ml-6">
                      {assignment.start_date && (
                        <span>Από {new Date(assignment.start_date).toLocaleDateString('el-GR')}</span>
                      )}
                      {assignment.start_date && assignment.end_date && <span> - </span>}
                      {assignment.end_date && (
                        <span>Έως {new Date(assignment.end_date).toLocaleDateString('el-GR')}</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Σημειώσεις */}
                {assignment.notes && (
                  <div className="text-sm">
                    <span className="font-medium">Σημειώσεις: </span>
                    <span className="text-gray-600">{assignment.notes}</span>
                  </div>
                )}
                
                {/* Ενέργειες */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" className="rounded-none flex items-center gap-1">
                    <Play className="w-4 h-4" />
                    Έναρξη
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-none flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    Προβολή
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-none flex items-center gap-1">
                    <Edit className="w-4 h-4" />
                    Επεξεργασία
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-none flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Ολοκλήρωση
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

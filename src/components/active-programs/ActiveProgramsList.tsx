
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ActiveProgramsListProps {
  programs: EnrichedAssignment[];
}

export const ActiveProgramsList: React.FC<ActiveProgramsListProps> = ({ programs }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Δεν έχει οριστεί';
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const getProgramStats = (program: any) => {
    if (!program?.programs?.program_weeks) {
      return { weeksCount: 0, daysCount: 0, exercisesCount: 0 };
    }
    
    const weeks = program.programs.program_weeks;
    const weeksCount = weeks.length;
    const daysCount = weeks.reduce((total: number, week: any) => 
      total + (week.program_days?.length || 0), 0);
    
    return { weeksCount, daysCount, exercisesCount: 0 };
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
      <h2 className="text-xl font-semibold">Λίστα Προγραμμάτων</h2>
      
      <div className="grid gap-4">
        {programs.map((assignment) => {
          const { weeksCount, daysCount } = getProgramStats(assignment);
          
          return (
            <Card key={assignment.id} className="rounded-none">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {assignment.programs?.name || 'Άγνωστο Πρόγραμμα'}
                    </CardTitle>
                    {assignment.programs?.description && (
                      <p className="text-sm text-gray-600">
                        {assignment.programs.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="rounded-none">
                    {assignment.status === 'active' ? 'Ενεργό' : assignment.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>Έναρξη: {formatDate(assignment.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Λήξη: {formatDate(assignment.end_date)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{weeksCount} εβδομάδες</span>
                  <span>{daysCount} ημέρες προπόνησης</span>
                </div>
                
                {assignment.app_users && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Ασκούμενος: {assignment.app_users.name}</span>
                  </div>
                )}
                
                {assignment.notes && (
                  <div className="text-sm">
                    <span className="font-medium">Σημειώσεις: </span>
                    <span className="text-gray-600">{assignment.notes}</span>
                  </div>
                )}
                
                {assignment.progress !== undefined && (
                  <div className="text-sm">
                    <span className="font-medium">Πρόοδος: </span>
                    <span className="text-gray-600">{assignment.progress}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

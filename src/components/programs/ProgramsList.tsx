
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Edit, Copy, Eye, User, Calendar } from "lucide-react";
import { Program } from './types';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { parseDateFromString } from '@/utils/dateUtils';

interface ProgramsListProps {
  programs: Program[];
  selectedProgram: Program | null;
  onSelectProgram: (program: Program) => void;
  onDeleteProgram: (programId: string) => void;
  onEditProgram: (program: Program) => void;
  onDuplicateProgram?: (program: Program) => void;
  onPreviewProgram?: (program: Program) => void;
}

export const ProgramsList: React.FC<ProgramsListProps> = ({
  programs,
  selectedProgram,
  onSelectProgram,
  onDeleteProgram,
  onEditProgram,
  onDuplicateProgram,
  onPreviewProgram
}) => {
  const getProgramStats = (program: Program) => {
    const weeksCount = program.program_weeks?.length || 0;
    const avgDaysPerWeek = weeksCount > 0 
      ? Math.round((program.program_weeks?.reduce((total, week) => total + (week.program_days?.length || 0), 0) || 0) / weeksCount)
      : 0;
    
    return { weeksCount, avgDaysPerWeek };
  };

  const getAssignmentInfo = (program: Program) => {
    const assignment = program.program_assignments?.[0];
    if (!assignment) return null;

    const totalSessions = assignment.training_dates?.length || 0;
    const completedSessions = Math.floor(totalSessions * 0.3); // Mock: 30% completed
    const remainingSessions = totalSessions - completedSessions;
    const progressPercentage = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    
    return {
      totalSessions,
      completedSessions,
      remainingSessions,
      progressPercentage,
      assignmentDate: assignment.created_at ? format(new Date(assignment.created_at), 'dd/MM/yyyy', { locale: el }) : '',
      athletePhoto: assignment.app_users?.photo_url,
      athleteName: assignment.app_users?.name,
      trainingDates: assignment.training_dates || []
    };
  };

  // Διόρθωση: Προσθήκη proper handler για διαγραφή με μεγαλύτερη περιοχή κλικ
  const handleDeleteProgram = (e: React.MouseEvent, programId: string) => {
    e.stopPropagation();
    console.log('🗑️ Attempting to delete program:', programId);
    
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;')) {
      console.log('✅ User confirmed deletion, calling onDeleteProgram with:', programId);
      onDeleteProgram(programId);
    }
  };

  if (programs.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4">Προγράμματα</h2>
        <div className="text-center py-8 text-gray-500">
          Δεν υπάρχουν προγράμματα ακόμα
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Προγράμματα</h2>
      <div className="space-y-3">
        {programs.map(program => {
          const { weeksCount, avgDaysPerWeek } = getProgramStats(program);
          const assignmentInfo = getAssignmentInfo(program);
          const isAssigned = assignmentInfo !== null;
          
          return (
            <div
              key={program.id}
              className={`p-4 border cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedProgram?.id === program.id ? 'bg-blue-50 border-blue-300' : ''
              } ${isAssigned ? 'min-w-[900px]' : 'min-w-[600px]'}`}
              onClick={() => onSelectProgram(program)}
            >
              <div className="space-y-3">
                {/* Header with title and actions */}
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Athlete Photo - show for assigned programs */}
                    {isAssigned && assignmentInfo && (
                      <Avatar className="w-16 h-16 flex-shrink-0">
                        <AvatarImage src={assignmentInfo.athletePhoto || undefined} />
                        <AvatarFallback className="bg-gray-200">
                          <User className="w-8 h-8 text-gray-500" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {/* Program Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-lg">{program.name}</h4>
                      {isAssigned && assignmentInfo && (
                        <p className="text-sm text-gray-600 font-medium">{assignmentInfo.athleteName}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {weeksCount} εβδομάδες • {avgDaysPerWeek} ημέρες/εβδομάδα
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    {onPreviewProgram && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewProgram(program);
                        }}
                        className="rounded-none"
                        title="Προεπισκόπηση"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProgram(program);
                      }}
                      className="rounded-none"
                      title="Επεξεργασία"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {onDuplicateProgram && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateProgram(program);
                        }}
                        className="rounded-none"
                        title="Αντιγραφή"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    {/* Μεγαλύτερη περιοχή κλικ για διαγραφή */}
                    <div
                      onClick={(e) => handleDeleteProgram(e, program.id)}
                      className="flex items-center justify-center p-2 hover:bg-red-50 cursor-pointer rounded-none border border-transparent hover:border-red-200"
                      title="Διαγραφή"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Assignment Details - show for assigned programs */}
                {isAssigned && assignmentInfo && (
                  <div className="space-y-3 pl-20">
                    {/* Assignment Date */}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Ημερομηνία Ανάθεσης:</span> {assignmentInfo.assignmentDate}
                    </div>
                    
                    {/* Training Dates */}
                    {assignmentInfo.trainingDates.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Ημερομηνίες Προπόνησης ({assignmentInfo.trainingDates.length})
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {assignmentInfo.trainingDates.slice(0, 8).map((date, index) => (
                            <span 
                              key={index}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                            >
                              {format(parseDateFromString(date), 'dd/MM', { locale: el })}
                            </span>
                          ))}
                          {assignmentInfo.trainingDates.length > 8 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{assignmentInfo.trainingDates.length - 8} ακόμα
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Progress Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Πρόοδος Προγράμματος</span>
                        <span className="text-gray-600">
                          {assignmentInfo.completedSessions}/{assignmentInfo.totalSessions} προπονήσεις
                        </span>
                      </div>
                      <Progress 
                        value={assignmentInfo.progressPercentage} 
                        className="h-3 w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Ολοκληρώθηκαν: {assignmentInfo.completedSessions}</span>
                        <span>Απομένουν: {assignmentInfo.remainingSessions}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

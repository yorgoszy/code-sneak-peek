
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Edit, Copy, Eye, User } from "lucide-react";
import { Program } from './types';

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
    const totalSessions = program.program_weeks?.reduce((total, week) => 
      total + (week.program_days?.length || 0), 0) || 0;
    const completedSessions = Math.floor(totalSessions * 0.3); // Mock: 30% completed
    const remainingSessions = totalSessions - completedSessions;
    const progressPercentage = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    
    return {
      totalSessions,
      completedSessions,
      remainingSessions,
      progressPercentage,
      assignmentDate: new Date().toLocaleDateString('el-GR'),
      athletePhoto: null
    };
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
          const isAssigned = program.app_users;
          
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
                    {isAssigned && (
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
                      {program.app_users && (
                        <p className="text-sm text-gray-600 font-medium">{program.app_users.name}</p>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProgram(program.id);
                      }}
                      className="rounded-none"
                      title="Διαγραφή"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Assignment Details - show for assigned programs */}
                {isAssigned && (
                  <div className="space-y-3 pl-20">
                    {/* Assignment Date */}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Ημερομηνία Ανάθεσης:</span> {assignmentInfo.assignmentDate}
                    </div>
                    
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

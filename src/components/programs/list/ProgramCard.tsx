
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { Program } from '../types';
import { ProgramStats } from './ProgramStats';
import { ProgramActions } from './ProgramActions';
import { ProgramAssignmentInfo } from './ProgramAssignmentInfo';

interface ProgramCardProps {
  program: Program;
  selectedProgram: Program | null;
  onSelectProgram: (program: Program) => void;
  onDeleteProgram: (programId: string) => void;
  onEditProgram: (program: Program) => void;
  onDuplicateProgram?: (program: Program) => void;
  onPreviewProgram?: (program: Program) => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  selectedProgram,
  onSelectProgram,
  onDeleteProgram,
  onEditProgram,
  onDuplicateProgram,
  onPreviewProgram
}) => {
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
              <ProgramStats program={program} />
            </div>
          </div>
          
          {/* Action Buttons */}
          <ProgramActions
            program={program}
            onEditProgram={onEditProgram}
            onDeleteProgram={onDeleteProgram}
            onDuplicateProgram={onDuplicateProgram}
            onPreviewProgram={onPreviewProgram}
          />
        </div>

        {/* Assignment Details - show for assigned programs */}
        {isAssigned && (
          <ProgramAssignmentInfo assignmentInfo={assignmentInfo} />
        )}
      </div>
    </div>
  );
};


import React from 'react';
import { Progress } from "@/components/ui/progress";

interface AssignmentInfoType {
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  progressPercentage: number;
  assignmentDate: string;
}

interface ProgramAssignmentInfoProps {
  assignmentInfo: AssignmentInfoType;
}

export const ProgramAssignmentInfo: React.FC<ProgramAssignmentInfoProps> = ({ assignmentInfo }) => {
  return (
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
  );
};

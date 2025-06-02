
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ProgramCard } from './ProgramCard';
import { EmptyProgramsState } from './EmptyProgramsState';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ActiveProgramsListProps {
  programs: EnrichedAssignment[];
  onRefresh?: () => void;
}

export const ActiveProgramsList: React.FC<ActiveProgramsListProps> = ({ programs, onRefresh }) => {
  if (programs.length === 0) {
    return <EmptyProgramsState />;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Λίστα Προγραμμάτων</h2>
        <Badge variant="outline" className="rounded-none">
          {programs.length} {programs.length === 1 ? 'Πρόγραμμα' : 'Προγράμματα'}
        </Badge>
      </div>
      
      <div className="space-y-1">
        {programs.map((assignment) => (
          <ProgramCard 
            key={assignment.id}
            assignment={assignment} 
            onRefresh={onRefresh} 
          />
        ))}
      </div>
    </div>
  );
};

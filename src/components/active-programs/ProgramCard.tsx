
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgramCardHeader } from './ProgramCardHeader';
import { ProgramCardStats } from './ProgramCardStats';
import { ProgramCardActions } from './ProgramCardActions';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ assignment, onRefresh }) => {
  return (
    <Card key={assignment.id} className="rounded-none hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <ProgramCardHeader assignment={assignment} onRefresh={onRefresh} />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ProgramCardStats assignment={assignment} />
        <ProgramCardActions />
      </CardContent>
    </Card>
  );
};


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { ProgramCard } from "../ProgramCard";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramsForDateCardProps {
  selectedDate: Date | undefined;
  programsForSelectedDate: EnrichedAssignment[];
  onRefresh: () => void;
  onDelete: (assignmentId: string) => void;
}

export const ProgramsForDateCard: React.FC<ProgramsForDateCardProps> = ({
  selectedDate,
  programsForSelectedDate,
  onRefresh,
  onDelete
}) => {
  if (programsForSelectedDate.length === 0) return null;

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg">
          Προγράμματα για {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: el }) : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {programsForSelectedDate.map((assignment) => (
            <ProgramCard
              key={assignment.id}
              assignment={assignment}
              selectedDate={selectedDate}
              onRefresh={onRefresh}
              onDelete={onDelete}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

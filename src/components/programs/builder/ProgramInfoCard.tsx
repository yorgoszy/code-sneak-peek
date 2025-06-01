
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from '../types';
import type { ProgramStructure } from './hooks/useProgramBuilderState';

interface ProgramInfoCardProps {
  program: ProgramStructure;
  selectedUser: User | undefined;
  totalWeeks: number;
  daysPerWeek: number;
  totalRequiredSessions: number;
}

export const ProgramInfoCard: React.FC<ProgramInfoCardProps> = ({
  program,
  selectedUser,
  totalWeeks,
  daysPerWeek,
  totalRequiredSessions
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg">Στοιχεία Προγράμματος</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Όνομα:</span> {program.name}
          </div>
          <div>
            <span className="font-medium">Ασκούμενος:</span> {selectedUser ? selectedUser.name : 'Δεν έχει επιλεγεί'}
          </div>
          <div>
            <span className="font-medium">Εβδομάδες:</span> {totalWeeks}
          </div>
          <div>
            <span className="font-medium">Ημέρες/Εβδομάδα:</span> {daysPerWeek}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Συνολικές Προπονήσεις:</span> {totalRequiredSessions}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

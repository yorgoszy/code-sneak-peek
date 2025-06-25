
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Target, Users, User } from "lucide-react";
import type { ProgramStructure } from './hooks/useProgramBuilderState';

interface ProgramInfoCardProps {
  program: ProgramStructure;
  selectedUser?: any;
  totalWeeks: number;
  daysPerWeek: number;
  totalRequiredSessions: number;
  assignmentType?: 'individual' | 'group';
}

export const ProgramInfoCard: React.FC<ProgramInfoCardProps> = ({
  program,
  selectedUser,
  totalWeeks,
  daysPerWeek,
  totalRequiredSessions,
  assignmentType = 'individual'
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Στοιχεία Ανάθεσης
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Program Info */}
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900">Πρόγραμμα</h4>
              <p className="text-sm text-gray-600">{program.name}</p>
              {program.description && (
                <p className="text-xs text-gray-500 mt-1">{program.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-none">
                <Clock className="w-3 h-3 mr-1" />
                {totalWeeks} εβδομάδες
              </Badge>
              <Badge variant="outline" className="rounded-none">
                <Calendar className="w-3 h-3 mr-1" />
                {daysPerWeek} ημέρες/εβδομάδα
              </Badge>
              <Badge variant="outline" className="rounded-none">
                <Target className="w-3 h-3 mr-1" />
                {totalRequiredSessions} συνολικές προπονήσεις
              </Badge>
            </div>
          </div>

          {/* Recipient Info */}
          {selectedUser && (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  {assignmentType === 'individual' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  {assignmentType === 'individual' ? 'Αθλητής' : 'Ομάδα'}
                </h4>
                <p className="text-sm text-gray-600">{selectedUser.name}</p>
                {assignmentType === 'individual' && selectedUser.email && (
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                )}
                {assignmentType === 'group' && selectedUser.description && (
                  <p className="text-xs text-gray-500">{selectedUser.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {assignmentType === 'individual' && selectedUser.role && (
                  <Badge variant="secondary" className="rounded-none">
                    {selectedUser.role}
                  </Badge>
                )}
                {assignmentType === 'group' && selectedUser.member_count && (
                  <Badge variant="secondary" className="rounded-none">
                    <Users className="w-3 h-3 mr-1" />
                    {selectedUser.member_count} μέλη
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedUser && assignmentType === 'group' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <Users className="w-4 h-4 inline mr-1" />
              Θα δημιουργηθούν {selectedUser.member_count} ατομικές αναθέσεις για τα μέλη της ομάδας.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

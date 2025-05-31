
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Copy } from "lucide-react";
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
  onDuplicateProgram
}) => {
  const getProgramStats = (program: Program) => {
    const weeksCount = program.program_weeks?.length || 0;
    const avgDaysPerWeek = weeksCount > 0 
      ? Math.round((program.program_weeks?.reduce((total, week) => total + (week.program_days?.length || 0), 0) || 0) / weeksCount)
      : 0;
    
    return { weeksCount, avgDaysPerWeek };
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Προγράμματα</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {programs.map(program => {
            const { weeksCount, avgDaysPerWeek } = getProgramStats(program);
            
            return (
              <div
                key={program.id}
                className={`p-3 border cursor-pointer hover:bg-gray-50 ${
                  selectedProgram?.id === program.id ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => onSelectProgram(program)}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{program.name}</h4>
                      {program.app_users && (
                        <p className="text-sm text-gray-600">{program.app_users.name}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {weeksCount} εβδομάδες • {avgDaysPerWeek} ημέρες/εβδομάδα
                      </div>
                    </div>
                    <div className="flex gap-1">
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
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

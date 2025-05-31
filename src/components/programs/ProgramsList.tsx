
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { Program } from './types';

interface ProgramsListProps {
  programs: Program[];
  selectedProgram: Program | null;
  onSelectProgram: (program: Program) => void;
  onDeleteProgram: (programId: string) => void;
  onEditProgram: (program: Program) => void;
}

export const ProgramsList: React.FC<ProgramsListProps> = ({
  programs,
  selectedProgram,
  onSelectProgram,
  onDeleteProgram,
  onEditProgram
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Προγράμματα</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {programs.map(program => (
            <div
              key={program.id}
              className={`p-3 border cursor-pointer hover:bg-gray-50 ${
                selectedProgram?.id === program.id ? 'bg-blue-50 border-blue-300' : ''
              }`}
              onClick={() => onSelectProgram(program)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{program.name}</h4>
                  {program.app_users && (
                    <p className="text-sm text-gray-600">{program.app_users.name}</p>
                  )}
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
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProgram(program.id);
                    }}
                    className="rounded-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

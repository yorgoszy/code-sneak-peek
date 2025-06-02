
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Copy, Eye } from "lucide-react";
import { Program } from '../types';

interface ProgramActionsProps {
  program: Program;
  onEditProgram: (program: Program) => void;
  onDeleteProgram: (programId: string) => void;
  onDuplicateProgram?: (program: Program) => void;
  onPreviewProgram?: (program: Program) => void;
}

export const ProgramActions: React.FC<ProgramActionsProps> = ({
  program,
  onEditProgram,
  onDeleteProgram,
  onDuplicateProgram,
  onPreviewProgram
}) => {
  return (
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
  );
};

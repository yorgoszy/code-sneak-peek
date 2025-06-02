
import React from 'react';
import { MoreHorizontal, Edit, Copy, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Program } from '../types';
import { useNavigate } from "react-router-dom";

interface ProgramActionsProps {
  program: Program;
  onEdit: (program: Program) => void;
  onDuplicate: (program: Program) => void;
  onDelete: (programId: string) => void;
  onPreview: (program: Program) => void;
}

export const ProgramActions: React.FC<ProgramActionsProps> = ({
  program,
  onEdit,
  onDuplicate,
  onDelete,
  onPreview
}) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/dashboard/program-builder-fullscreen?id=${program.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 rounded-none">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none">
        <DropdownMenuItem onClick={() => onPreview(program)} className="rounded-none">
          <Eye className="mr-2 h-4 w-4" />
          Προβολή
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit} className="rounded-none">
          <Edit className="mr-2 h-4 w-4" />
          Επεξεργασία
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(program)} className="rounded-none">
          <Copy className="mr-2 h-4 w-4" />
          Αντιγραφή
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onDelete(program.id)} 
          className="text-red-600 rounded-none"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Διαγραφή
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

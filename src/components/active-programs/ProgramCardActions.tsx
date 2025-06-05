
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Play, Eye, Edit, CheckCircle } from "lucide-react";
import { ProgramViewDialog } from "./calendar/ProgramViewDialog";
import { DayProgramDialog } from "./calendar/DayProgramDialog";
import { DaySelector } from "./calendar/DaySelector";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardActionsProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
}

export const ProgramCardActions: React.FC<ProgramCardActionsProps> = ({ assignment, onRefresh }) => {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [daySelectorOpen, setDaySelectorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleStartWorkout = (weekIndex: number, dayIndex: number) => {
    // Logic to start workout
    console.log('Starting workout:', weekIndex, dayIndex);
  };

  const handleQuickStart = () => {
    setDaySelectorOpen(true);
  };

  const handleDaySelected = (weekIndex: number, dayIndex: number) => {
    setDaySelectorOpen(false);
    // Start workout logic here
    console.log('Quick start workout:', weekIndex, dayIndex);
  };

  return (
    <>
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Status Badge */}
        <Badge 
          variant="outline" 
          className="rounded-none bg-[#00ffba]/10 text-[#00ffba] border-[#00ffba] text-xs px-1 py-0"
        >
          Active
        </Badge>

        {/* Action Buttons */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuickStart}
            className="h-6 w-6 p-0 rounded-none"
            title="Έναρξη Προπόνησης"
          >
            <Play className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewDialogOpen(true)}
            className="h-6 w-6 p-0 rounded-none"
            title="Προβολή Προγράμματος"
          >
            <Eye className="h-3 w-3" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-none">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none">
              <DropdownMenuItem>
                <Edit className="h-3 w-3 mr-2" />
                Επεξεργασία
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CheckCircle className="h-3 w-3 mr-2" />
                Ολοκλήρωση
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dialogs */}
      <ProgramViewDialog
        isOpen={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        assignment={assignment}
        onStartWorkout={handleStartWorkout}
      />

      <DayProgramDialog
        isOpen={dayDialogOpen}
        onClose={() => setDayDialogOpen(false)}
        program={assignment}
        selectedDate={selectedDate}
        workoutStatus="scheduled"
        onRefresh={onRefresh}
      />

      <DaySelector
        assignment={assignment}
        isOpen={daySelectorOpen}
        onClose={() => setDaySelectorOpen(false)}
        onSelectDay={handleDaySelected}
      />
    </>
  );
};

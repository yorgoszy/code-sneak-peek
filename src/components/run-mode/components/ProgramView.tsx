
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Navigation, X } from 'lucide-react';
import { DayProgramDialog } from '../../active-programs/calendar/DayProgramDialog';
import { format } from 'date-fns';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramViewProps {
  quarterId: number;
  selectedProgram: {
    program: EnrichedAssignment;
    date: Date;
    status: string;
  };
  selectedUser: any;
  onBack: () => void;
  onClose: () => void;
  onNavigate: () => void;
  onRemove: () => void;
  canRemove: boolean;
  onRefresh: () => void;
}

export const ProgramView: React.FC<ProgramViewProps> = ({
  quarterId,
  selectedProgram,
  selectedUser,
  onBack,
  onClose,
  onNavigate,
  onRemove,
  canRemove,
  onRefresh
}) => {
  return (
    <Card className="border-2 border-gray-600 bg-gray-900/50 bg-opacity-80 backdrop-blur-sm h-full flex flex-col relative">
      <CardHeader className="pb-1 flex-shrink-0 p-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-[#00ffba] hover:text-white hover:bg-[#00ffba]/20 p-1 h-6 w-6"
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <h3 className="text-xs font-medium text-white">
              Τετάρτημόριο {quarterId} - {selectedUser?.name}
            </h3>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              onClick={onNavigate}
              variant="ghost"
              size="sm"
              className="text-[#00ffba] hover:text-white hover:bg-[#00ffba]/20 p-1 h-6 w-6"
            >
              <Navigation className="h-3 w-3" />
            </Button>
            {canRemove && (
              <Button
                onClick={onRemove}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-300">
          {format(selectedProgram.date, 'dd/MM/yyyy')}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-1">
        <div className="h-full bg-gray-800 border border-gray-600 overflow-auto">
          <DayProgramDialog
            isOpen={true}
            onClose={onClose}
            program={selectedProgram.program}
            selectedDate={selectedProgram.date}
            workoutStatus={selectedProgram.status}
            onRefresh={onRefresh}
            isEmbedded={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};

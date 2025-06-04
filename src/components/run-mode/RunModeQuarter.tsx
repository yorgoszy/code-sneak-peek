
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Play, Square, CheckCircle } from 'lucide-react';
import { QuarterCalendarView } from './QuarterCalendarView';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface RunModeQuarterProps {
  quarterId: number;
  programs: EnrichedAssignment[];
  onRemove: () => void;
  canRemove: boolean;
}

export const RunModeQuarter: React.FC<RunModeQuarterProps> = ({
  quarterId,
  programs,
  onRemove,
  canRemove
}) => {
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  const handleStart = () => {
    if (selectedProgram) {
      setStatus('running');
    }
  };

  const handleStop = () => {
    setStatus('idle');
  };

  const handleComplete = () => {
    setStatus('completed');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'border-yellow-500 bg-yellow-900/20';
      case 'completed': return 'border-[#00ffba] bg-green-900/20';
      default: return 'border-gray-600 bg-gray-900/50';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-[#00ffba]" />;
      default: return null;
    }
  };

  const handleDayClick = (date: Date, dayPrograms: EnrichedAssignment[]) => {
    console.log('Day clicked:', date, 'Programs:', dayPrograms);
    // Μπορούμε να προσθέσουμε περισσότερη λογική εδώ αργότερα
  };

  return (
    <Card className={`rounded-none border-2 ${getStatusColor()} bg-opacity-80 backdrop-blur-sm h-full`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-white">Τεταρτημόριο {quarterId}</h3>
            {getStatusIcon()}
          </div>
          {canRemove && (
            <Button
              onClick={onRemove}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-none p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 overflow-hidden">
        {/* Program Selection */}
        <div className="space-y-2">
          <label className="text-xs text-gray-300">Επιλογή Προγράμματος:</label>
          <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white rounded-none">
              <SelectValue placeholder="Επιλέξτε πρόγραμμα..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 rounded-none">
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id} className="text-white hover:bg-gray-700">
                  {program.programs?.name} - {program.app_users?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-2">
          {status === 'idle' && (
            <Button
              onClick={handleStart}
              disabled={!selectedProgram}
              className="flex-1 bg-[#00ffba] text-black hover:bg-[#00ffba]/80 rounded-none"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Έναρξη
            </Button>
          )}
          
          {status === 'running' && (
            <>
              <Button
                onClick={handleStop}
                variant="outline"
                className="flex-1 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-none"
                size="sm"
              >
                <Square className="h-4 w-4 mr-2" />
                Διακοπή
              </Button>
              <Button
                onClick={handleComplete}
                className="flex-1 bg-[#00ffba] text-black hover:bg-[#00ffba]/80 rounded-none"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Ολοκλήρωση
              </Button>
            </>
          )}
          
          {status === 'completed' && (
            <Button
              onClick={handleStop}
              variant="outline"
              className="flex-1 border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba] hover:text-black rounded-none"
              size="sm"
            >
              Επαναφορά
            </Button>
          )}
        </div>

        {/* Calendar View */}
        <div className="flex-1 overflow-hidden">
          <QuarterCalendarView 
            programs={programs}
            allCompletions={[]} // Μπορούμε να προσθέσουμε αργότερα
            onDayClick={handleDayClick}
          />
        </div>
      </CardContent>
    </Card>
  );
};

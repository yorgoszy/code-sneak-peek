
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgramCalendar } from '../active-programs/ProgramCalendar';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useNavigate } from 'react-router-dom';
import { AthleteSelector } from './components/AthleteSelector';
import { AthleteInfo } from './components/AthleteInfo';
import { QuarterHeader } from './components/QuarterHeader';
import { ProgramView } from './components/ProgramView';
import { EmptyQuarterState } from './components/EmptyQuarterState';

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
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<{
    program: EnrichedAssignment;
    date: Date;
    status: string;
  } | null>(null);
  const [showProgramView, setShowProgramView] = useState(false);

  // Παίρνουμε όλους τους μοναδικούς χρήστες από τα προγράμματα
  const uniqueUsers = programs.reduce((acc, program) => {
    if (program.app_users && !acc.find(u => u.id === program.app_users.id)) {
      acc.push(program.app_users);
    }
    return acc;
  }, [] as any[]);

  // Φιλτράρουμε τα προγράμματα για τον επιλεγμένο χρήστη
  const userPrograms = programs.filter(program => 
    program.app_users?.id === selectedUserId
  );

  const selectedUser = uniqueUsers.find(user => user.id === selectedUserId);

  const handleRefresh = () => {
    console.log('Refreshing quarter calendar...');
  };

  const handleNavigate = () => {
    navigate('/dashboard');
  };

  const handleProgramClick = (program: EnrichedAssignment, date: Date, status: string) => {
    setSelectedProgram({ program, date, status });
    setShowProgramView(true);
  };

  const handleBackToCalendar = () => {
    setShowProgramView(false);
    setSelectedProgram(null);
  };

  const handleCloseProgramView = () => {
    setShowProgramView(false);
    setSelectedProgram(null);
  };

  if (showProgramView && selectedProgram) {
    return (
      <ProgramView
        quarterId={quarterId}
        selectedProgram={selectedProgram}
        selectedUser={selectedUser}
        onBack={handleBackToCalendar}
        onClose={handleCloseProgramView}
        onNavigate={handleNavigate}
        onRemove={onRemove}
        canRemove={canRemove}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <Card className="border-2 border-gray-600 bg-gray-900/50 bg-opacity-80 backdrop-blur-sm h-full flex flex-col relative">
      <CardHeader className="pb-1 flex-shrink-0 p-2">
        <QuarterHeader
          quarterId={quarterId}
          onNavigate={handleNavigate}
          onRemove={onRemove}
          canRemove={canRemove}
        />

        <div className="space-y-2">
          <AthleteSelector
            uniqueUsers={uniqueUsers}
            selectedUserId={selectedUserId}
            onUserChange={setSelectedUserId}
          />

          <AthleteInfo user={selectedUser} />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-1 relative">
        <div className="h-full w-full">
          {selectedUserId ? (
            <ProgramCalendar 
              programs={userPrograms}
              onRefresh={handleRefresh}
              isCompactMode={true}
              onProgramClick={handleProgramClick}
            />
          ) : (
            <EmptyQuarterState />
          )}
        </div>
      </CardContent>
    </Card>
  );
};


import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi } from "lucide-react";
import { ProgramCard } from './ProgramCard';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ActiveProgramsListProps {
  programs: EnrichedAssignment[];
  onRefresh?: () => void;
}

export const ActiveProgramsList: React.FC<ActiveProgramsListProps> = ({ programs, onRefresh }) => {
  const handleRefresh = () => {
    console.log('🔄 Refreshing programs list...');
    if (onRefresh) {
      onRefresh();
    }
  };

  if (programs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Δεν βρέθηκαν ενεργά προγράμματα</p>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="mt-4 rounded-none"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Ανανέωση
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Ενεργά Προγράμματα ({programs.length})</h2>
          <Wifi className="w-4 h-4 text-green-500" title="Realtime ενημερώσεις ενεργές" />
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="rounded-none"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Ανανέωση
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {programs.map((assignment) => (
          <ProgramCard key={assignment.id} assignment={assignment} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
};

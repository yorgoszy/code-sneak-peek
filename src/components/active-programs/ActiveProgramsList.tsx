
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Calendar } from "lucide-react";
import { ProgramCardActions } from './ProgramCardActions';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

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
        <h2 className="text-xl font-semibold">Ενεργά Προγράμματα ({programs.length})</h2>
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

      <div className="grid gap-4">
        {programs.map((assignment) => (
          <Card key={assignment.id} className="rounded-none">
            <CardHeader>
              <div className="flex items-start gap-4">
                {/* Athlete Photo */}
                <Avatar className="w-16 h-16 flex-shrink-0">
                  <AvatarImage src={assignment.app_users?.photo_url || undefined} />
                  <AvatarFallback className="bg-gray-200">
                    <User className="w-8 h-8 text-gray-500" />
                  </AvatarFallback>
                </Avatar>
                
                {/* Program & Athlete Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {assignment.programs?.name || 'Άγνωστο Πρόγραμμα'}
                      </CardTitle>
                      <p className="text-sm text-gray-600 font-medium mt-1">
                        {assignment.app_users?.name || 'Άγνωστος Αθλητής'}
                      </p>
                      {assignment.programs?.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {assignment.programs.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="rounded-none">
                        {assignment.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Assignment Date */}
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Ημερομηνία Ανάθεσης:</span> {
                    assignment.created_at ? format(new Date(assignment.created_at), 'dd/MM/yyyy', { locale: el }) : '-'
                  }
                </div>
                
                {/* Training Dates */}
                {assignment.training_dates && assignment.training_dates.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Ημερομηνίες Προπόνησης ({assignment.training_dates.length})
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {assignment.training_dates.slice(0, 8).map((date, index) => (
                        <span 
                          key={index}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          {format(new Date(date), 'dd/MM', { locale: el })}
                        </span>
                      ))}
                      {assignment.training_dates.length > 8 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{assignment.training_dates.length - 8} ακόμα
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Program Structure Info */}
                {assignment.programs && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Δομή:</span> {
                      assignment.programs.program_weeks?.length || 0
                    } εβδομάδες • {
                      assignment.programs.program_weeks?.[0]?.program_days?.length || 0
                    } ημέρες/εβδομάδα
                  </div>
                )}
                
                {/* Action Buttons */}
                <ProgramCardActions assignment={assignment} onRefresh={onRefresh} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

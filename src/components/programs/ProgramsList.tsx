import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Edit, Copy, Eye, User, Calendar, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Program } from './types';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { parseDateFromString } from '@/utils/dateUtils';
import { ProgramViewDialog } from "../active-programs/calendar/ProgramViewDialog";
import { ProgramPreviewDialog } from './ProgramPreviewDialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useIsMobile } from "@/hooks/use-mobile";

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
  onDuplicateProgram,
  onPreviewProgram
}) => {
  const isMobile = useIsMobile();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);
  const [selectedProgramForView, setSelectedProgramForView] = useState<EnrichedAssignment | null>(null);
  const [selectedProgramForPreview, setSelectedProgramForPreview] = useState<Program | null>(null);

  const getProgramStats = (program: Program) => {
    const weeksCount = program.program_weeks?.length || 0;
    const avgDaysPerWeek = weeksCount > 0 
      ? Math.round((program.program_weeks?.reduce((total, week) => total + (week.program_days?.length || 0), 0) || 0) / weeksCount)
      : 0;
    
    return { weeksCount, avgDaysPerWeek };
  };

  const getAssignmentInfo = (program: Program) => {
    const assignment = program.program_assignments?.[0];
    if (!assignment) return null;

    const totalSessions = assignment.training_dates?.length || 0;
    const completedSessions = Math.floor(totalSessions * 0.3); // Mock: 30% completed
    const remainingSessions = totalSessions - completedSessions;
    const progressPercentage = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    
    return {
      totalSessions,
      completedSessions,
      remainingSessions,
      progressPercentage,
      assignmentDate: assignment.created_at ? format(new Date(assignment.created_at), 'dd/MM/yyyy', { locale: el }) : '',
      athletePhoto: assignment.app_users?.photo_url,
      athleteName: assignment.app_users?.name,
      trainingDates: assignment.training_dates || []
    };
  };

  const handleDeleteProgram = (e: React.MouseEvent, programId: string) => {
    e.stopPropagation();
    console.log('🗑️ Attempting to delete program:', programId);
    setProgramToDelete(programId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (programToDelete) {
      console.log('✅ User confirmed deletion, calling onDeleteProgram with:', programToDelete);
      onDeleteProgram(programToDelete);
      setProgramToDelete(null);
    }
  };

  const handleViewProgram = (e: React.MouseEvent, program: Program) => {
    e.stopPropagation();
    console.log('👁️ Opening program view dialog for:', program.name);
    
    // Μετατρέπουμε το Program σε EnrichedAssignment format
    const assignmentForView = program.program_assignments?.[0];
    if (assignmentForView) {
      const enrichedAssignment: EnrichedAssignment = {
        id: assignmentForView.id,
        program_id: program.id,
        athlete_id: assignmentForView.user_id,
        user_id: assignmentForView.user_id,
        assigned_by: undefined, // ProgramAssignment doesn't have assigned_by
        start_date: assignmentForView.start_date,
        end_date: assignmentForView.end_date,
        status: assignmentForView.status || 'active',
        notes: undefined, // ProgramAssignment doesn't have notes
        created_at: assignmentForView.created_at,
        updated_at: assignmentForView.created_at, // Use created_at as fallback
        assignment_type: undefined, // ProgramAssignment doesn't have assignment_type
        group_id: undefined, // ProgramAssignment doesn't have group_id
        progress: undefined, // ProgramAssignment doesn't have progress
        training_dates: assignmentForView.training_dates,
        programs: {
          id: program.id,
          name: program.name,
          description: program.description || '',
          program_weeks: program.program_weeks || []
        },
        app_users: assignmentForView.app_users
      };
      setSelectedProgramForView(enrichedAssignment);
      setViewDialogOpen(true);
    }
  };

  const handlePreviewProgram = (e: React.MouseEvent, program: Program) => {
    e.stopPropagation();
    setSelectedProgramForPreview(program);
    setPreviewDialogOpen(true);
  };

  if (programs.length === 0) {
    return (
      <div className="w-full">
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold ${isMobile ? 'mb-3' : 'mb-4'}`}>Προγράμματα</h2>
        <div className={`text-center ${isMobile ? 'py-6' : 'py-8'} text-gray-500`}>
          Δεν υπάρχουν προγράμματα ακόμα
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold ${isMobile ? 'mb-3' : 'mb-4'}`}>Προγράμματα</h2>
        <div className={`space-y-${isMobile ? '2' : '3'}`}>
          {programs.map(program => {
            const { weeksCount, avgDaysPerWeek } = getProgramStats(program);
            const assignmentInfo = getAssignmentInfo(program);
            const isAssigned = assignmentInfo !== null;
            
            return (
              <Card key={program.id} className="rounded-none hover:shadow-md transition-shadow">
                <CardContent className={`${isMobile ? 'p-4' : 'p-4'}`}>
                  <div className={`${isMobile ? 'space-y-4' : 'flex items-center justify-between'} h-full`}>
                    {/* Top section - User info and program details */}
                    <div className={`flex items-center ${isMobile ? 'gap-3 mb-3' : 'gap-4'} flex-1`}>
                      {/* Avatar - show for assigned programs */}
                      {isAssigned && assignmentInfo && (
                        <Avatar className={`${isMobile ? 'w-12 h-12' : 'w-12 h-12'} flex-shrink-0`}>
                          <AvatarImage src={assignmentInfo.athletePhoto || undefined} />
                          <AvatarFallback className="bg-gray-200">
                            <User className={`${isMobile ? 'w-6 h-6' : 'w-6 h-6'} text-gray-500`} />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      {/* Program Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${isMobile ? 'text-lg' : 'text-lg'} leading-tight`}>{program.name}</h4>
                        {isAssigned && assignmentInfo && (
                          <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-600 font-medium mt-1`}>{assignmentInfo.athleteName}</p>
                        )}
                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500 mt-1`}>
                          {weeksCount} εβδομάδες • {avgDaysPerWeek} ημέρες/εβδομάδα
                        </div>
                      </div>
                      
                      {/* Status Badge - Mobile Top Right */}
                      {isMobile && isAssigned && (
                        <Badge 
                          variant="outline" 
                          className="rounded-none bg-[#00ffba]/10 text-[#00ffba] border-[#00ffba] text-xs flex-shrink-0"
                        >
                          Active
                        </Badge>
                      )}
                    </div>

                    {/* Desktop Progress Info */}
                    {!isMobile && isAssigned && assignmentInfo && (
                      <div className="flex-1 max-w-md mx-4">
                        <div className="space-y-2">
                          {/* Training dates summary */}
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>{assignmentInfo.trainingDates.length} προπονήσεις</span>
                            {assignmentInfo.trainingDates.length > 0 && (
                              <span>
                                ({format(parseDateFromString(assignmentInfo.trainingDates[0]), 'dd/MM', { locale: el })} - 
                                {format(parseDateFromString(assignmentInfo.trainingDates[assignmentInfo.trainingDates.length - 1]), 'dd/MM', { locale: el })})
                              </span>
                            )}
                          </div>
                          
                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Πρόοδος</span>
                              <span>{assignmentInfo.completedSessions}/{assignmentInfo.totalSessions}</span>
                            </div>
                            <Progress 
                              value={assignmentInfo.progressPercentage} 
                              className="h-2 w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mobile Progress Info */}
                    {isMobile && isAssigned && assignmentInfo && (
                      <div className="w-full mb-3">
                        <div className="space-y-3">
                          {/* Training dates summary */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{assignmentInfo.trainingDates.length} προπονήσεις</span>
                            {assignmentInfo.trainingDates.length > 0 && (
                              <span className="text-xs">
                                ({format(parseDateFromString(assignmentInfo.trainingDates[0]), 'dd/MM', { locale: el })} - 
                                {format(parseDateFromString(assignmentInfo.trainingDates[assignmentInfo.trainingDates.length - 1]), 'dd/MM', { locale: el })})
                              </span>
                            )}
                          </div>
                          
                          {/* Progress bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Πρόοδος</span>
                              <span className="font-medium">{assignmentInfo.completedSessions}/{assignmentInfo.totalSessions}</span>
                            </div>
                            <Progress 
                              value={assignmentInfo.progressPercentage} 
                              className="h-3 w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action buttons section */}
                    <div className={`${isMobile ? 'w-full' : 'flex items-center gap-2 flex-shrink-0'}`}>
                      {/* Desktop Status Badge */}
                      {!isMobile && isAssigned && (
                        <Badge 
                          variant="outline" 
                          className="rounded-none bg-[#00ffba]/10 text-[#00ffba] border-[#00ffba]"
                        >
                          Active
                        </Badge>
                      )}

                      {/* Action Buttons */}
                      <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex gap-1'}`}>
                        {/* View button - opens ProgramViewDialog for assigned programs */}
                        {isAssigned && (
                          <Button
                            variant="outline"
                            size={isMobile ? "default" : "sm"}
                            onClick={(e) => handleViewProgram(e, program)}
                            className={`rounded-none ${isMobile ? 'w-full justify-center' : ''}`}
                            title="Προβολή Προγράμματος"
                          >
                            <Play className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-4 h-4'}`} />
                            {isMobile && 'Προβολή'}
                          </Button>
                        )}

                        {/* Preview button - opens ProgramPreviewDialog */}
                        <Button
                          variant="outline"
                          size={isMobile ? "default" : "sm"}
                          onClick={(e) => handlePreviewProgram(e, program)}
                          className={`rounded-none ${isMobile ? 'w-full justify-center' : ''}`}
                          title="Προεπισκόπηση"
                        >
                          <Eye className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-4 h-4'}`} />
                          {isMobile && 'Προεπισκόπηση'}
                        </Button>

                        <Button
                          variant="outline"
                          size={isMobile ? "default" : "sm"}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProgram(program);
                          }}
                          className={`rounded-none ${isMobile ? 'w-full justify-center' : ''}`}
                          title="Επεξεργασία"
                        >
                          <Edit className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-4 h-4'}`} />
                          {isMobile && 'Επεξεργασία'}
                        </Button>

                        {onDuplicateProgram && (
                          <Button
                            variant="outline"
                            size={isMobile ? "default" : "sm"}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateProgram(program);
                            }}
                            className={`rounded-none ${isMobile ? 'w-full justify-center' : ''}`}
                            title="Αντιγραφή"
                          >
                            <Copy className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-4 h-4'}`} />
                            {isMobile && 'Αντιγραφή'}
                          </Button>
                        )}

                        {/* Delete button */}
                        <Button
                          variant="destructive"
                          size={isMobile ? "default" : "sm"}
                          onClick={(e) => handleDeleteProgram(e, program.id)}
                          className={`rounded-none ${isMobile ? 'w-full justify-center' : 'px-2'}`}
                          title="Διαγραφή"
                        >
                          <Trash2 className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-4 h-4'}`} />
                          {isMobile && 'Διαγραφή'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ProgramViewDialog for assigned programs */}
      <ProgramViewDialog
        isOpen={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        assignment={selectedProgramForView}
      />

      {/* ProgramPreviewDialog for all programs */}
      <ProgramPreviewDialog
        program={selectedProgramForPreview}
        isOpen={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
      />

      {/* Confirmation Dialog for delete */}
      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setProgramToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;"
      />
    </>
  );
};

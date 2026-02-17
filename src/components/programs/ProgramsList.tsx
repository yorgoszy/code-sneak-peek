import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Edit, Copy, Eye, User, Calendar, Play, ShoppingCart } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";

interface ProgramsListProps {
  programs: Program[];
  selectedProgram: Program | null;
  onSelectProgram: (program: Program) => void;
  onDeleteProgram: (programId: string) => void;
  onEditProgram: (program: Program) => void;
  onDuplicateProgram?: (program: Program) => void;
  onPreviewProgram?: (program: Program) => void;
  onConvertToTemplate?: (program: Program) => void;
  isTemplateMode?: boolean;
}

export const ProgramsList: React.FC<ProgramsListProps> = ({
  programs,
  selectedProgram,
  onSelectProgram,
  onDeleteProgram,
  onEditProgram,
  onDuplicateProgram,
  onPreviewProgram,
  onConvertToTemplate,
  isTemplateMode = false
}) => {
  const isMobile = useIsMobile();
  const showButtonText = isMobile && !isTemplateMode;

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);
  const [selectedProgramForView, setSelectedProgramForView] = useState<EnrichedAssignment | null>(null);
  const [selectedProgramForPreview, setSelectedProgramForPreview] = useState<Program | null>(null);
  
  // State για workout completions - κρατάμε τα completed counts ανά assignment_id
  const [completionsMap, setCompletionsMap] = useState<Record<string, { completed: number; missed: number }>>({});
  const [shopState, setShopState] = useState<Record<string, { is_sellable: boolean; price: number | null }>>({});

  // Initialize shop state from programs
  useEffect(() => {
    if (isTemplateMode) {
      const initial: Record<string, { is_sellable: boolean; price: number | null }> = {};
      programs.forEach(p => {
        initial[p.id] = { is_sellable: p.is_sellable || false, price: p.price ?? null };
      });
      setShopState(initial);
    }
  }, [programs, isTemplateMode]);

  const handleToggleSellable = async (e: React.MouseEvent, programId: string, newValue: boolean) => {
    e.stopPropagation();
    setShopState(prev => ({ ...prev, [programId]: { ...prev[programId], is_sellable: newValue } }));
    await supabase.from('programs').update({ is_sellable: newValue }).eq('id', programId);
  };

  const handlePriceChange = async (programId: string, newPrice: number | null) => {
    setShopState(prev => ({ ...prev, [programId]: { ...prev[programId], price: newPrice } }));
    await supabase.from('programs').update({ price: newPrice }).eq('id', programId);
  };

  // Fetch workout completions για όλα τα assignments
  useEffect(() => {
    const fetchCompletions = async () => {
      // Συλλέγουμε όλα τα assignment IDs από τα programs
      const assignmentIds: string[] = [];
      programs.forEach(program => {
        program.program_assignments?.forEach(assignment => {
          if (assignment.id) {
            assignmentIds.push(assignment.id);
          }
        });
      });

      if (assignmentIds.length === 0) return;

      // Fetch completions για όλα τα assignments σε μία κλήση
      const { data: completions, error } = await supabase
        .from('workout_completions')
        .select('assignment_id, status')
        .in('assignment_id', assignmentIds);

      if (error) {
        console.error('Error fetching workout completions:', error);
        return;
      }

      // Υπολογίζουμε τα completed/missed ανά assignment
      const newMap: Record<string, { completed: number; missed: number }> = {};
      
      completions?.forEach(c => {
        if (!newMap[c.assignment_id]) {
          newMap[c.assignment_id] = { completed: 0, missed: 0 };
        }
        if (c.status === 'completed') {
          newMap[c.assignment_id].completed++;
        } else if (c.status === 'missed') {
          newMap[c.assignment_id].missed++;
        }
      });

      setCompletionsMap(newMap);
    };

    fetchCompletions();
  }, [programs]);

  const getProgramStats = (program: Program) => {
    const weeksCount = program.program_weeks?.length || 0;
    const avgDaysPerWeek = weeksCount > 0 
      ? Math.round((program.program_weeks?.reduce((total, week) => total + (week.program_days?.length || 0), 0) || 0) / weeksCount)
      : 0;
    
    return { weeksCount, avgDaysPerWeek };
  };

  const getAssignmentInfo = (program: Program) => {
    // Εμφάνιση ΟΛΩ των assignments, όχι μόνο του πρώτου
    const assignments = program.program_assignments || [];
    if (assignments.length === 0) return null;

    // Αν υπάρχει μόνο ένα assignment, δείχνουμε τα στοιχεία του χρήστη
    const firstAssignment = assignments[0];
    const totalSessions = firstAssignment.training_dates?.length || 0;
    
    // Παίρνουμε τα πραγματικά completed sessions από το completionsMap
    const completionData = completionsMap[firstAssignment.id] || { completed: 0, missed: 0 };
    const completedSessions = completionData.completed;
    
    const remainingSessions = totalSessions - completedSessions - completionData.missed;
    const progressPercentage = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    
    return {
      totalSessions,
      completedSessions,
      remainingSessions,
      progressPercentage,
      assignmentDate: firstAssignment.created_at ? format(new Date(firstAssignment.created_at), 'dd/MM/yyyy', { locale: el }) : '',
      athletePhoto: assignments.length === 1 ? firstAssignment.app_users?.photo_url : undefined,
      athleteName: assignments.length === 1 
        ? firstAssignment.app_users?.name 
        : `${assignments.length} αθλητές`,
      trainingDates: firstAssignment.training_dates || [],
      assignmentsCount: assignments.length
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
        assigned_by: assignmentForView.assigned_by,
        start_date: assignmentForView.start_date,
        end_date: assignmentForView.end_date,
        status: assignmentForView.status || 'active',
        notes: undefined,
        created_at: assignmentForView.created_at,
        updated_at: assignmentForView.created_at, // Use created_at as fallback
        assignment_type: undefined,
        group_id: undefined,
        progress: undefined,
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

                      {/* Shop Controls - Template mode only */}
                      {isTemplateMode && (
                        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 px-2 py-1 border border-gray-300 rounded-none">
                            <ShoppingCart className="w-3.5 h-3.5 text-[#cb8954]" />
                            <Switch
                              checked={shopState[program.id]?.is_sellable || false}
                              onCheckedChange={(val) => handleToggleSellable({ stopPropagation: () => {} } as any, program.id, val)}
                              className="data-[state=checked]:bg-[#cb8954] h-4 w-7"
                            />
                          </div>
                          {shopState[program.id]?.is_sellable && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">€</span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={shopState[program.id]?.price || ''}
                                onChange={(e) => handlePriceChange(program.id, e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="Τιμή"
                                className="rounded-none h-7 text-xs w-20 border border-gray-300 px-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
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
                            <Play className={showButtonText ? 'w-4 h-4 mr-2' : 'w-4 h-4'} />
                            {showButtonText && 'Προβολή'}
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
                          <Eye className={showButtonText ? 'w-4 h-4 mr-2' : 'w-4 h-4'} />
                          {showButtonText && 'Προεπισκόπηση'}
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
                          <Edit className={showButtonText ? 'w-4 h-4 mr-2' : 'w-4 h-4'} />
                          {showButtonText && 'Επεξεργασία'}
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
                            <Copy className={showButtonText ? 'w-4 h-4 mr-2' : 'w-4 h-4'} />
                            {showButtonText && 'Αντιγραφή'}
                          </Button>
                        )}

                        {/* Convert to Template button */}
                        {onConvertToTemplate && (
                          <Button
                            variant="outline"
                            size={isMobile ? "default" : "sm"}
                            onClick={(e) => {
                              e.stopPropagation();
                              onConvertToTemplate(program);
                            }}
                            className={`rounded-none bg-[#00ffba]/10 text-[#00ffba] border-[#00ffba] hover:bg-[#00ffba]/20 ${isMobile ? 'w-full justify-center' : ''}`}
                            title="Μετατροπή σε Template"
                          >
                            <Play className={showButtonText ? 'w-4 h-4 mr-2' : 'w-4 h-4'} />
                            {showButtonText && 'Template'}
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
                          <Trash2 className={showButtonText ? 'w-4 h-4 mr-2' : 'w-4 h-4'} />
                          {showButtonText && 'Διαγραφή'}
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

import React from 'react';
import { EditableProgramViewDialog } from "../active-programs/calendar/EditableProgramViewDialog";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { Program } from './types';

interface ProgramPreviewDialogProps {
  program: Program | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Preview dialog for a Program (template or unassigned program).
 * Renders the SAME UI as the active-program ProgramViewDialog
 * by adapting the Program to a synthetic EnrichedAssignment.
 */
export const ProgramPreviewDialog: React.FC<ProgramPreviewDialogProps> = ({
  program,
  isOpen,
  onOpenChange,
}) => {
  if (!program) return null;

  // Try to reuse a real assignment if it exists, so we get training_dates/user info.
  const realAssignment = program.program_assignments?.[0];

  const syntheticAssignment: EnrichedAssignment = {
    id: realAssignment?.id ?? `preview-${program.id}`,
    program_id: program.id,
    athlete_id: realAssignment?.user_id ?? '',
    user_id: realAssignment?.user_id ?? '',
    assigned_by: realAssignment?.assigned_by ?? '',
    start_date: realAssignment?.start_date ?? '',
    end_date: realAssignment?.end_date ?? '',
    status: realAssignment?.status ?? 'preview',
    notes: undefined,
    created_at: realAssignment?.created_at ?? new Date().toISOString(),
    updated_at: realAssignment?.created_at ?? new Date().toISOString(),
    assignment_type: undefined,
    group_id: undefined,
    progress: undefined,
    training_dates: realAssignment?.training_dates ?? [],
    programs: {
      id: program.id,
      name: program.name,
      description: program.description || '',
      program_weeks: program.program_weeks || [],
    },
    app_users: realAssignment?.app_users,
  } as EnrichedAssignment;

  return (
    <EditableProgramViewDialog
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      assignment={syntheticAssignment}
      editMode={false}
    />
  );
};

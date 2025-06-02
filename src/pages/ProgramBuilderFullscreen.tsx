
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Users } from "lucide-react";
import { ProgramBuilder } from '@/components/programs/builder/ProgramBuilder';
import { ProgramAssignmentDialog } from '@/components/programs/builder/ProgramAssignmentDialog';
import { useProgramBuilderState } from '@/components/programs/builder/hooks/useProgramBuilderState';
import { useProgramBuilderActions } from '@/components/programs/builder/hooks/useProgramBuilderActions';
import { useProgramsData } from '@/hooks/useProgramsData';
import { usePrograms } from '@/hooks/usePrograms';
import { useProgramAssignments } from '@/hooks/programs/useProgramAssignments';
import { toast } from "sonner";
import { Program } from '@/components/programs/types';

const ProgramBuilderFullscreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get('id');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = React.useState(false);
  const [editingProgram, setEditingProgram] = React.useState<Program | null>(null);

  const { users, exercises } = useProgramsData();
  const { fetchPrograms, saveProgram } = usePrograms();
  const { createOrUpdateAssignment } = useProgramAssignments();
  const { program, updateProgram, resetProgram, generateId, loadProgramFromData } = useProgramBuilderState(exercises);
  const actions = useProgramBuilderActions(program, updateProgram, generateId, exercises);

  React.useEffect(() => {
    const loadProgram = async () => {
      if (programId) {
        try {
          const programs = await fetchPrograms();
          const programToEdit = programs.find(p => p.id === programId);
          if (programToEdit) {
            setEditingProgram(programToEdit);
            loadProgramFromData(programToEdit);
          }
        } catch (error) {
          console.error('Error loading program:', error);
          toast.error('Σφάλμα κατά τη φόρτωση του προγράμματος');
        }
      } else {
        resetProgram();
      }
    };

    loadProgram();
  }, [programId]);

  const handleSave = async () => {
    if (!program.name.trim()) {
      toast.error('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }
    
    const programToSave = {
      ...program,
      id: editingProgram?.id || undefined,
      status: 'draft'
    };
    
    try {
      await saveProgram(programToSave);
      toast.success('Το πρόγραμμα αποθηκεύτηκε επιτυχώς');
      navigate('/dashboard/programs');
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση');
    }
  };

  const handleOpenAssignments = () => {
    if (!program.name.trim()) {
      toast.error('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }

    if (!program.weeks || program.weeks.length === 0) {
      toast.error('Δημιουργήστε πρώτα εβδομάδες και ημέρες προπόνησης');
      return;
    }

    const hasValidDays = program.weeks.some(week => week.days && week.days.length > 0);
    if (!hasValidDays) {
      toast.error('Προσθέστε ημέρες προπόνησης στις εβδομάδες');
      return;
    }

    setAssignmentDialogOpen(true);
  };

  const handleAssign = async (userId: string, trainingDates: string[]) => {
    const programToSave = {
      ...program,
      id: editingProgram?.id || undefined,
      status: 'active',
      createAssignment: true
    };
    
    try {
      const savedProgram = await saveProgram(programToSave);
      const finalProgramId = savedProgram?.id || editingProgram?.id;
      
      if (finalProgramId && userId && trainingDates?.length > 0) {
        await createOrUpdateAssignment(
          finalProgramId, 
          userId, 
          undefined,
          undefined,
          trainingDates
        );
        
        toast.success('Το πρόγραμμα δημιουργήθηκε και ανατέθηκε επιτυχώς');
        navigate('/dashboard/active-programs');
      } else {
        toast.error('Απαιτούνται συγκεκριμένες ημερομηνίες προπόνησης');
      }
    } catch (error) {
      console.error('Error creating assignments:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/programs')}
              className="rounded-none"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Επιστροφή
            </Button>
            <h1 className="text-2xl font-bold">
              {editingProgram ? 'Επεξεργασία Προγράμματος' : 'Δημιουργία Νέου Προγράμματος'}
            </h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              variant="outline"
              className="rounded-none"
            >
              <Save className="w-4 h-4 mr-2" />
              Αποθήκευση ως Προσχέδιο
            </Button>
            
            <Button
              onClick={handleOpenAssignments}
              className="rounded-none"
            >
              <Users className="w-4 h-4 mr-2" />
              Ανάθεση σε Ασκούμενο
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <ProgramBuilder
            program={program}
            users={users}
            exercises={exercises}
            onNameChange={(name) => updateProgram({ name })}
            onDescriptionChange={(description) => updateProgram({ description })}
            onAthleteChange={(user_id) => updateProgram({ user_id })}
            onAddWeek={actions.addWeek}
            onRemoveWeek={actions.removeWeek}
            onDuplicateWeek={actions.duplicateWeek}
            onUpdateWeekName={actions.updateWeekName}
            onAddDay={actions.addDay}
            onRemoveDay={actions.removeDay}
            onDuplicateDay={actions.duplicateDay}
            onUpdateDayName={actions.updateDayName}
            onAddBlock={actions.addBlock}
            onRemoveBlock={actions.removeBlock}
            onDuplicateBlock={actions.duplicateBlock}
            onUpdateBlockName={actions.updateBlockName}
            onAddExercise={actions.addExercise}
            onRemoveExercise={actions.removeExercise}
            onUpdateExercise={actions.updateExercise}
            onDuplicateExercise={actions.duplicateExercise}
            onReorderWeeks={actions.reorderWeeks}
            onReorderDays={actions.reorderDays}
            onReorderBlocks={actions.reorderBlocks}
            onReorderExercises={actions.reorderExercises}
          />
        </div>
      </div>

      <ProgramAssignmentDialog
        isOpen={assignmentDialogOpen}
        onClose={() => setAssignmentDialogOpen(false)}
        program={program}
        users={users}
        onAssign={handleAssign}
      />
    </div>
  );
};

export default ProgramBuilderFullscreen;

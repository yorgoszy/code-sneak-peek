import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAssignmentOperation, assignedProgramCopy } from '../services/assignmentOperation';
import { toast } from 'sonner';
import type { User, Exercise } from '../../types';
import type { ProgramStructure } from './useProgramBuilderState';
import { assignmentService } from '../services/assignmentService';
import { recalculateWeeksForUser } from '../services/perUserRecalculation';
import { applyUserWarmUps } from '../services/applyUserWarmUps';
import { clearProgramDraft } from './useProgramBuilderState';
import { supabase } from '@/integrations/supabase/client';

interface UseProgramBuilderDialogLogicProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => Promise<any>;
  onOpenChange: () => void;
  editingProgram?: any;
  editingAssignment?: any;
  isOpen: boolean;
  program: ProgramStructure;
  updateProgram?: (updates: Partial<ProgramStructure>) => void;
  /** όταν είμαστε admin “μέσα” σε προφίλ coach */
  coachId?: string;
}

export const useProgramBuilderDialogLogic = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  editingAssignment,
  isOpen,
  program,
  updateProgram,
  coachId
}: UseProgramBuilderDialogLogicProps) => {
  const navigate = useNavigate();
  const operation = useRef(createAssignmentOperation());
  const savedId = useRef<string | undefined>(program.id);
  const [isAssigning, setIsAssigning] = useState(false);
  const availableUsers = useMemo(() => {
    console.log('🔍 useProgramBuilderDialogLogic - users:', users.length, 'coachId:', coachId);
    // Ο parent (Programs.tsx ή CoachProgramsPage.tsx) ήδη φιλτράρει τους χρήστες
    // Δεν χρειάζεται επιπλέον φιλτράρισμα εδώ
    return [...users];
  }, [users]);

  const hasMeaningfulProgram = (p: ProgramStructure) => {
    return Boolean(
      (p.name && p.name.trim()) ||
      (p.description && p.description.trim()) ||
      (p.weeks && p.weeks.length > 0)
    );
  };

  const getNextDraftName = async (): Promise<string> => {
    try {
      const { data } = await supabase
        .from('programs')
        .select('name')
        .ilike('name', 'draft %');
      const nums = (data || [])
        .map((r: any) => {
          const m = /^draft\s+(\d+)$/i.exec((r.name || '').trim());
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => n > 0);
      const next = nums.length ? Math.max(...nums) + 1 : 1;
      return `draft ${next}`;
    } catch {
      return `draft ${Date.now()}`;
    }
  };

  const handleClose = async () => {
    if (operation.current.busy) return;
    // Αν είναι νέο πρόγραμμα με περιεχόμενο και ΧΩΡΙΣ αποθηκευμένο id,
    // το αποθηκεύουμε αυτόματα σαν "draft X" στη βάση.
    if (!editingProgram && !program.id && !savedId.current && hasMeaningfulProgram(program)) {
      try {
        const draftName = program.name?.trim() ? program.name : await getNextDraftName();
        const draftProgram = {
          ...program,
          name: draftName,
          is_template: true,
          user_ids: [],
          user_id: '',
          training_dates: [],
        };
        await onCreateProgram(draftProgram);
        toast.success(`Αποθηκεύτηκε ως πρόχειρο: ${draftName}`);
      } catch (err) {
        console.error('❌ Auto-save draft failed:', err);
      }
    }
    clearProgramDraft();
    onOpenChange();
  };


  const handleSave = async () => {
    if (!operation.current.acquire()) return;
    try {
      console.log('💾 [handleSave] Starting save...');
      console.log('💾 [handleSave] Program name:', program.name);
      console.log('💾 [handleSave] Program ID:', program.id);
      console.log('💾 [handleSave] Weeks count:', program.weeks?.length || 0);
      
      // Λεπτομερές logging της δομής
      let totalExercises = 0;
      program.weeks?.forEach((week, wi) => {
        console.log(`💾 [handleSave] Week ${wi + 1}: ${week.name}, Days: ${week.program_days?.length || 0}`);
        week.program_days?.forEach((day, di) => {
          console.log(`💾 [handleSave]   Day ${di + 1}: ${day.name}, Blocks: ${day.program_blocks?.length || 0}`);
          day.program_blocks?.forEach((block, bi) => {
            const exerciseCount = block.program_exercises?.length || 0;
            totalExercises += exerciseCount;
            console.log(`💾 [handleSave]     Block ${bi + 1}: ${block.name}, Exercises: ${exerciseCount}`);
          });
        });
      });
      
      console.log(`💾 [handleSave] Total exercises to save: ${totalExercises}`);
      
      if (!program.name?.trim()) {
        toast.error('Το όνομα του προγράμματος είναι υποχρεωτικό');
        return;
      }

      if (program.weeks?.length === 0) {
        toast.error('Προσθέστε τουλάχιστον μία εβδομάδα στο πρόγραμμα');
        return;
      }

      const savedProgram = await onCreateProgram({ ...program, id: program.id || savedId.current, deferBuilderRefresh: true });
      if (savedProgram?.id) savedId.current = savedProgram.id;
      console.log('✅ Program saved:', savedProgram);
      
      // Ενημέρωση του program state με το νέο ID
      if (savedProgram?.id && updateProgram) {
        updateProgram({ id: savedProgram.id });
        console.log('✅ Program ID updated in state:', savedProgram.id);
      }
      
      toast.success('Το πρόγραμμα αποθηκεύτηκε επιτυχώς!');
      clearProgramDraft();
      // Don't close dialog, keep it open for assignments
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος. Ελέγξτε τη σύνδεση και δοκιμάστε ξανά.');
    } finally {
      operation.current.release();
    }
  };

  const handleAssign = async () => {
    if (!operation.current.acquire()) return;
    setIsAssigning(true);
    try {
      console.log('🎯 Starting assignment process:', { program, user_ids: program.user_ids });

      if (!program.name?.trim()) {
        toast.error('Πρώτα αποθηκεύστε το πρόγραμμα');
        return;
      }

      if (!program.user_ids || program.user_ids.length === 0) {
        toast.error('Παρακαλώ επιλέξτε τουλάχιστον έναν χρήστη');
        return;
      }

      if (!program.training_dates || program.training_dates.length === 0) {
        toast.error('Παρακαλώ επιλέξτε ημερομηνίες προπόνησης');
        return;
      }

      // Ensure base program is saved first (as a "template" reference)
      let baseProgramId = program.id || savedId.current;
      if (!baseProgramId) {
        const savedProgram = await onCreateProgram({ ...program, deferBuilderRefresh: true });
        if (!savedProgram || !savedProgram.id) {
          throw new Error('Αποτυχία αποθήκευσης προγράμματος');
        }
        baseProgramId = savedProgram.id;
        savedId.current = savedProgram.id;
        updateProgram?.({ id: savedProgram.id });
      }

      // Convert Date objects to strings
      const trainingDates = program.training_dates.map(date => {
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        return typeof date === 'string' ? date : String(date);
      });

      console.log('🎯 Creating assignments for users:', program.user_ids);
      console.log('🎯 Training dates:', trainingDates);

      const isSingleUser = program.user_ids.length === 1;

      for (let i = 0; i < program.user_ids.length; i++) {
        const userId = program.user_ids[i];
        console.log(`📝 Creating assignment for user: ${userId}`);
        
        // 🔄 Recalculate kg/m/s based on this user's personal 1RM data
        console.log(`🔄 Recalculating kg/m/s for user ${userId}...`);
        const personalizedWeeks = applyUserWarmUps(program.weeks || [], userId);
        const userWeeks = await recalculateWeeksForUser(personalizedWeeks, userId);

        // Save each recipient's personalized structure exactly once.
        const savedUserProgram = await onCreateProgram(isSingleUser
          ? { ...program, id: baseProgramId, weeks: userWeeks, deferBuilderRefresh: true }
          : assignedProgramCopy(program, userId, userWeeks));
        if (!savedUserProgram?.id) throw new Error('Αποτυχία αποθήκευσης προγράμματος χρήστη');
        const programIdForUser = savedUserProgram.id;

        const assignmentData = {
          program: { ...program, id: programIdForUser, weeks: userWeeks },
          userId,
          trainingDates,
          coachId,
          skipStructureRecreation: true, // For multi-user, structure was already created by onCreateProgram
        };

        await assignmentService.saveAssignment(assignmentData);
        console.log(`✅ Assignment created for user: ${userId}`);
      }

      toast.success(`Το πρόγραμμα ανατέθηκε επιτυχώς σε ${program.user_ids.length} χρήστες!`);
      clearProgramDraft();
      onOpenChange();

      // Redirect to active programs
      navigate('/dashboard/active-programs');

    } catch (error) {
      console.error('❌ Assignment error:', error);
      toast.error(`Σφάλμα ανάθεσης: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
    } finally {
      operation.current.release();
      setIsAssigning(false);
    }
  };

  return {
    handleClose,
    handleSave,
    handleAssign,
    isAssigning,
    availableUsers
  };
};

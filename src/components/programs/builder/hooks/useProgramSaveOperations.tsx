
import { useState } from 'react';
import { toast } from 'sonner';
import type { ProgramStructure } from './useProgramBuilderState';

interface UseProgramSaveOperationsProps {
  program: ProgramStructure;
  onCreateProgram: (program: any) => Promise<any>;
  onOpenChange: () => void;
}

export const useProgramSaveOperations = ({
  program,
  onCreateProgram,
  onOpenChange
}: UseProgramSaveOperationsProps) => {
  const [currentProgramId, setCurrentProgramId] = useState<string | null>(program?.id || null);

  const handleSave = async () => {
    try {
      console.log('💾 Saving program as draft...', program);
      
      if (!program) {
        toast.error('Δεν βρέθηκε πρόγραμμα');
        return;
      }

      if (!program.name?.trim()) {
        toast.error('Παρακαλώ εισάγετε όνομα προγράμματος');
        return;
      }

      // Μετατροπή training_dates σε string array για την αποθήκευση
      let trainingDatesStrings: string[] = [];
      if (program.training_dates) {
        trainingDatesStrings = program.training_dates.map(date => 
          typeof date === 'string' ? date : date.toISOString().split('T')[0]
        );
      }

      const savedProgram = await onCreateProgram({
        ...program,
        training_dates: trainingDatesStrings,
        status: 'draft'
      });

      console.log('✅ Program saved as draft:', savedProgram);
      if (savedProgram?.id) {
        setCurrentProgramId(savedProgram.id);
      }
      toast.success('Το πρόγραμμα αποθηκεύτηκε ως προσχέδιο!');
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
    }
  };

  const handleClose = () => {
    console.log('🔒 Closing program builder dialog');
    onOpenChange();
  };

  return {
    currentProgramId: currentProgramId || program?.id || null,
    setCurrentProgramId,
    handleSave,
    handleClose
  };
};

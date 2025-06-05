
import { useState, useEffect } from 'react';
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
  const [currentProgramId, setCurrentProgramId] = useState<string | null>(null);

  // Ενημέρωση του currentProgramId όταν αλλάζει το program.id
  useEffect(() => {
    if (program.id) {
      setCurrentProgramId(program.id);
    }
  }, [program.id]);

  const handleSave = async () => {
    try {
      console.log('🔄 Saving program as draft...', program);
      
      if (!program.name?.trim()) {
        toast.error('Παρακαλώ εισάγετε όνομα προγράμματος');
        return;
      }

      // Convert training_dates to string array for database storage
      const trainingDatesStrings = program.training_dates?.map(date => 
        date.toISOString().split('T')[0]
      ) || [];

      // Αποθήκευση ως προσχέδιο
      const savedProgram = await onCreateProgram({
        ...program,
        training_dates: trainingDatesStrings,
        status: 'draft'
      });
      
      console.log('✅ Program saved as draft:', savedProgram);
      setCurrentProgramId(savedProgram.id);
      toast.success('Το πρόγραμμα αποθηκεύτηκε ως προσχέδιο');
      onOpenChange();
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
    }
  };

  const handleClose = () => {
    console.log('Closing program builder dialog');
    setCurrentProgramId(null);
    onOpenChange();
  };

  return {
    currentProgramId,
    setCurrentProgramId,
    handleSave,
    handleClose
  };
};

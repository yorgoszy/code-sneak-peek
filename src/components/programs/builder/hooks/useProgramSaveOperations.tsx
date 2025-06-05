
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

  // Helper function για σωστή μετατροπή ημερομηνιών
  const formatDateToString = (date: Date | string): string => {
    if (typeof date === 'string') {
      return date;
    }
    
    // Χρησιμοποιούμε τοπική ημερομηνία χωρίς timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

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
      if (program.training_dates && program.training_dates.length > 0) {
        trainingDatesStrings = program.training_dates.map(formatDateToString);
      }

      // Αν δεν υπάρχουν ημερομηνίες, βάζουμε την σημερινή
      if (trainingDatesStrings.length === 0) {
        const today = formatDateToString(new Date());
        trainingDatesStrings = [today];
        console.log('📅 No training dates found, using today:', today);
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


import { useState } from 'react';
import { toast } from 'sonner';
import { assignmentService } from '../services/assignmentService';
import { formatDateToLocalString } from '@/utils/dateUtils';

export const useAssignmentDialog = (
  program: any | null,
  onSaveSuccess: () => void
) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!program) {
      toast.error('Δεν έχει επιλεγεί πρόγραμμα');
      return;
    }

    if (!selectedUserId) {
      toast.error('Παρακαλώ επιλέξτε αθλητή');
      return;
    }

    if (selectedDates.length === 0) {
      toast.error('Παρακαλώ επιλέξτε τουλάχιστον μία ημερομηνία');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🎯 Assignment Dialog - Starting save process');
      console.log('📅 Assignment Dialog - Selected dates before processing:', selectedDates);

      // Χρησιμοποιούμε την utility function για σωστό formatting
      const formattedDates = selectedDates.map(date => {
        const formatted = formatDateToLocalString(date);
        console.log(`📅 Assignment Dialog - Converting ${date.toISOString()} → ${formatted}`);
        return formatted;
      });

      console.log('📅 Assignment Dialog - Final formatted dates:', formattedDates);

      const assignmentData = {
        program,
        userId: selectedUserId,
        trainingDates: formattedDates
      };

      console.log('💾 Assignment Dialog - Calling assignment service with:', assignmentData);

      await assignmentService.saveAssignment(assignmentData);
      
      toast.success('Το πρόγραμμα ανατέθηκε επιτυχώς!');
      
      // Reset form
      setSelectedUserId('');
      setSelectedDates([]);
      
      onSaveSuccess();
    } catch (error) {
      console.error('❌ Assignment Dialog - Error:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setSelectedUserId('');
    setSelectedDates([]);
    setIsSubmitting(false);
  };

  return {
    selectedUserId,
    setSelectedUserId,
    selectedDates,
    setSelectedDates,
    isSubmitting,
    handleSave,
    reset
  };
};

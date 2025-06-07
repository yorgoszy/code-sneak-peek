
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
    console.log('💾 [useAssignmentDialog] Starting handleSave');
    
    if (!program) {
      console.error('❌ [useAssignmentDialog] No program selected');
      toast.error('Δεν έχει επιλεγεί πρόγραμμα');
      return;
    }

    if (!selectedUserId) {
      console.error('❌ [useAssignmentDialog] No user selected');
      toast.error('Παρακαλώ επιλέξτε αθλητή');
      return;
    }

    if (selectedDates.length === 0) {
      console.error('❌ [useAssignmentDialog] No dates selected');
      toast.error('Παρακαλώ επιλέξτε τουλάχιστον μία ημερομηνία');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('💾 [useAssignmentDialog] Processing selected dates:', selectedDates);

      // Χρησιμοποιούμε την utility function για σωστό formatting
      const formattedDates = selectedDates.map((date, index) => {
        console.log(`💾 [useAssignmentDialog] Processing date ${index}:`, {
          originalDate: date,
          dateString: date.toString(),
          isoString: date.toISOString(),
          getFullYear: date.getFullYear(),
          getMonth: date.getMonth(),
          getDate: date.getDate(),
          getTimezoneOffset: date.getTimezoneOffset()
        });
        
        const formatted = formatDateToLocalString(date);
        console.log(`💾 [useAssignmentDialog] Date ${index} formatted: ${date.toISOString()} → ${formatted}`);
        return formatted;
      });

      console.log('💾 [useAssignmentDialog] All dates formatted:', formattedDates);

      const assignmentData = {
        program,
        userId: selectedUserId,
        trainingDates: formattedDates
      };

      console.log('💾 [useAssignmentDialog] Calling assignment service with:', assignmentData);

      const result = await assignmentService.saveAssignment(assignmentData);
      
      console.log('✅ [useAssignmentDialog] Assignment saved successfully:', result);
      toast.success('Το πρόγραμμα ανατέθηκε επιτυχώς!');
      
      // Reset form
      setSelectedUserId('');
      setSelectedDates([]);
      
      onSaveSuccess();
    } catch (error) {
      console.error('❌ [useAssignmentDialog] Error during save:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    console.log('🔄 [useAssignmentDialog] Resetting form');
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

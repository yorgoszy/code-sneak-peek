import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CalendarSection } from "./builder/CalendarSection";
import type { ProgramStructure } from "./builder/hooks/useProgramBuilderState";

interface ProgramCalendarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string | null;
  onComplete?: () => void;
}

export const ProgramCalendarDialog: React.FC<ProgramCalendarDialogProps> = ({
  isOpen,
  onClose,
  programId,
  onComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [programData, setProgramData] = useState<any>(null);
  const [calendarProgram, setCalendarProgram] = useState<ProgramStructure>({
    id: '',
    name: '',
    description: '',
    user_id: '',
    user_ids: [],
    is_multiple_assignment: false,
    training_dates: [],
    weeks: []
  });

  useEffect(() => {
    if (isOpen && programId) {
      fetchProgramData();
    }
  }, [isOpen, programId]);

  const fetchProgramData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching program data for ID:', programId);
      
      const { data: program, error } = await supabase
        .from('programs')
        .select(`
          id,
          name,
          description,
          program_weeks (
            id,
            name,
            week_number,
            program_days (
              id,
              name,
              day_number,
              is_test_day,
              test_types,
              is_competition_day
            )
          )
        `)
        .eq('id', programId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching program:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!program) {
        console.error('❌ Program not found with ID:', programId);
        throw new Error('Το πρόγραμμα δεν βρέθηκε');
      }

      console.log('✅ Program data fetched:', program);
      setProgramData(program);
      
      // Μετατροπή σε ProgramStructure format
      const weeks = program.program_weeks?.map((week: any) => ({
        id: week.id,
        name: week.name,
        week_number: week.week_number,
        program_days: week.program_days?.map((day: any) => ({
          id: day.id,
          name: day.name,
          day_number: day.day_number,
          is_test_day: day.is_test_day,
          test_types: day.test_types,
          is_competition_day: day.is_competition_day,
          program_blocks: []
        })) || []
      })) || [];

      console.log('✅ Processed weeks:', weeks);

      setCalendarProgram({
        id: program.id,
        name: program.name,
        description: program.description || '',
        user_id: '',
        user_ids: [],
        is_multiple_assignment: false,
        training_dates: [],
        weeks: weeks
      });
    } catch (error) {
      console.error('💥 Error fetching program data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση του προγράμματος: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalTrainingDays = () => {
    return calendarProgram.weeks.reduce((total, week) => total + (week.program_days?.length || 0), 0);
  };

  const handleTrainingDatesChange = (dates: Date[]) => {
    setCalendarProgram(prev => ({
      ...prev,
      training_dates: dates
    }));
  };

  const handleSaveProgramDates = async () => {
    try {
      if (calendarProgram.training_dates.length === 0) {
        toast.error('Παρακαλώ επιλέξτε ημερομηνίες προπόνησης');
        return;
      }

      setLoading(true);

      // Αποθήκευση των ημερομηνιών στη βάση δεδομένων
      const trainingDates = calendarProgram.training_dates.map(date => 
        date instanceof Date ? date.toISOString().split('T')[0] : date
      );

      // Δημιουργία program assignment
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('No authenticated user');

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', currentUser.user.id)
        .single();

      if (!appUser) throw new Error('App user not found');

      const assignmentData = {
        program_id: calendarProgram.id,
        user_id: appUser.id,
        training_dates: trainingDates,
        status: 'active',
        assigned_at: new Date().toISOString()
      };

      const { error: assignmentError } = await supabase
        .from('program_assignments')
        .insert(assignmentData);

      if (assignmentError) {
        throw new Error(`Failed to create assignment: ${assignmentError.message}`);
      }

      toast.success('Οι ημερομηνίες προπόνησης αποθηκεύτηκαν με επιτυχία!');
      onComplete?.();
      onClose();
    } catch (error) {
      console.error('Error saving program dates:', error);
      toast.error('Σφάλμα κατά την αποθήκευση των ημερομηνιών');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCalendarProgram(prev => ({
      ...prev,
      training_dates: []
    }));
    onClose();
  };

  if (!programId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Επιλογή Ημερομηνιών Προπόνησης - {programData?.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba]"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-none border border-blue-200">
              <p className="text-sm text-blue-700">
                Παρακαλώ επιλέξτε τις ημερομηνίες που θέλετε να κάνετε προπόνηση. 
                Χρειάζεστε {getTotalTrainingDays()} ημερομηνίες συνολικά.
              </p>
            </div>

            {getTotalTrainingDays() > 0 && (
              <CalendarSection
                program={calendarProgram}
                totalDays={getTotalTrainingDays()}
                onTrainingDatesChange={handleTrainingDatesChange}
              />
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                className="rounded-none"
                disabled={loading}
              >
                Αργότερα
              </Button>
              <Button
                onClick={handleSaveProgramDates}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                disabled={loading || calendarProgram.training_dates.length !== getTotalTrainingDays()}
              >
                {loading ? 'Αποθήκευση...' : 'Αποθήκευση Ημερομηνιών'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
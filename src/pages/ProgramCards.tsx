
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { ProgramCard } from "@/components/active-programs/ProgramCard";
import { supabase } from "@/integrations/supabase/client";

const ProgramCards = () => {
  const navigate = useNavigate();
  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();

  const handleDeleteProgram = async (assignmentId: string) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;')) {
      return;
    }

    try {
      console.log('🗑️ Διαγραφή assignment:', assignmentId);
      
      // Διαγραφή του assignment από τη βάση δεδομένων
      const { error: deleteError } = await supabase
        .from('program_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteError) {
        console.error('❌ Σφάλμα κατά τη διαγραφή:', deleteError);
        alert('Σφάλμα κατά τη διαγραφή του προγράμματος');
        return;
      }

      console.log('✅ Assignment διαγράφηκε επιτυχώς');
      // Ανανέωση των δεδομένων
      refetch();
    } catch (error) {
      console.error('❌ Σφάλμα κατά τη διαγραφή:', error);
      alert('Σφάλμα κατά τη διαγραφή του προγράμματος');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full items-center justify-center">
        <div>Φόρτωση προγραμμάτων...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full items-center justify-center">
        <div className="text-red-600">Σφάλμα κατά τη φόρτωση: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="rounded-none"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Επιστροφή
              </Button>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CreditCard className="h-8 w-8 text-[#00ffba]" />
                Program Cards
              </h1>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                Όλα τα Ενεργά Προγράμματα
              </h2>
              <div className="text-sm text-gray-500">
                Σύνολο: {activePrograms.length} προγράμματα
              </div>
            </div>

            {activePrograms.length > 0 ? (
              <div className="grid gap-4">
                {activePrograms.map((assignment) => (
                  <div key={assignment.id} className="flex justify-center">
                    <ProgramCard
                      assignment={assignment}
                      onRefresh={refetch}
                      onDelete={handleDeleteProgram}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">Δεν υπάρχουν ενεργά προγράμματα</p>
                <p className="text-sm">Δημιουργήστε νέες αναθέσεις από το ProgramBuilder</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramCards;

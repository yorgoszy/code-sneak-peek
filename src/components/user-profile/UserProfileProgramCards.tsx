
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle, Clock } from "lucide-react";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { ProgramCard } from "@/components/active-programs/ProgramCard";

interface UserProfileProgramCardsProps {
  userProfile: any;
}

export const UserProfileProgramCards: React.FC<UserProfileProgramCardsProps> = ({ userProfile }) => {
  const { data: allActivePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { calculateWorkoutStats, getWorkoutCompletions } = useWorkoutCompletionsCache();

  // Filter programs for the specific user
  const userPrograms = allActivePrograms.filter(program => program.user_id === userProfile.id);

  const [programsWithStats, setProgramsWithStats] = useState<any[]>([]);

  useEffect(() => {
    const loadProgramsWithStats = async () => {
      const programsWithStatsData = await Promise.all(
        userPrograms.map(async (assignment) => {
          const completions = await getWorkoutCompletions(assignment.id);
          const stats = calculateWorkoutStats(completions, assignment.training_dates || []);
          return {
            ...assignment,
            stats
          };
        })
      );
      setProgramsWithStats(programsWithStatsData);
    };

    if (userPrograms.length > 0) {
      loadProgramsWithStats();
    } else {
      setProgramsWithStats([]);
    }
  }, [userPrograms, getWorkoutCompletions, calculateWorkoutStats]);

  // Διαχωρισμός προγραμμάτων σε ενεργά και ολοκληρωμένα
  const activeIncompletePrograms = programsWithStats.filter(program => program.stats.progress < 100);
  const completedPrograms = programsWithStats.filter(program => program.stats.progress >= 100);

  const handleDelete = async (assignmentId: string) => {
    // Regular users typically cannot delete programs
    console.log('Delete not allowed for user profiles');
  };

  if (isLoading) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Program Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Φόρτωση προγραμμάτων...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Program Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            Σφάλμα κατά τη φόρτωση των προγραμμάτων
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userPrograms.length === 0) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Program Cards - {userProfile.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Δεν έχετε ενεργά προγράμματα</p>
            <p className="text-sm">Επικοινωνήστε με τον προπονητή σας για ανάθεση προγράμματος</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Program Cards - {userProfile.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-8">
          {/* Αριστερή στήλη - Ενεργά Προγράμματα */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Ενεργά Προγράμματα
              </h3>
              <div className="text-sm text-gray-500">
                {activeIncompletePrograms.length} προγράμματα
              </div>
            </div>

            {activeIncompletePrograms.length > 0 ? (
              <div className="space-y-4">
                {activeIncompletePrograms.map((assignment) => (
                  <div key={assignment.id} className="flex justify-center">
                    <ProgramCard
                      assignment={assignment}
                      onRefresh={refetch}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Δεν υπάρχουν ενεργά προγράμματα</p>
              </div>
            )}
          </div>

          {/* Δεξιά στήλη - Ολοκληρωμένα Προγράμματα */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#00ffba]" />
                Ολοκληρωμένα Προγράμματα
              </h3>
              <div className="text-sm text-gray-500">
                {completedPrograms.length} προγράμματα
              </div>
            </div>

            {completedPrograms.length > 0 ? (
              <div className="space-y-4">
                {completedPrograms.map((assignment) => (
                  <div key={assignment.id} className="flex justify-center">
                    <ProgramCard
                      assignment={assignment}
                      onRefresh={refetch}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Δεν υπάρχουν ολοκληρωμένα προγράμματα</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

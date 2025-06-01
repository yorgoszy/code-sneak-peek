
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, User, Clock } from "lucide-react";
import { useState } from "react";
import { ProgramPreviewDialog } from "@/components/programs/ProgramPreviewDialog";

interface ActiveProgramsListProps {
  programs: any[];
}

export const ActiveProgramsList = ({ programs }: ActiveProgramsListProps) => {
  const [previewProgram, setPreviewProgram] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  console.log('🎯 ActiveProgramsList received programs:', programs);
  console.log('📏 Programs array length:', programs?.length || 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const calculateProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    if (elapsed < 0) return 0; // Δεν έχει ξεκινήσει ακόμα
    if (elapsed > totalDuration) return 100; // Έχει τελειώσει
    
    return Math.round((elapsed / totalDuration) * 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getDaysUntilStart = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isComingSoon = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    return start > now;
  };

  const handlePreviewProgram = (program: any) => {
    setPreviewProgram(program);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewProgram(null);
  };

  if (!programs || programs.length === 0) {
    console.log('⚠️ No programs to display');
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Δεν έχετε ενεργά προγράμματα</p>
            <p className="text-sm">Δεν βρέθηκαν προγράμματα που να είναι ενεργά ή να ξεκινούν σύντομα</p>
            <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-700">
              Debugging: Έλεγχος δεδομένων σε εξέλιξη...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('✅ Rendering programs list with', programs.length, 'programs');

  return (
    <>
      <div className="grid gap-4">
        {programs.map((assignment, index) => {
          console.log(`🔍 Rendering assignment ${index + 1}:`, assignment);
          const program = assignment.programs;
          if (!program) {
            console.warn('⚠️ Program not found for assignment:', assignment);
            return (
              <Card key={assignment.id} className="rounded-none border-red-200">
                <CardContent className="p-4">
                  <div className="text-red-600">
                    Σφάλμα: Δεν βρέθηκε πρόγραμμα για το assignment {assignment.id}
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          const comingSoon = isComingSoon(assignment.start_date);
          const progress = comingSoon ? 0 : calculateProgress(assignment.start_date, assignment.end_date);
          const daysRemaining = comingSoon ? 0 : getDaysRemaining(assignment.end_date);
          const daysUntilStart = comingSoon ? getDaysUntilStart(assignment.start_date) : 0;
          
          console.log(`📊 Program ${program.name} render data:`, {
            comingSoon,
            progress,
            daysRemaining,
            daysUntilStart
          });
          
          return (
            <Card key={assignment.id} className="rounded-none">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      {comingSoon && (
                        <Badge variant="secondary" className="rounded-none">
                          <Clock className="w-3 h-3 mr-1" />
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{program.description}</p>
                  </div>
                  <Button
                    onClick={() => handlePreviewProgram(program)}
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    title="Προβολή Προγράμματος"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Έναρξη:</span>
                    <span>{formatDate(assignment.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Λήξη:</span>
                    <span>{formatDate(assignment.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Από:</span>
                    <span>{program.app_users?.name || 'Άγνωστος'}</span>
                  </div>
                </div>
                
                {comingSoon ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Ξεκινά σε</span>
                      <span className="font-medium text-blue-600">
                        {daysUntilStart === 0 ? 'Σήμερα' : 
                         daysUntilStart === 1 ? 'Αύριο' : 
                         `${daysUntilStart} ημέρες`}
                      </span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center text-blue-700 text-sm">
                      Το πρόγραμμα θα ξεκινήσει στις {formatDate(assignment.start_date)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Πρόοδος προγράμματος</span>
                      <span className="font-medium">
                        {daysRemaining > 0 ? `${daysRemaining} ημέρες απομένουν` : 'Έχει λήξει'}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{progress}% ολοκληρωμένο</span>
                      <span>
                        {progress === 100 ? 'Ολοκληρώθηκε' : `${100 - progress}% απομένει`}
                      </span>
                    </div>
                  </div>
                )}

                {assignment.notes && (
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">Σημειώσεις:</span>
                    <p className="text-gray-700 mt-1">{assignment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ProgramPreviewDialog
        program={previewProgram}
        isOpen={previewOpen}
        onOpenChange={handlePreviewClose}
      />
    </>
  );
};

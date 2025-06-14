
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ProgramBuilderDialog } from "@/components/programs/ProgramBuilderDialog";
import { AddExerciseDialog } from "@/components/AddExerciseDialog";
import { NewUserDialog } from "@/components/NewUserDialog";
import { useProgramsData } from "@/hooks/useProgramsData";
import { usePrograms } from "@/hooks/usePrograms";

const quickActions = [
  {
    title: "Γρήγορες ενέργειες",
    subtitle: "",
    color: "text-blue-600"
  },
  {
    title: "Δημιουργία Προγράμματος",
    subtitle: "Δημιουργήστε νέο πρόγραμμα προπόνησης",
    color: "text-green-600",
    action: "program"
  },
  {
    title: "Προσθήκη Χρήστη",
    subtitle: "Εγγραφή νέου χρήστη",
    color: "text-purple-600",
    action: "user"
  },
  {
    title: "Νέα Άσκηση",
    subtitle: "Προσθήκη άσκησης στη βιβλιοθήκη",
    color: "text-orange-600",
    action: "exercise"
  }
];

interface QuickActionsProps {
  onProgramCreated?: () => void;
}

export const QuickActions = ({ onProgramCreated }: QuickActionsProps) => {
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const { users, exercises } = useProgramsData();
  const { saveProgram } = usePrograms();

  const handleActionClick = (action: string) => {
    switch (action) {
      case "program":
        setProgramDialogOpen(true);
        break;
      case "exercise":
        setExerciseDialogOpen(true);
        break;
      case "user":
        setUserDialogOpen(true);
        break;
    }
  };

  const handleUserCreated = () => {
    // Refresh user data if needed
  };

  const handleExerciseAdded = () => {
    // Refresh exercise data if needed
  };

  const handleCreateProgram = async (programData: any) => {
    try {
      console.log('🔄 Creating new program...', programData);
      await saveProgram(programData);
      setProgramDialogOpen(false);
      
      // Trigger refresh of active programs in parent component
      if (onProgramCreated) {
        console.log('✅ Program created, triggering refresh...');
        onProgramCreated();
      }
    } catch (error) {
      console.error('Error creating program:', error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quickActions.slice(1).map((action, index) => (
              <div key={index} className="flex flex-col space-y-1">
                <Button 
                  variant="outline" 
                  className="justify-start rounded-none text-left h-auto py-3"
                  onClick={() => handleActionClick(action.action)}
                >
                  <div>
                    <p className={`text-sm font-medium ${action.color}`}>{action.title}</p>
                    <p className="text-xs text-gray-500">{action.subtitle}</p>
                  </div>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ProgramBuilderDialog
        isOpen={programDialogOpen}
        onOpenChange={() => setProgramDialogOpen(false)}
        users={users}
        exercises={exercises}
        onCreateProgram={handleCreateProgram}
      />

      <AddExerciseDialog
        open={exerciseDialogOpen}
        onOpenChange={setExerciseDialogOpen}
        onSuccess={handleExerciseAdded}
      />

      <NewUserDialog
        isOpen={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </>
  );
};

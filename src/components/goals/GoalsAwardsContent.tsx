import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Target, Award, Plus, Search, Loader2 } from 'lucide-react';
import { useAllActiveGoals, type UserGoalWithUser } from '@/hooks/useAllActiveGoals';
import { GoalCard } from './GoalCard';
import { CreateGoalDialogWithUserSelect } from './CreateGoalDialogWithUserSelect';

interface GoalsAwardsContentProps {
  coachId?: string;
}

export const GoalsAwardsContent: React.FC<GoalsAwardsContentProps> = ({ coachId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UserGoalWithUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    updateProgress,
  } = useAllActiveGoals();

  const filteredGoals = goals.filter(goal =>
    goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    goal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    goal.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateOrUpdateGoal = async (goalData: any) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData);
    } else {
      await createGoal(goalData);
    }
    setEditingGoal(null);
  };

  const handleDeleteGoal = async () => {
    if (deletingGoalId) {
      await deleteGoal(deletingGoalId);
      setDeletingGoalId(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with New Goal Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Αναζήτηση στόχου ή αθλητή..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-none w-full"
          />
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέος Στόχος
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#00ffba]" />
        </div>
      ) : (
        <Tabs defaultValue="goals" className="w-full">
          <TabsList className="rounded-none w-full sm:w-auto grid grid-cols-1 sm:flex">
            <TabsTrigger value="goals" className="rounded-none text-xs sm:text-sm">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Ενεργοί Στόχοι ({filteredGoals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {filteredGoals.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground border border-dashed rounded-none">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Δεν υπάρχουν ενεργοί στόχοι</p>
                <p className="text-[10px] sm:text-xs mt-1">Πατήστε "Νέος Στόχος" για να δημιουργήσετε</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:gap-3">
                {filteredGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    coachId={coachId}
                    showUserInfo={true}
                    onEdit={(g) => {
                      setEditingGoal(g as UserGoalWithUser);
                      setIsCreateDialogOpen(true);
                    }}
                    onDelete={(id) => {
                      setDeletingGoalId(id);
                      setDeleteDialogOpen(true);
                    }}
                    onComplete={completeGoal}
                    onUpdateProgress={updateProgress}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Create/Edit Goal Dialog */}
      <CreateGoalDialogWithUserSelect
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleCreateOrUpdateGoal}
        editingGoal={editingGoal}
        coachId={coachId}
      />

      {/* Delete Goal Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Ο στόχος θα διαγραφεί οριστικά.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGoal} 
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

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
import { useUserGoals, type UserGoal } from '@/hooks/useUserGoals';
import { GoalCard } from './GoalCard';
import { AwardCard } from './AwardCard';
import { CreateGoalDialog } from './CreateGoalDialog';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';

interface GoalsAwardsContentProps {
  coachId?: string;
}

export const GoalsAwardsContent: React.FC<GoalsAwardsContentProps> = ({ coachId }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [deleteAwardDialogOpen, setDeleteAwardDialogOpen] = useState(false);
  const [deletingAwardId, setDeletingAwardId] = useState<string | null>(null);

  const {
    goals,
    awards,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    updateProgress,
    deleteAward,
    toggleAwardDisplay,
  } = useUserGoals(selectedUserId || undefined);

  const filteredGoals = goals.filter(goal =>
    goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    goal.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAwards = awards.filter(award =>
    award.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    award.description?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleDeleteAward = async () => {
    if (deletingAwardId) {
      await deleteAward(deletingAwardId);
      setDeletingAwardId(null);
      setDeleteAwardDialogOpen(false);
    }
  };

  const activeGoals = filteredGoals.filter(g => g.status === 'in_progress');
  const completedGoals = filteredGoals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* User Selection */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="flex-1 sm:max-w-md">
          <UserSearchCombobox
            value={selectedUserId || ''}
            onValueChange={setSelectedUserId}
            placeholder="Αναζήτηση αθλητή..."
            coachId={coachId}
          />
        </div>
        {selectedUserId && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Νέος Στόχος
          </Button>
        )}
      </div>

      {!selectedUserId ? (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          <Target className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm sm:text-base">Επιλέξτε έναν αθλητή για να δείτε τους στόχους και τα βραβεία του</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#00ffba]" />
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Αναζήτηση..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-none w-full sm:max-w-sm"
            />
          </div>

          <Tabs defaultValue="goals" className="w-full">
            <TabsList className="rounded-none w-full sm:w-auto grid grid-cols-2 sm:flex">
              <TabsTrigger value="goals" className="rounded-none text-xs sm:text-sm">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Στόχοι ({goals.length})
              </TabsTrigger>
              <TabsTrigger value="awards" className="rounded-none text-xs sm:text-sm">
                <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Βραβεία ({awards.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              {/* Active Goals */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-muted-foreground">
                  Ενεργοί Στόχοι ({activeGoals.length})
                </h3>
                {activeGoals.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground border border-dashed rounded-none">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">Δεν υπάρχουν ενεργοί στόχοι</p>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:gap-3">
                    {activeGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        coachId={coachId}
                        onEdit={(g) => {
                          setEditingGoal(g);
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
              </div>

              {/* Completed Goals */}
              {completedGoals.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-muted-foreground">
                    Ολοκληρωμένοι Στόχοι ({completedGoals.length})
                  </h3>
                  <div className="grid gap-2 sm:gap-3">
                    {completedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        coachId={coachId}
                        onDelete={(id) => {
                          setDeletingGoalId(id);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="awards" className="mt-4 sm:mt-6">
              {filteredAwards.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground border border-dashed rounded-none">
                  <Award className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">Δεν υπάρχουν βραβεία ακόμα</p>
                  <p className="text-[10px] sm:text-xs mt-1">Τα βραβεία δημιουργούνται όταν ολοκληρώνονται στόχοι</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:gap-3">
                  {filteredAwards.map((award) => (
                    <AwardCard
                      key={award.id}
                      award={award}
                      onDelete={(id) => {
                        setDeletingAwardId(id);
                        setDeleteAwardDialogOpen(true);
                      }}
                      onToggleDisplay={toggleAwardDisplay}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Create/Edit Goal Dialog */}
      {selectedUserId && (
        <CreateGoalDialog
          isOpen={isCreateDialogOpen}
          onClose={() => {
            setIsCreateDialogOpen(false);
            setEditingGoal(null);
          }}
          onSubmit={handleCreateOrUpdateGoal}
          userId={selectedUserId}
          editingGoal={editingGoal}
        />
      )}

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

      {/* Delete Award Confirmation */}
      <AlertDialog open={deleteAwardDialogOpen} onOpenChange={setDeleteAwardDialogOpen}>
        <AlertDialogContent className="rounded-none max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Το βραβείο θα διαγραφεί οριστικά.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAward} 
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

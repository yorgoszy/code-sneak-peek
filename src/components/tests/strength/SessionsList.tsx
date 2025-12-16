import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Link2 } from "lucide-react";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Attempt, ExerciseTest, SessionWithDetails } from "./types";
import { ExerciseLinkDialog } from "./ExerciseLinkDialog";

interface SessionsListProps {
  sessions: SessionWithDetails[];
  onEdit: (session: SessionWithDetails) => void;
  onDelete: (sessionId: string) => void;
}

export const SessionsList = ({ sessions, onEdit, onDelete }: SessionsListProps) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<{id: string, name: string} | null>(null);

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      onDelete(sessionToDelete);
      setSessionToDelete(null);
    }
  };

  const handleLinkClick = (exerciseId: string, exerciseName: string) => {
    setSelectedExercise({ id: exerciseId, name: exerciseName });
    setLinkDialogOpen(true);
  };

  if (sessions.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">
        Δεν υπάρχουν τεστ δύναμης για αυτόν τον αθλητή
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="border rounded-none p-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">
                  Τεστ Δύναμης - {new Date(session.start_date).toLocaleDateString('el-GR')}
                  {session.start_date !== session.end_date && 
                    ` έως ${new Date(session.end_date).toLocaleDateString('el-GR')}`
                  }
                </h4>
                <p className="text-sm text-gray-600">
                  Ασκήσεις: {session.exercise_tests.length}
                </p>
                {session.exercise_tests.map((exerciseTest, index) => {
                  const oneRMAttempt = exerciseTest.attempts.find((attempt: Attempt) => attempt.is_1rm);
                  return (
                    <div key={index} className="mt-1 flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{exerciseTest.exercise_name}</p>
                        <p className="text-xs text-gray-500">
                          Προσπάθειες: {exerciseTest.attempts.length}
                        </p>
                        {oneRMAttempt && (
                          <Badge variant="outline" className="rounded-none text-xs">
                            1RM: {oneRMAttempt.weight_kg}kg @ {oneRMAttempt.velocity_ms}m/s
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLinkClick(exerciseTest.exercise_id, exerciseTest.exercise_name)}
                        className="rounded-none p-1 h-6"
                        title="Σύνδεση ασκήσεων"
                      >
                        <Link2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
                {session.notes && (
                  <p className="text-xs text-gray-500 mt-1">{session.notes}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(session)}
                  className="rounded-none text-xs"
                >
                  Επεξεργασία
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteClick(session.id!)}
                  className="rounded-none text-xs"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setSessionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το τεστ;"
      />

      {selectedExercise && (
        <ExerciseLinkDialog
          isOpen={linkDialogOpen}
          onClose={() => {
            setLinkDialogOpen(false);
            setSelectedExercise(null);
          }}
          exerciseId={selectedExercise.id}
          exerciseName={selectedExercise.name}
          onLinksUpdated={() => {}}
        />
      )}
    </>
  );
};

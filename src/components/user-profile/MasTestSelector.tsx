import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface MasTestSelectorProps {
  exercises: Array<{
    id: string;
    name: string;
    sessions: Array<{
      sessionId: string;
      date: string;
      mas_meters: number;
      recordNumber: number;
    }>;
  }>;
  selectedExercises: string[];
  selectedSessions: Record<string, string[]>;
  onExerciseToggle: (exerciseId: string) => void;
  onSessionToggle: (exerciseId: string, sessionId: string) => void;
}

export const MasTestSelector: React.FC<MasTestSelectorProps> = ({
  exercises,
  selectedExercises,
  selectedSessions,
  onExerciseToggle,
  onSessionToggle
}) => {
  return (
    <Card className="rounded-none max-w-2xl" style={{ width: 'calc(100% + 10px)' }}>
      <CardHeader className="p-[5px]">
        <CardTitle className="text-sm">Επιλογή Ασκήσεων MAS Test</CardTitle>
      </CardHeader>
      <CardContent className="p-[5px] space-y-3">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="space-y-2">
            {/* Exercise Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`exercise-${exercise.id}`}
                checked={selectedExercises.includes(exercise.id)}
                onCheckedChange={() => onExerciseToggle(exercise.id)}
                className="rounded-none"
              />
              <Label
                htmlFor={`exercise-${exercise.id}`}
                className="text-sm font-medium cursor-pointer"
                onClick={() => onExerciseToggle(exercise.id)}
              >
                {exercise.name}
              </Label>
            </div>

            {/* Sessions if exercise is selected */}
            {selectedExercises.includes(exercise.id) && exercise.sessions.length > 0 && (
              <div className="ml-6 space-y-1">
                {exercise.sessions.map((session) => (
                  <div key={session.sessionId} className="flex items-center space-x-2">
                    <Checkbox
                      id={`session-${session.sessionId}`}
                      checked={selectedSessions[exercise.id]?.includes(session.sessionId) || false}
                      onCheckedChange={() => onSessionToggle(exercise.id, session.sessionId)}
                      className="rounded-none h-3 w-3"
                    />
                    <Label
                      htmlFor={`session-${session.sessionId}`}
                      className="text-xs cursor-pointer text-gray-600"
                      onClick={() => onSessionToggle(exercise.id, session.sessionId)}
                    >
                      {session.recordNumber}η καταγραφή - {session.mas_meters}m ({new Date(session.date).toLocaleDateString('el-GR')})
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {exercises.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-xs">
            Δεν υπάρχουν διαθέσιμες ασκήσεις
          </div>
        )}
      </CardContent>
    </Card>
  );
};

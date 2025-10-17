import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { User, Dumbbell } from "lucide-react";

interface EnduranceRecordTabProps {
  users: any[];
  exercises: any[];
}

export const EnduranceRecordTab: React.FC<EnduranceRecordTabProps> = ({
  users,
  exercises
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  const userOptions = useMemo(() => 
    users.map(user => ({
      value: user.id,
      label: user.name
    })),
    [users]
  );

  const exerciseOptions = useMemo(() => 
    exercises.map(exercise => ({
      value: exercise.id,
      label: exercise.name
    })),
    [exercises]
  );

  return (
    <div className="space-y-4">
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Ασκούμενος
              </label>
              <Combobox
                options={userOptions}
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                placeholder="Επιλέξτε ασκούμενο..."
                emptyMessage="Δεν βρέθηκε ασκούμενος"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Άσκηση
              </label>
              <Combobox
                options={exerciseOptions}
                value={selectedExerciseId}
                onValueChange={setSelectedExerciseId}
                placeholder="Επιλέξτε άσκηση..."
                emptyMessage="Δεν βρέθηκε άσκηση"
                className="rounded-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

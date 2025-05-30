
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";

interface LoadVelocityFiltersProps {
  availableExercises: string[];
  availableDates: string[];
  selectedExercises: string[];
  selectedDates: string[];
  onExerciseToggle: (exercise: string) => void;
  onDateToggle: (date: string) => void;
  onSelectAllExercises: () => void;
  onSelectAllDates: () => void;
}

export const LoadVelocityFilters = ({
  availableExercises,
  availableDates,
  selectedExercises,
  selectedDates,
  onExerciseToggle,
  onDateToggle,
  onSelectAllExercises,
  onSelectAllDates
}: LoadVelocityFiltersProps) => {
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [dateSearchTerm, setDateSearchTerm] = useState('');

  const filteredExercises = availableExercises.filter(exercise =>
    exercise.toLowerCase().includes(exerciseSearchTerm.toLowerCase())
  );

  const filteredDates = availableDates.filter(date =>
    date.includes(dateSearchTerm)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Επιλογή Ασκήσεων</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ασκήσεις</Label>
              <button
                onClick={onSelectAllExercises}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedExercises.length === availableExercises.length ? 'Αποεπιλογή όλων' : 'Επιλογή όλων'}
              </button>
            </div>

            <Command className="border border-gray-200 bg-white">
              <CommandInput 
                placeholder="Αναζήτηση άσκησης..." 
                value={exerciseSearchTerm}
                onValueChange={setExerciseSearchTerm}
              />
              <CommandList className="max-h-48">
                <CommandEmpty>Δεν βρέθηκε άσκηση</CommandEmpty>
                {filteredExercises.map(exercise => (
                  <CommandItem
                    key={exercise}
                    className={`cursor-pointer p-3 hover:bg-gray-100 ${
                      selectedExercises.includes(exercise) ? 'bg-blue-50 text-blue-700 font-medium' : ''
                    }`}
                    onSelect={() => onExerciseToggle(exercise)}
                  >
                    {exercise}
                    {selectedExercises.includes(exercise) && (
                      <span className="ml-auto text-blue-600">✓</span>
                    )}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>

            {selectedExercises.length > 0 && (
              <p className="text-sm text-gray-600">
                Επιλεγμένες ({selectedExercises.length}): {selectedExercises.join(', ')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Επιλογή Ημερομηνιών</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ημερομηνίες</Label>
              <button
                onClick={onSelectAllDates}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedDates.length === availableDates.length ? 'Αποεπιλογή όλων' : 'Επιλογή όλων'}
              </button>
            </div>

            <Command className="border border-gray-200 bg-white">
              <CommandInput 
                placeholder="Αναζήτηση ημερομηνίας..." 
                value={dateSearchTerm}
                onValueChange={setDateSearchTerm}
              />
              <CommandList className="max-h-48">
                <CommandEmpty>Δεν βρέθηκε ημερομηνία</CommandEmpty>
                {filteredDates.map(date => (
                  <CommandItem
                    key={date}
                    className={`cursor-pointer p-3 hover:bg-gray-100 ${
                      selectedDates.includes(date) ? 'bg-blue-50 text-blue-700 font-medium' : ''
                    }`}
                    onSelect={() => onDateToggle(date)}
                  >
                    {new Date(date).toLocaleDateString('el-GR')}
                    {selectedDates.includes(date) && (
                      <span className="ml-auto text-blue-600">✓</span>
                    )}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>

            {selectedDates.length > 0 && (
              <p className="text-sm text-gray-600">
                Επιλεγμένες ({selectedDates.length}): {selectedDates.map(date => 
                  new Date(date).toLocaleDateString('el-GR')
                ).join(', ')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

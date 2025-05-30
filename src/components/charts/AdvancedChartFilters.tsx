
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AdvancedChartFiltersProps {
  testType: string;
  availableExercises: any[];
  availableYears: number[];
  selectedExercises: string[];
  selectedYear: number;
  selectedTestNumbers: number[];
  onExercisesChange: (exercises: string[]) => void;
  onYearChange: (year: number) => void;
  onTestNumbersChange: (testNumbers: number[]) => void;
}

export const AdvancedChartFilters = ({
  testType,
  availableExercises,
  availableYears,
  selectedExercises,
  selectedYear,
  selectedTestNumbers,
  onExercisesChange,
  onYearChange,
  onTestNumbersChange
}: AdvancedChartFiltersProps) => {

  const handleExerciseToggle = (exerciseId: string, checked: boolean) => {
    if (checked) {
      onExercisesChange([...selectedExercises, exerciseId]);
    } else {
      onExercisesChange(selectedExercises.filter(id => id !== exerciseId));
    }
  };

  const handleSelectAllExercises = () => {
    if (selectedExercises.length === availableExercises.length) {
      onExercisesChange([]);
    } else {
      onExercisesChange(availableExercises.map(ex => ex.id));
    }
  };

  const handleTestNumberToggle = (testNumber: number, checked: boolean) => {
    if (checked) {
      onTestNumbersChange([...selectedTestNumbers, testNumber].sort());
    } else {
      onTestNumbersChange(selectedTestNumbers.filter(num => num !== testNumber));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-none">
      {/* Επιλογή έτους */}
      <div className="space-y-2">
        <Label>Έτος</Label>
        <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
          <SelectTrigger className="rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Επιλογή ασκήσεων */}
      {testType === 'strength' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Ασκήσεις</Label>
            <button
              onClick={handleSelectAllExercises}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedExercises.length === availableExercises.length ? 'Αποεπιλογή όλων' : 'Επιλογή όλων'}
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-2 border border-gray-200 p-2 bg-white">
            {availableExercises.map(exercise => (
              <div key={exercise.id} className="flex items-center space-x-2">
                <Checkbox
                  id={exercise.id}
                  checked={selectedExercises.includes(exercise.id)}
                  onCheckedChange={(checked) => handleExerciseToggle(exercise.id, checked as boolean)}
                />
                <label 
                  htmlFor={exercise.id}
                  className="text-sm cursor-pointer flex-1"
                  onClick={() => handleExerciseToggle(exercise.id, !selectedExercises.includes(exercise.id))}
                >
                  {exercise.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Επιλογή τεστ (τελευταίο, προ-τελευταίο κτλ) */}
      <div className="space-y-2">
        <Label>Τεστ προς σύγκριση</Label>
        <div className="space-y-2 border border-gray-200 p-2 bg-white max-h-32 overflow-y-auto">
          {[1, 2, 3, 4, 5].map(testNumber => (
            <div key={testNumber} className="flex items-center space-x-2">
              <Checkbox
                id={`test-${testNumber}`}
                checked={selectedTestNumbers.includes(testNumber)}
                onCheckedChange={(checked) => handleTestNumberToggle(testNumber, checked as boolean)}
              />
              <label 
                htmlFor={`test-${testNumber}`}
                className="text-sm cursor-pointer flex-1"
                onClick={() => handleTestNumberToggle(testNumber, !selectedTestNumbers.includes(testNumber))}
              >
                {testNumber === 1 ? 'Τελευταίο τεστ' : 
                 testNumber === 2 ? 'Προ-τελευταίο τεστ' : 
                 `${testNumber}ο από το τέλος`}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

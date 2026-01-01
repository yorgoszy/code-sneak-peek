import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";

interface TestDaySelectorProps {
  isTestDay: boolean;
  selectedTestTypes: string[];
  onTestDayChange: (isTestDay: boolean) => void;
  onTestTypesChange: (testTypes: string[]) => void;
}

const TEST_TYPES = [
  { value: 'anthropometric', label: 'Ανθρωπομετρικά' },
  { value: 'functional', label: 'Λειτουργικά' },
  { value: 'endurance', label: 'Αντοχή' },
  { value: 'jump', label: 'Άλματα' },
  { value: 'strength', label: 'Δύναμη' }
];

export const TestDaySelector: React.FC<TestDaySelectorProps> = ({
  isTestDay,
  selectedTestTypes,
  onTestDayChange,
  onTestTypesChange
}) => {
  const handleTestTypeToggle = (testType: string) => {
    const newTestTypes = selectedTestTypes.includes(testType)
      ? selectedTestTypes.filter(t => t !== testType)
      : [...selectedTestTypes, testType];
    onTestTypesChange(newTestTypes);
  };

  return (
    <div className="space-y-3 p-3 bg-yellow-50 border border-yellow-200 rounded-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-yellow-600" />
          <Label htmlFor="test-day-switch" className="text-sm font-semibold text-yellow-900">
            Ημέρα Τεστ
          </Label>
        </div>
        <Switch
          id="test-day-switch"
          checked={isTestDay}
          onCheckedChange={onTestDayChange}
        />
      </div>

      {isTestDay && (
        <div className="space-y-2 pt-2 border-t border-yellow-200">
          <Label className="text-xs text-yellow-800">Επιλέξτε τύπους τεστ:</Label>
          <div className="space-y-2">
            {TEST_TYPES.map((testType) => (
              <div key={testType.value} className="flex items-center gap-2">
                <Checkbox
                  id={`test-${testType.value}`}
                  checked={selectedTestTypes.includes(testType.value)}
                  onCheckedChange={() => handleTestTypeToggle(testType.value)}
                />
                <label
                  htmlFor={`test-${testType.value}`}
                  className="text-sm text-gray-700 cursor-pointer select-none flex-1"
                >
                  {testType.label}
                </label>
              </div>
            ))}
          </div>
          
          {selectedTestTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {selectedTestTypes.map((type) => {
                const testType = TEST_TYPES.find(t => t.value === type);
                return testType ? (
                  <Badge key={type} variant="secondary" className="rounded-none text-xs">
                    {testType.label}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

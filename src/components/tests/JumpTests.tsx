
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const jumpFields = [
  { key: 'nonCounterMovementJump', label: 'Non-Counter Movement Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'counterMovementJump', label: 'Counter Movement Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'depthJump', label: 'Depth Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'broadJump', label: 'Broad Jump', type: 'number', step: '0.01', placeholder: 'm' },
  { key: 'tripleJumpLeft', label: 'Triple Jump Αριστερό', type: 'number', step: '0.01', placeholder: 'm' },
  { key: 'tripleJumpRight', label: 'Triple Jump Δεξί', type: 'number', step: '0.01', placeholder: 'm' }
];

interface JumpTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
}

export const JumpTests = ({ selectedAthleteId, selectedDate, hideSubmitButton = false }: JumpTestsProps) => {
  const [formData, setFormData] = useState({
    nonCounterMovementJump: '',
    counterMovementJump: '',
    depthJump: '',
    broadJump: '',
    tripleJumpLeft: '',
    tripleJumpRight: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {jumpFields.map((field) => (
        <Card key={field.key} className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{field.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              type={field.type}
              step={field.step}
              placeholder={field.placeholder}
              value={formData[field.key as keyof typeof formData]}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="rounded-none"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

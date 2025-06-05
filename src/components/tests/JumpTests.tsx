
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const jumpFields = [
  { key: 'nonCounterMovementJump', label: 'Non-Counter Movement Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'counterMovementJump', label: 'Counter Movement Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'depthJump', label: 'Depth Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'broadJump', label: 'Broad Jump', type: 'number', step: '0.01', placeholder: 'm' },
  { key: 'tripleJumpLeft', label: 'Triple Jump Αριστερό', type: 'number', step: '0.01', placeholder: 'm' },
  { key: 'tripleJumpRight', label: 'Triple Jump Δεξί', type: 'number', step: '0.01', placeholder: 'm' }
];

interface JumpData {
  nonCounterMovementJump: string;
  counterMovementJump: string;
  depthJump: string;
  broadJump: string;
  tripleJumpLeft: string;
  tripleJumpRight: string;
}

interface JumpTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
  formData?: JumpData;
  onDataChange?: (data: JumpData) => void;
}

export const JumpTests = ({ 
  selectedAthleteId, 
  selectedDate, 
  hideSubmitButton = false,
  formData,
  onDataChange
}: JumpTestsProps) => {
  const handleInputChange = (field: string, value: string) => {
    if (onDataChange && formData) {
      onDataChange({ ...formData, [field]: value });
    }
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
              value={formData ? formData[field.key as keyof JumpData] : ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="rounded-none"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const jumpFields = [
  { key: 'nonCounterMovementJump', label: 'Non-Counter Movement Jump (cm)', type: 'number', step: '0.1' },
  { key: 'counterMovementJump', label: 'Counter Movement Jump (cm)', type: 'number', step: '0.1' },
  { key: 'depthJump', label: 'Depth Jump (cm)', type: 'number', step: '0.1' },
  { key: 'broadJump', label: 'Broad Jump (cm)', type: 'number', step: '0.1' },
  { key: 'tripleJumpLeft', label: 'Triple Jump Αριστερό (cm)', type: 'number', step: '0.1' },
  { key: 'tripleJumpRight', label: 'Triple Jump Δεξί (cm)', type: 'number', step: '0.1' }
];

export const JumpTests = () => {
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

  const handleSubmit = () => {
    console.log('Jump data:', formData);
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
              value={formData[field.key as keyof typeof formData]}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="rounded-none"
            />
          </CardContent>
        </Card>
      ))}
      
      <Card className="rounded-none">
        <CardContent className="p-4 flex items-center justify-center">
          <Button onClick={handleSubmit} className="rounded-none w-full">
            Αποθήκευση Αλμάτων
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

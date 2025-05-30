
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const anthropometricFields = [
  { key: 'weight', label: 'Βάρος (kg)', type: 'number', step: '0.1' },
  { key: 'bodyFat', label: 'Λίπος %', type: 'number', step: '0.1' },
  { key: 'muscleMass', label: 'Μυϊκή Μάζα %', type: 'number', step: '0.1' },
  { key: 'visceralFat', label: 'Σπλαχνικό Λίπος', type: 'number', step: '0.1' },
  { key: 'chestCircumference', label: 'Περιφέρεια Στήθους (cm)', type: 'number', step: '0.1' },
  { key: 'hipCircumference', label: 'Περιφέρεια Λεκάνης (cm)', type: 'number', step: '0.1' },
  { key: 'gluteCircumference', label: 'Περιφέρεια Γλουτού (cm)', type: 'number', step: '0.1' },
  { key: 'thighCircumference', label: 'Περιφέρεια Μηρού (cm)', type: 'number', step: '0.1' }
];

export const AnthropometricTests = () => {
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    muscleMass: '',
    visceralFat: '',
    chestCircumference: '',
    hipCircumference: '',
    gluteCircumference: '',
    thighCircumference: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Anthropometric data:', formData);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {anthropometricFields.map((field) => (
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
            Αποθήκευση
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

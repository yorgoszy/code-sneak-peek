
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const enduranceFields = [
  { key: 'pushUps', label: 'Push Ups', type: 'number', placeholder: 'αριθμός' },
  { key: 'pullUps', label: 'Pull Ups', type: 'number', placeholder: 'αριθμός' },
  { key: 'crunches', label: 'Crunches', type: 'number', placeholder: 'αριθμός' },
  { key: 'farmer', label: 'Farmer', type: 'text', placeholder: 'π.χ. 60 δευτ. / 100μ' },
  { key: 'sprint', label: 'Sprint', type: 'text', placeholder: 'π.χ. 10.5 δευτ.' },
  { key: 'masTest', label: 'MAS Test', type: 'text', placeholder: 'Αποτελέσματα MAS' }
];

export const EnduranceTests = () => {
  const [formData, setFormData] = useState({
    pushUps: '',
    pullUps: '',
    crunches: '',
    farmer: '',
    sprint: '',
    masTest: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Endurance data:', formData);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {enduranceFields.map((field) => (
        <Card key={field.key} className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{field.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              type={field.type}
              value={formData[field.key as keyof typeof formData]}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="rounded-none"
              placeholder={field.placeholder}
            />
          </CardContent>
        </Card>
      ))}
      
      <Card className="rounded-none">
        <CardContent className="p-4 flex items-center justify-center">
          <Button onClick={handleSubmit} className="rounded-none w-full">
            Αποθήκευση Αντοχής
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

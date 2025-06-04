
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const anthropometricFields = [
  { key: 'height', label: 'Ύψος', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'weight', label: 'Βάρος', type: 'number', step: '0.1', placeholder: 'kg' },
  { key: 'bodyFatPercentage', label: 'Ποσοστό Λίπους', type: 'number', step: '0.1', placeholder: '%' },
  { key: 'muscleMassPercentage', label: 'Ποσοστό Μυϊκής Μάζας', type: 'number', step: '0.1', placeholder: '%' },
  { key: 'waistCircumference', label: 'Περίμετρος Μέσης', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'hipCircumference', label: 'Περίμετρος Γοφών', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'chestCircumference', label: 'Περίμετρος Στήθους', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'armCircumference', label: 'Περίμετρος Βραχίονα', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'thighCircumference', label: 'Περίμετρος Μηρού', type: 'number', step: '0.1', placeholder: 'cm' }
];

interface AnthropometricData {
  height: string;
  weight: string;
  bodyFatPercentage: string;
  muscleMassPercentage: string;
  waistCircumference: string;
  hipCircumference: string;
  chestCircumference: string;
  armCircumference: string;
  thighCircumference: string;
}

interface AnthropometricTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
  formData?: AnthropometricData;
  onDataChange?: (data: AnthropometricData) => void;
}

export const AnthropometricTests = ({ 
  selectedAthleteId, 
  selectedDate, 
  hideSubmitButton = false,
  formData,
  onDataChange
}: AnthropometricTestsProps) => {
  const handleInputChange = (field: string, value: string) => {
    if (onDataChange && formData) {
      onDataChange({ ...formData, [field]: value });
    }
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
              placeholder={field.placeholder}
              value={formData ? formData[field.key as keyof AnthropometricData] : ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="rounded-none"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

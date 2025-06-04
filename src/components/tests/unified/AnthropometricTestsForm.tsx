
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const anthropometricFields = [
  { key: 'height', label: 'Ύψος', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'weight', label: 'Βάρος', type: 'number', step: '0.1', placeholder: 'kg' },
  { key: 'body_fat_percentage', label: 'Ποσοστό Λίπους', type: 'number', step: '0.1', placeholder: '%' },
  { key: 'muscle_mass_percentage', label: 'Ποσοστό Μυϊκής Μάζας', type: 'number', step: '0.1', placeholder: '%' },
  { key: 'waist_circumference', label: 'Περίμετρος Μέσης', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'hip_circumference', label: 'Περίμετρος Γοφών', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'chest_circumference', label: 'Περίμετρος Στήθους', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'arm_circumference', label: 'Περίμετρος Βραχίονα', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'thigh_circumference', label: 'Περίμετρος Μηρού', type: 'number', step: '0.1', placeholder: 'cm' }
];

interface AnthropometricTestsFormProps {
  data: any;
  onChange: (data: any) => void;
}

export const AnthropometricTestsForm = ({ data, onChange }: AnthropometricTestsFormProps) => {
  const handleInputChange = (field: string, value: string) => {
    const numericValue = value ? parseFloat(value) : null;
    onChange({ ...data, [field]: numericValue });
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Σωματομετρικά Τεστ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {anthropometricFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="text-sm font-medium">{field.label}</label>
              <Input
                type={field.type}
                step={field.step}
                placeholder={field.placeholder}
                value={data[field.key] || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="rounded-none"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

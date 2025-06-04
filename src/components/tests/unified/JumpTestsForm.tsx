
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const jumpFields = [
  { key: 'non_counter_movement_jump', label: 'Non-Counter Movement Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'counter_movement_jump', label: 'Counter Movement Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'depth_jump', label: 'Depth Jump', type: 'number', step: '0.1', placeholder: 'cm' },
  { key: 'broad_jump', label: 'Broad Jump', type: 'number', step: '0.01', placeholder: 'm' },
  { key: 'triple_jump_left', label: 'Triple Jump Αριστερό', type: 'number', step: '0.01', placeholder: 'm' },
  { key: 'triple_jump_right', label: 'Triple Jump Δεξί', type: 'number', step: '0.01', placeholder: 'm' }
];

interface JumpTestsFormProps {
  data: any;
  onChange: (data: any) => void;
}

export const JumpTestsForm = ({ data, onChange }: JumpTestsFormProps) => {
  const handleInputChange = (field: string, value: string) => {
    const numericValue = value ? parseFloat(value) : null;
    onChange({ ...data, [field]: numericValue });
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Τεστ Αλμάτων</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {jumpFields.map((field) => (
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

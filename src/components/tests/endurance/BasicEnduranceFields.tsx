
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface BasicEnduranceFieldsProps {
  formData: {
    pushUps: string;
    pullUps: string;
    crunches: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const basicEnduranceFields = [
  { key: 'pushUps', label: 'Push Ups', type: 'number', placeholder: 'επαναλήψεις' },
  { key: 'pullUps', label: 'Pull Ups', type: 'number', placeholder: 'επαναλήψεις' },
  { key: 'crunches', label: 'Crunches', type: 'number', placeholder: 'επαναλήψεις' }
];

export const BasicEnduranceFields = ({ formData, onInputChange }: BasicEnduranceFieldsProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {basicEnduranceFields.map((field) => (
        <Card key={field.key} className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">{field.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.key as keyof typeof formData]}
              onChange={(e) => onInputChange(field.key, e.target.value)}
              className="rounded-none h-8 text-xs"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CardiacDataFieldsProps {
  formData: {
    maxHr: string;
    restingHr1min: string;
    vo2Max: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export const CardiacDataFields = ({ formData, onInputChange }: CardiacDataFieldsProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-center">Max HR</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Input
            type="number"
            placeholder="bpm"
            value={formData.maxHr}
            onChange={(e) => onInputChange('maxHr', e.target.value)}
            className="rounded-none h-8 text-xs"
          />
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-center">1min Rest HR</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Input
            type="number"
            placeholder="bpm"
            value={formData.restingHr1min}
            onChange={(e) => onInputChange('restingHr1min', e.target.value)}
            className="rounded-none h-8 text-xs"
          />
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-center">VO2 Max</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Input
            type="number"
            step="0.1"
            placeholder="ml/kg/min"
            value={formData.vo2Max}
            onChange={(e) => onInputChange('vo2Max', e.target.value)}
            className="rounded-none h-8 text-xs"
          />
        </CardContent>
      </Card>
    </div>
  );
};

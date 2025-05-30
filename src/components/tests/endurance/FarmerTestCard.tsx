
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FarmerTestCardProps {
  formData: {
    farmerKg: string;
    farmerMeters: string;
    farmerSeconds: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export const FarmerTestCard = ({ formData, onInputChange }: FarmerTestCardProps) => {
  return (
    <Card className="rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Farmer</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div>
          <Label className="text-xs">Βάρος</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="kg"
            value={formData.farmerKg}
            onChange={(e) => onInputChange('farmerKg', e.target.value)}
            className="rounded-none h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Μέτρα</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="m"
            value={formData.farmerMeters}
            onChange={(e) => onInputChange('farmerMeters', e.target.value)}
            className="rounded-none h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Χρόνος</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="δευτ."
            value={formData.farmerSeconds}
            onChange={(e) => onInputChange('farmerSeconds', e.target.value)}
            className="rounded-none h-8 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
};

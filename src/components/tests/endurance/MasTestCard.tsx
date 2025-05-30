
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MasTestCardProps {
  formData: {
    masMeters: string;
    masMinutes: string;
    masMs: string;
    masKmh: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export const MasTestCard = ({ formData, onInputChange }: MasTestCardProps) => {
  return (
    <Card className="rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">MAS</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div>
          <Label className="text-xs">Μέτρα</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="m"
            value={formData.masMeters}
            onChange={(e) => onInputChange('masMeters', e.target.value)}
            className="rounded-none h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Λεπτά</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="λεπτά"
            value={formData.masMinutes}
            onChange={(e) => onInputChange('masMinutes', e.target.value)}
            className="rounded-none h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">m/s</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="m/s"
            value={formData.masMs}
            readOnly
            className="rounded-none h-8 text-xs bg-gray-100"
          />
        </div>
        <div>
          <Label className="text-xs">km/h</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="km/h"
            value={formData.masKmh}
            readOnly
            className="rounded-none h-8 text-xs bg-gray-100"
          />
        </div>
      </CardContent>
    </Card>
  );
};


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SprintTestCardProps {
  formData: {
    sprintSeconds: string;
    sprintMeters: string;
    sprintResistance: string;
    sprintWatt: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export const SprintTestCard = ({ formData, onInputChange }: SprintTestCardProps) => {
  return (
    <Card className="rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Sprint</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div>
          <Label className="text-xs">Χρόνος</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="δευτ."
            value={formData.sprintSeconds}
            onChange={(e) => onInputChange('sprintSeconds', e.target.value)}
            className="rounded-none h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Μέτρα</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="m"
            value={formData.sprintMeters}
            onChange={(e) => onInputChange('sprintMeters', e.target.value)}
            className="rounded-none h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Αντίσταση</Label>
          <Select 
            value={formData.sprintResistance} 
            onValueChange={(value) => onInputChange('sprintResistance', value)}
          >
            <SelectTrigger className="rounded-none h-8 text-xs">
              <SelectValue placeholder="Επιλέξτε" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="χαμηλή">Χαμηλή</SelectItem>
              <SelectItem value="μέτρια">Μέτρια</SelectItem>
              <SelectItem value="υψηλή">Υψηλή</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Watt</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="W"
            value={formData.sprintWatt}
            onChange={(e) => onInputChange('sprintWatt', e.target.value)}
            className="rounded-none h-8 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
};

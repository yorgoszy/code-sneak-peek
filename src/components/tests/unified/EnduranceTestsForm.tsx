
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EnduranceTestsFormProps {
  data: any;
  onChange: (data: any) => void;
}

export const EnduranceTestsForm = ({ data, onChange }: EnduranceTestsFormProps) => {
  const handleInputChange = (field: string, value: string) => {
    const numericValue = value ? parseFloat(value) : null;
    onChange({ ...data, [field]: numericValue });
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Τεστ Αντοχής</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Βασικά Τεστ */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Κάμψεις</Label>
            <Input
              type="number"
              placeholder="αριθμός"
              value={data.push_ups || ''}
              onChange={(e) => handleInputChange('push_ups', e.target.value)}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Έλξεις</Label>
            <Input
              type="number"
              placeholder="αριθμός"
              value={data.pull_ups || ''}
              onChange={(e) => handleInputChange('pull_ups', e.target.value)}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Crunches</Label>
            <Input
              type="number"
              placeholder="αριθμός"
              value={data.crunches || ''}
              onChange={(e) => handleInputChange('crunches', e.target.value)}
              className="rounded-none"
            />
          </div>
        </div>

        {/* Καρδιακά Δεδομένα */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Μέγιστος Καρδιακός Ρυθμός</Label>
            <Input
              type="number"
              placeholder="bpm"
              value={data.max_hr || ''}
              onChange={(e) => handleInputChange('max_hr', e.target.value)}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Καρδιακός Ρυθμός Ηρεμίας (1 λεπτό)</Label>
            <Input
              type="number"
              placeholder="bpm"
              value={data.resting_hr_1min || ''}
              onChange={(e) => handleInputChange('resting_hr_1min', e.target.value)}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>VO2 Max</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="ml/kg/min"
              value={data.vo2_max || ''}
              onChange={(e) => handleInputChange('vo2_max', e.target.value)}
              className="rounded-none"
            />
          </div>
        </div>

        {/* Farmer Test */}
        <div className="space-y-2">
          <Label>Farmer Test</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              placeholder="kg"
              value={data.farmer_kg || ''}
              onChange={(e) => handleInputChange('farmer_kg', e.target.value)}
              className="rounded-none"
            />
            <Input
              type="number"
              placeholder="μέτρα"
              value={data.farmer_meters || ''}
              onChange={(e) => handleInputChange('farmer_meters', e.target.value)}
              className="rounded-none"
            />
            <Input
              type="number"
              placeholder="δευτερόλεπτα"
              value={data.farmer_seconds || ''}
              onChange={(e) => handleInputChange('farmer_seconds', e.target.value)}
              className="rounded-none"
            />
          </div>
        </div>

        {/* Sprint Test */}
        <div className="space-y-2">
          <Label>Sprint Test</Label>
          <div className="grid grid-cols-4 gap-2">
            <Input
              type="number"
              placeholder="δευτερόλεπτα"
              value={data.sprint_seconds || ''}
              onChange={(e) => handleInputChange('sprint_seconds', e.target.value)}
              className="rounded-none"
            />
            <Input
              type="number"
              placeholder="μέτρα"
              value={data.sprint_meters || ''}
              onChange={(e) => handleInputChange('sprint_meters', e.target.value)}
              className="rounded-none"
            />
            <Input
              type="text"
              placeholder="αντίσταση"
              value={data.sprint_resistance || ''}
              onChange={(e) => onChange({ ...data, sprint_resistance: e.target.value })}
              className="rounded-none"
            />
            <Input
              type="number"
              placeholder="watt"
              value={data.sprint_watt || ''}
              onChange={(e) => handleInputChange('sprint_watt', e.target.value)}
              className="rounded-none"
            />
          </div>
        </div>

        {/* MAS Test */}
        <div className="space-y-2">
          <Label>MAS Test</Label>
          <div className="grid grid-cols-4 gap-2">
            <Input
              type="number"
              placeholder="μέτρα"
              value={data.mas_meters || ''}
              onChange={(e) => handleInputChange('mas_meters', e.target.value)}
              className="rounded-none"
            />
            <Input
              type="number"
              placeholder="λεπτά"
              value={data.mas_minutes || ''}
              onChange={(e) => handleInputChange('mas_minutes', e.target.value)}
              className="rounded-none"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="m/s"
              value={data.mas_ms || ''}
              onChange={(e) => handleInputChange('mas_ms', e.target.value)}
              className="rounded-none"
            />
            <Input
              type="number"
              step="0.1"
              placeholder="km/h"
              value={data.mas_kmh || ''}
              onChange={(e) => handleInputChange('mas_kmh', e.target.value)}
              className="rounded-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

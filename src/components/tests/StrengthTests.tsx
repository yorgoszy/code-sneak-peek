
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const StrengthTests = () => {
  const [formData, setFormData] = useState({
    velocityCurve: '',
    oneRM: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Strength data:', formData);
    // Εδώ θα προσθέσουμε την αποθήκευση στη βάση δεδομένων
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Τεστ Δύναμης</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="velocityCurve">Καμπύλη Φορτίου Ταχύτητας</Label>
            <Input
              id="velocityCurve"
              value={formData.velocityCurve}
              onChange={(e) => handleInputChange('velocityCurve', e.target.value)}
              className="rounded-none"
              placeholder="Δεδομένα καμπύλης..."
            />
          </div>

          <div>
            <Label htmlFor="oneRM">1RM (kg)</Label>
            <Input
              id="oneRM"
              type="number"
              step="0.5"
              value={formData.oneRM}
              onChange={(e) => handleInputChange('oneRM', e.target.value)}
              className="rounded-none"
              placeholder="Τελευταία προσπάθεια ως 1RM"
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>Η τελευταία προσπάθεια ορίζεται ως 1RM</p>
        </div>

        <Button onClick={handleSubmit} className="rounded-none">
          Αποθήκευση Δύναμης
        </Button>
      </CardContent>
    </Card>
  );
};

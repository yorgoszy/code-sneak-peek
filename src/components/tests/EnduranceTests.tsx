
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const EnduranceTests = () => {
  const [formData, setFormData] = useState({
    pushUps: '',
    pullUps: '',
    crunches: '',
    farmer: '',
    sprint: '',
    masTest: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Endurance data:', formData);
    // Εδώ θα προσθέσουμε την αποθήκευση στη βάση δεδομένων
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Τεστ Αντοχής</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="pushUps">Push Ups (αριθμός)</Label>
            <Input
              id="pushUps"
              type="number"
              value={formData.pushUps}
              onChange={(e) => handleInputChange('pushUps', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="pullUps">Pull Ups (αριθμός)</Label>
            <Input
              id="pullUps"
              type="number"
              value={formData.pullUps}
              onChange={(e) => handleInputChange('pullUps', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="crunches">Crunches (αριθμός)</Label>
            <Input
              id="crunches"
              type="number"
              value={formData.crunches}
              onChange={(e) => handleInputChange('crunches', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="farmer">Farmer (χρόνος/απόσταση)</Label>
            <Input
              id="farmer"
              value={formData.farmer}
              onChange={(e) => handleInputChange('farmer', e.target.value)}
              className="rounded-none"
              placeholder="π.χ. 60 δευτ. / 100μ"
            />
          </div>

          <div>
            <Label htmlFor="sprint">Sprint (χρόνος)</Label>
            <Input
              id="sprint"
              value={formData.sprint}
              onChange={(e) => handleInputChange('sprint', e.target.value)}
              className="rounded-none"
              placeholder="π.χ. 10.5 δευτ."
            />
          </div>

          <div>
            <Label htmlFor="masTest">MAS Test</Label>
            <Input
              id="masTest"
              value={formData.masTest}
              onChange={(e) => handleInputChange('masTest', e.target.value)}
              className="rounded-none"
              placeholder="Αποτελέσματα MAS"
            />
          </div>
        </div>

        <Button onClick={handleSubmit} className="rounded-none">
          Αποθήκευση Αντοχής
        </Button>
      </CardContent>
    </Card>
  );
};

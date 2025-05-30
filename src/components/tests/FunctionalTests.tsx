
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export const FunctionalTests = () => {
  const [formData, setFormData] = useState({
    posture: '',
    squats: '',
    singleLegSquats: '',
    fms: '',
    fcs: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Functional data:', formData);
    // Εδώ θα προσθέσουμε την αποθήκευση στη βάση δεδομένων
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Τεστ Λειτουργικότητας</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="posture">Στάση Σώματος</Label>
            <Textarea
              id="posture"
              value={formData.posture}
              onChange={(e) => handleInputChange('posture', e.target.value)}
              className="rounded-none resize-none"
              rows={3}
              placeholder="Περιγραφή στάσης σώματος..."
            />
          </div>

          <div>
            <Label htmlFor="squats">Καθίσματα (αριθμός)</Label>
            <Input
              id="squats"
              type="number"
              value={formData.squats}
              onChange={(e) => handleInputChange('squats', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="singleLegSquats">Καθίσματα με ένα πόδι (αριθμός)</Label>
            <Input
              id="singleLegSquats"
              type="number"
              value={formData.singleLegSquats}
              onChange={(e) => handleInputChange('singleLegSquats', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="fms">FMS (σκορ)</Label>
            <Input
              id="fms"
              type="number"
              value={formData.fms}
              onChange={(e) => handleInputChange('fms', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="fcs">FCS (σκορ)</Label>
            <Input
              id="fcs"
              type="number"
              value={formData.fcs}
              onChange={(e) => handleInputChange('fcs', e.target.value)}
              className="rounded-none"
            />
          </div>
        </div>

        <Button onClick={handleSubmit} className="rounded-none">
          Αποθήκευση Λειτουργικότητας
        </Button>
      </CardContent>
    </Card>
  );
};

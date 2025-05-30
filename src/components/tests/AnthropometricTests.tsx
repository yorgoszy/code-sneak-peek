
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const AnthropometricTests = () => {
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    muscleMass: '',
    chestCircumference: '',
    hipCircumference: '',
    gluteCircumference: '',
    thighCircumference: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Anthropometric data:', formData);
    // Εδώ θα προσθέσουμε την αποθήκευση στη βάση δεδομένων
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Σωματομετρικά Τεστ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="weight">Βάρος (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="bodyFat">Λίπος %</Label>
            <Input
              id="bodyFat"
              type="number"
              step="0.1"
              value={formData.bodyFat}
              onChange={(e) => handleInputChange('bodyFat', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="muscleMass">Μυϊκή Μάζα %</Label>
            <Input
              id="muscleMass"
              type="number"
              step="0.1"
              value={formData.muscleMass}
              onChange={(e) => handleInputChange('muscleMass', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="chestCircumference">Περιφέρεια Στήθους (cm)</Label>
            <Input
              id="chestCircumference"
              type="number"
              step="0.1"
              value={formData.chestCircumference}
              onChange={(e) => handleInputChange('chestCircumference', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="hipCircumference">Περιφέρεια Λεκάνης (cm)</Label>
            <Input
              id="hipCircumference"
              type="number"
              step="0.1"
              value={formData.hipCircumference}
              onChange={(e) => handleInputChange('hipCircumference', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="gluteCircumference">Περιφέρεια Γλουτού (cm)</Label>
            <Input
              id="gluteCircumference"
              type="number"
              step="0.1"
              value={formData.gluteCircumference}
              onChange={(e) => handleInputChange('gluteCircumference', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="thighCircumference">Περιφέρεια Μηρού (cm)</Label>
            <Input
              id="thighCircumference"
              type="number"
              step="0.1"
              value={formData.thighCircumference}
              onChange={(e) => handleInputChange('thighCircumference', e.target.value)}
              className="rounded-none"
            />
          </div>
        </div>

        <Button onClick={handleSubmit} className="rounded-none">
          Αποθήκευση Σωματομετρικών
        </Button>
      </CardContent>
    </Card>
  );
};


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Label } from "@/components/ui/label";

const basicEnduranceFields = [
  { key: 'pushUps', label: 'Push Ups', type: 'number', placeholder: 'αριθμός' },
  { key: 'pullUps', label: 'Pull Ups', type: 'number', placeholder: 'αριθμός' },
  { key: 'crunches', label: 'Crunches', type: 'number', placeholder: 'αριθμός' }
];

export const EnduranceTests = () => {
  const [formData, setFormData] = useState({
    pushUps: '',
    pullUps: '',
    crunches: '',
    farmer: {
      kg: '',
      meters: '',
      seconds: ''
    },
    sprint: {
      seconds: '',
      meters: '',
      resistance: '',
      watt: ''
    },
    masTest: {
      meters: '',
      minutes: '',
      mas_ms: '',
      mas_kmh: ''
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplexFieldChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev] as any,
        [field]: value
      }
    }));
  };

  const calculateMAS = () => {
    const meters = parseFloat(formData.masTest.meters);
    const minutes = parseFloat(formData.masTest.minutes);
    
    if (meters && minutes) {
      const mas_ms = meters / (minutes * 60);
      const mas_kmh = mas_ms * 3.6;
      
      setFormData(prev => ({
        ...prev,
        masTest: {
          ...prev.masTest,
          mas_ms: mas_ms.toFixed(2),
          mas_kmh: mas_kmh.toFixed(2)
        }
      }));
    }
  };

  const convertToKmh = () => {
    const mas_ms = parseFloat(formData.masTest.mas_ms);
    if (mas_ms) {
      const mas_kmh = mas_ms * 3.6;
      setFormData(prev => ({
        ...prev,
        masTest: {
          ...prev.masTest,
          mas_kmh: mas_kmh.toFixed(2)
        }
      }));
    }
  };

  const handleSubmit = () => {
    console.log('Endurance data:', formData);
  };

  return (
    <div className="space-y-6">
      {/* Βασικά Τεστ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {basicEnduranceFields.map((field) => (
          <Card key={field.key} className="rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{field.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Input
                type={field.type}
                value={formData[field.key as keyof typeof formData] as string}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="rounded-none"
                placeholder={field.placeholder}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Farmer Test */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Farmer Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Κιλά (kg)</Label>
              <Input
                type="number"
                value={formData.farmer.kg}
                onChange={(e) => handleComplexFieldChange('farmer', 'kg', e.target.value)}
                className="rounded-none"
                placeholder="κιλά"
              />
            </div>
            <div>
              <Label className="text-sm">Μέτρα (m)</Label>
              <Input
                type="number"
                value={formData.farmer.meters}
                onChange={(e) => handleComplexFieldChange('farmer', 'meters', e.target.value)}
                className="rounded-none"
                placeholder="μέτρα"
              />
            </div>
            <div>
              <Label className="text-sm">Δευτερόλεπτα (s)</Label>
              <Input
                type="number"
                value={formData.farmer.seconds}
                onChange={(e) => handleComplexFieldChange('farmer', 'seconds', e.target.value)}
                className="rounded-none"
                placeholder="δευτερόλεπτα"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprint Test */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Sprint Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm">Δευτερόλεπτα (s)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.sprint.seconds}
                onChange={(e) => handleComplexFieldChange('sprint', 'seconds', e.target.value)}
                className="rounded-none"
                placeholder="δευτερόλεπτα"
              />
            </div>
            <div>
              <Label className="text-sm">Μέτρα (m)</Label>
              <Input
                type="number"
                value={formData.sprint.meters}
                onChange={(e) => handleComplexFieldChange('sprint', 'meters', e.target.value)}
                className="rounded-none"
                placeholder="μέτρα"
              />
            </div>
            <div>
              <Label className="text-sm">Αντίσταση</Label>
              <Input
                type="text"
                value={formData.sprint.resistance}
                onChange={(e) => handleComplexFieldChange('sprint', 'resistance', e.target.value)}
                className="rounded-none"
                placeholder="αντίσταση"
              />
            </div>
            <div>
              <Label className="text-sm">Watt</Label>
              <Input
                type="number"
                value={formData.sprint.watt}
                onChange={(e) => handleComplexFieldChange('sprint', 'watt', e.target.value)}
                className="rounded-none"
                placeholder="watt"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAS Test */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">MAS Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm">Μέτρα (m)</Label>
              <Input
                type="number"
                value={formData.masTest.meters}
                onChange={(e) => handleComplexFieldChange('masTest', 'meters', e.target.value)}
                className="rounded-none"
                placeholder="μέτρα"
              />
            </div>
            <div>
              <Label className="text-sm">Χρόνος (λεπτά)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.masTest.minutes}
                onChange={(e) => handleComplexFieldChange('masTest', 'minutes', e.target.value)}
                className="rounded-none"
                placeholder="λεπτά"
              />
            </div>
            <div>
              <Label className="text-sm">MAS (m/s)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.masTest.mas_ms}
                  onChange={(e) => handleComplexFieldChange('masTest', 'mas_ms', e.target.value)}
                  className="rounded-none"
                  placeholder="m/s"
                  readOnly
                />
                <Button 
                  onClick={calculateMAS}
                  size="sm"
                  className="rounded-none"
                >
                  Υπολογισμός
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm">MAS (km/h)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.masTest.mas_kmh}
                  onChange={(e) => handleComplexFieldChange('masTest', 'mas_kmh', e.target.value)}
                  className="rounded-none"
                  placeholder="km/h"
                  readOnly
                />
                <Button 
                  onClick={convertToKmh}
                  size="sm"
                  className="rounded-none"
                >
                  Μετατροπή
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Αποθήκευση */}
      <Card className="rounded-none">
        <CardContent className="p-4 flex items-center justify-center">
          <Button onClick={handleSubmit} className="rounded-none w-full max-w-md">
            Αποθήκευση Αντοχής
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

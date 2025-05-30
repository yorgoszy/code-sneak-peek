
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Καμπύλη Φορτίου Ταχύτητας</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Input
            value={formData.velocityCurve}
            onChange={(e) => handleInputChange('velocityCurve', e.target.value)}
            className="rounded-none"
            placeholder="Δεδομένα καμπύλης..."
          />
          <p className="text-xs text-gray-600 mt-2">
            Η τελευταία προσπάθεια ορίζεται ως 1RM
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">1RM (kg)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Input
            type="number"
            step="0.5"
            value={formData.oneRM}
            onChange={(e) => handleInputChange('oneRM', e.target.value)}
            className="rounded-none"
            placeholder="Τελευταία προσπάθεια ως 1RM"
          />
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardContent className="p-4 flex items-center justify-center">
          <Button onClick={handleSubmit} className="rounded-none w-full">
            Αποθήκευση Δύναμης
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

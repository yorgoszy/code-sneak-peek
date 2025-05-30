
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const JumpTests = () => {
  const [formData, setFormData] = useState({
    nonCounterMovementJump: '',
    counterMovementJump: '',
    depthJump: '',
    broadJump: '',
    tripleJumpLeft: '',
    tripleJumpRight: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Jump data:', formData);
    // Εδώ θα προσθέσουμε την αποθήκευση στη βάση δεδομένων
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Τεστ Αλμάτων</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nonCounterMovementJump">Non-Counter Movement Jump (cm)</Label>
            <Input
              id="nonCounterMovementJump"
              type="number"
              step="0.1"
              value={formData.nonCounterMovementJump}
              onChange={(e) => handleInputChange('nonCounterMovementJump', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="counterMovementJump">Counter Movement Jump (cm)</Label>
            <Input
              id="counterMovementJump"
              type="number"
              step="0.1"
              value={formData.counterMovementJump}
              onChange={(e) => handleInputChange('counterMovementJump', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="depthJump">Depth Jump (cm)</Label>
            <Input
              id="depthJump"
              type="number"
              step="0.1"
              value={formData.depthJump}
              onChange={(e) => handleInputChange('depthJump', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="broadJump">Broad Jump (cm)</Label>
            <Input
              id="broadJump"
              type="number"
              step="0.1"
              value={formData.broadJump}
              onChange={(e) => handleInputChange('broadJump', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="tripleJumpLeft">Triple Jump Αριστερό (cm)</Label>
            <Input
              id="tripleJumpLeft"
              type="number"
              step="0.1"
              value={formData.tripleJumpLeft}
              onChange={(e) => handleInputChange('tripleJumpLeft', e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="tripleJumpRight">Triple Jump Δεξί (cm)</Label>
            <Input
              id="tripleJumpRight"
              type="number"
              step="0.1"
              value={formData.tripleJumpRight}
              onChange={(e) => handleInputChange('tripleJumpRight', e.target.value)}
              className="rounded-none"
            />
          </div>
        </div>

        <Button onClick={handleSubmit} className="rounded-none">
          Αποθήκευση Αλμάτων
        </Button>
      </CardContent>
    </Card>
  );
};

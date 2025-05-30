
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

const postureOptions = ['Κύφωση', 'Λόρδωση', 'Πρηνισμός'];

const squatOptions = [
  'Πρηνισμός Πελμάτων Αριστερά',
  'Πρηνισμός Πελμάτων Δεξιά',
  'Έσω Στροφή Γονάτων Αριστερά',
  'Έσω Στροφή Γονάτων Δεξιά',
  'Έξω Στροφή Γονάτων Αριστερά',
  'Έξω Στροφή Γονάτων Δεξιά',
  'Ανύψωση Φτερνών Αριστερά',
  'Ανύψωση Φτερνών Δεξιά',
  'Μεταφορά Βάρους Αριστερά',
  'Μεταφορά Βάρους Δεξιά',
  'Εμπρός Κλίση του Κορμού',
  'Υπερέκταση στην Σ.Σ.',
  'Κυφωτική Θέση στη Σ.Σ.',
  'Πτώση Χεριών'
];

const singleLegSquatOptions = [
  'Ανύψωση Ισχίου Αριστερά',
  'Ανύψωση Ισχίου Δεξιά',
  'Πτώση Ισχίου Αριστερά',
  'Πτώση Ισχίου Δεξιά',
  'Έσω Στροφή Κορμού Αριστερά',
  'Έσω Στροφή Κορμού Δεξιά',
  'Έξω Στροφή Κορμού Αριστερά',
  'Έξω Στροφή Κορμού Δεξιά'
];

const fmsTests = [
  'Shoulder Mobility',
  'Active Straight Leg Raise',
  'Trunk Stability Push-Up',
  'Rotary Stability',
  'Inline Lunge',
  'Hurdle Step',
  'Deep Squat'
];

export const FunctionalTests = () => {
  const [formData, setFormData] = useState({
    posture: [] as string[],
    squats: [] as string[],
    singleLegSquats: [] as string[],
    fms: {} as Record<string, number>,
    fcs: ''
  });

  const handlePostureChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      posture: checked 
        ? [...prev.posture, option]
        : prev.posture.filter(item => item !== option)
    }));
  };

  const handleSquatChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      squats: checked 
        ? [...prev.squats, option]
        : prev.squats.filter(item => item !== option)
    }));
  };

  const handleSingleLegSquatChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      singleLegSquats: checked 
        ? [...prev.singleLegSquats, option]
        : prev.singleLegSquats.filter(item => item !== option)
    }));
  };

  const handleFmsClick = (test: string) => {
    const currentScore = formData.fms[test] || 0;
    const nextScore = currentScore === 3 ? 0 : currentScore + 1;
    
    setFormData(prev => ({
      ...prev,
      fms: {
        ...prev.fms,
        [test]: nextScore
      }
    }));
  };

  const calculateFmsTotal = () => {
    return Object.values(formData.fms).reduce((sum, score) => sum + score, 0);
  };

  const getFmsScoreColor = () => {
    const total = calculateFmsTotal();
    return total >= 14 ? 'text-green-600' : 'text-red-600';
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
        <div className="space-y-6">
          {/* Στάση Σώματος */}
          <div>
            <Label className="text-base font-semibold">Στάση Σώματος</Label>
            <div className="mt-2 space-y-2">
              {postureOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={formData.posture.includes(option)}
                    onCheckedChange={(checked) => handlePostureChange(option, checked as boolean)}
                    className="rounded-none"
                  />
                  <Label htmlFor={option} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Καθίσματα */}
          <div>
            <Label className="text-base font-semibold">Καθίσματα</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {squatOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={formData.squats.includes(option)}
                    onCheckedChange={(checked) => handleSquatChange(option, checked as boolean)}
                    className="rounded-none"
                  />
                  <Label htmlFor={option} className="cursor-pointer text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Καθίσματα με ένα πόδι */}
          <div>
            <Label className="text-base font-semibold">Καθίσματα με ένα πόδι</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {singleLegSquatOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={formData.singleLegSquats.includes(option)}
                    onCheckedChange={(checked) => handleSingleLegSquatChange(option, checked as boolean)}
                    className="rounded-none"
                  />
                  <Label htmlFor={option} className="cursor-pointer text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* FMS */}
          <div>
            <Label className="text-base font-semibold">FMS</Label>
            <div className="mt-2 space-y-2">
              {fmsTests.map((test) => (
                <div 
                  key={test} 
                  className="flex items-center justify-between p-3 border border-gray-200 cursor-pointer hover:bg-gray-50 rounded-none"
                  onClick={() => handleFmsClick(test)}
                >
                  <span>{test}</span>
                  <span className="font-bold text-lg">
                    {formData.fms[test] || 0}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 bg-gray-100 font-bold">
                <span>Συνολικό Σκορ:</span>
                <span className={`text-lg ${getFmsScoreColor()}`}>
                  {calculateFmsTotal()}
                </span>
              </div>
            </div>
          </div>

          {/* FCS */}
          <div>
            <Label htmlFor="fcs">FCS (σκορ)</Label>
            <Input
              id="fcs"
              type="number"
              value={formData.fcs}
              onChange={(e) => setFormData(prev => ({ ...prev, fcs: e.target.value }))}
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

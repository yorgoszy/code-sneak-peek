
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const postureOptions = ['Κύφωση', 'Λόρδωση', 'Πρηνισμός'];

const squatMovements = [
  { name: 'Πρηνισμός Πελμάτων', key: 'pronation' },
  { name: 'Έσω Στροφή Γονάτων', key: 'innerKnee' },
  { name: 'Έξω Στροφή Γονάτων', key: 'outerKnee' },
  { name: 'Ανύψωση Φτερνών', key: 'heelRaise' },
  { name: 'Μεταφορά Βάρους', key: 'weightTransfer' },
  { name: 'Εμπρός Κλίση του Κορμού', key: 'forwardLean', single: true },
  { name: 'Υπερέκταση στην Σ.Σ.', key: 'hyperextension', single: true },
  { name: 'Κυφωτική Θέση στη Σ.Σ.', key: 'kyphotic', single: true },
  { name: 'Πτώση Χεριών', key: 'armDrop', single: true }
];

const singleLegSquatMovements = [
  { name: 'Ανύψωση Ισχίου', key: 'hipRaise' },
  { name: 'Πτώση Ισχίου', key: 'hipDrop' },
  { name: 'Έσω Στροφή Κορμού', key: 'innerTrunk' },
  { name: 'Έξω Στροφή Κορμού', key: 'outerTrunk' }
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
    squats: {} as Record<string, string[]>,
    singleLegSquats: {} as Record<string, string[]>,
    fms: {} as Record<string, number>,
    fcs: ''
  });

  const handlePostureClick = (option: string) => {
    setFormData(prev => ({
      ...prev,
      posture: prev.posture.includes(option)
        ? prev.posture.filter(item => item !== option)
        : [...prev.posture, option]
    }));
  };

  const handleSquatClick = (movementKey: string, side?: string) => {
    setFormData(prev => {
      const currentSelections = prev.squats[movementKey] || [];
      let newSelections;
      
      if (side) {
        newSelections = currentSelections.includes(side)
          ? currentSelections.filter(s => s !== side)
          : [...currentSelections, side];
      } else {
        newSelections = currentSelections.length > 0 ? [] : ['selected'];
      }
      
      return {
        ...prev,
        squats: {
          ...prev.squats,
          [movementKey]: newSelections
        }
      };
    });
  };

  const handleSingleLegSquatClick = (movementKey: string, side: string) => {
    setFormData(prev => {
      const currentSelections = prev.singleLegSquats[movementKey] || [];
      const newSelections = currentSelections.includes(side)
        ? currentSelections.filter(s => s !== side)
        : [...currentSelections, side];
      
      return {
        ...prev,
        singleLegSquats: {
          ...prev.singleLegSquats,
          [movementKey]: newSelections
        }
      };
    });
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
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {/* Στάση Σώματος */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Στάση Σώματος</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {postureOptions.map((option) => (
            <div 
              key={option}
              className={`p-2 border cursor-pointer text-sm rounded-none transition-colors ${
                formData.posture.includes(option) 
                  ? 'bg-blue-100 border-blue-300' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handlePostureClick(option)}
            >
              {option}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Καθίσματα */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Καθίσματα</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {squatMovements.map((movement) => (
            <div key={movement.key} className="border border-gray-200 p-2 rounded-none">
              <div className="text-xs font-medium mb-1">{movement.name}</div>
              {movement.single ? (
                <div 
                  className={`p-1 cursor-pointer text-xs rounded-none transition-colors ${
                    (formData.squats[movement.key] || []).length > 0
                      ? 'bg-blue-100 border-blue-300' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => handleSquatClick(movement.key)}
                >
                  Επιλογή
                </div>
              ) : (
                <div className="flex gap-1">
                  {['Αριστερά', 'Δεξιά'].map((side) => (
                    <div 
                      key={side}
                      className={`flex-1 p-1 cursor-pointer text-xs text-center rounded-none transition-colors ${
                        (formData.squats[movement.key] || []).includes(side)
                          ? 'bg-blue-100 border-blue-300' 
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleSquatClick(movement.key, side)}
                    >
                      {side}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Καθίσματα με ένα πόδι */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Καθίσματα με ένα πόδι</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {singleLegSquatMovements.map((movement) => (
            <div key={movement.key} className="border border-gray-200 p-2 rounded-none">
              <div className="text-xs font-medium mb-1">{movement.name}</div>
              <div className="flex gap-1">
                {['Αριστερά', 'Δεξιά'].map((side) => (
                  <div 
                    key={side}
                    className={`flex-1 p-1 cursor-pointer text-xs text-center rounded-none transition-colors ${
                      (formData.singleLegSquats[movement.key] || []).includes(side)
                        ? 'bg-blue-100 border-blue-300' 
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSingleLegSquatClick(movement.key, side)}
                  >
                    {side}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* FMS */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">FMS</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {fmsTests.map((test) => (
            <div 
              key={test} 
              className="flex items-center justify-between p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 rounded-none text-sm"
              onClick={() => handleFmsClick(test)}
            >
              <span>{test}</span>
              <span className="font-bold text-lg">
                {formData.fms[test] || 0}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center p-2 bg-gray-100 font-bold rounded-none">
            <span className="text-sm">Συνολικό:</span>
            <span className={`text-lg ${getFmsScoreColor()}`}>
              {calculateFmsTotal()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* FCS */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">FCS</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Input
            type="number"
            value={formData.fcs}
            onChange={(e) => setFormData(prev => ({ ...prev, fcs: e.target.value }))}
            className="rounded-none"
            placeholder="FCS σκορ"
          />
        </CardContent>
      </Card>

      {/* Κουμπί Αποθήκευσης */}
      <Card className="rounded-none">
        <CardContent className="p-4 flex items-center justify-center">
          <Button onClick={handleSubmit} className="rounded-none w-full">
            Αποθήκευση Λειτουργικότητας
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};


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

  const getFmsScoreColor = (score: number) => {
    switch(score) {
      case 0: return 'text-red-600';
      case 1: return 'text-yellow-600';
      case 2: return 'text-blue-600';
      case 3: return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getFmsTotalColor = () => {
    const total = calculateFmsTotal();
    return total >= 14 ? 'text-green-600' : 'text-red-600';
  };

  const handleSubmit = () => {
    console.log('Functional data:', formData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-2">
      {/* Στάση Σώματος */}
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Στάση Σώματος</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {postureOptions.map((option) => (
            <div 
              key={option}
              className={`p-1 border cursor-pointer text-xs transition-colors ${
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Καθίσματα</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {squatMovements.map((movement) => (
            <div key={movement.key} className="border border-gray-200 p-1">
              {movement.single ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs flex-1">{movement.name}</span>
                  <div 
                    className={`px-2 py-1 cursor-pointer text-xs transition-colors ${
                      (formData.squats[movement.key] || []).length > 0
                        ? 'bg-blue-100 border-blue-300' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleSquatClick(movement.key)}
                  >
                    ✓
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs flex-1">{movement.name}</span>
                  <div 
                    className={`px-1 py-1 cursor-pointer text-xs transition-colors ${
                      (formData.squats[movement.key] || []).includes('Αριστερά')
                        ? 'bg-blue-100 border-blue-300' 
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSquatClick(movement.key, 'Αριστερά')}
                  >
                    Α
                  </div>
                  <div 
                    className={`px-1 py-1 cursor-pointer text-xs transition-colors ${
                      (formData.squats[movement.key] || []).includes('Δεξιά')
                        ? 'bg-blue-100 border-blue-300' 
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSquatClick(movement.key, 'Δεξιά')}
                  >
                    Δ
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Καθίσματα με ένα πόδι */}
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Καθίσματα με ένα πόδι</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {singleLegSquatMovements.map((movement) => (
            <div key={movement.key} className="border border-gray-200 p-1">
              <div className="flex items-center gap-1">
                <span className="text-xs flex-1">{movement.name}</span>
                <div 
                  className={`px-1 py-1 cursor-pointer text-xs transition-colors ${
                    (formData.singleLegSquats[movement.key] || []).includes('Αριστερά')
                      ? 'bg-blue-100 border-blue-300' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSingleLegSquatClick(movement.key, 'Αριστερά')}
                >
                  Α
                </div>
                <div 
                  className={`px-1 py-1 cursor-pointer text-xs transition-colors ${
                    (formData.singleLegSquats[movement.key] || []).includes('Δεξιά')
                      ? 'bg-blue-100 border-blue-300' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSingleLegSquatClick(movement.key, 'Δεξιά')}
                >
                  Δ
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* FMS */}
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">FMS</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {fmsTests.map((test) => (
            <div 
              key={test} 
              className="flex items-center justify-between p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 text-xs"
              onClick={() => handleFmsClick(test)}
            >
              <span className="flex-1">{test}</span>
              <span className={`font-bold text-sm ${getFmsScoreColor(formData.fms[test] || 0)}`}>
                {formData.fms[test] || 0}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center p-1 bg-gray-100 font-bold">
            <span className="text-xs">Συνολικό:</span>
            <span className={`text-sm ${getFmsTotalColor()}`}>
              {calculateFmsTotal()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* FCS */}
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">FCS</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Input
            type="number"
            value={formData.fcs}
            onChange={(e) => setFormData(prev => ({ ...prev, fcs: e.target.value }))}
            className="rounded-none text-sm h-8"
            placeholder="FCS σκορ"
          />
        </CardContent>
      </Card>

      {/* Κουμπί Αποθήκευσης */}
      <Card className="rounded-none">
        <CardContent className="p-2 flex items-center justify-center">
          <Button onClick={handleSubmit} className="rounded-none w-full text-sm h-8">
            Αποθήκευση
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

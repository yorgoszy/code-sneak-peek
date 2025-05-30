
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

  const handlePostureClick = (option: string) => {
    setFormData(prev => ({
      ...prev,
      posture: prev.posture.includes(option)
        ? prev.posture.filter(item => item !== option)
        : [...prev.posture, option]
    }));
  };

  const handleSquatClick = (option: string) => {
    setFormData(prev => ({
      ...prev,
      squats: prev.squats.includes(option)
        ? prev.squats.filter(item => item !== option)
        : [...prev.squats, option]
    }));
  };

  const handleSingleLegSquatClick = (option: string) => {
    setFormData(prev => ({
      ...prev,
      singleLegSquats: prev.singleLegSquats.includes(option)
        ? prev.singleLegSquats.filter(item => item !== option)
        : [...prev.singleLegSquats, option]
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
          {squatOptions.map((option) => (
            <div 
              key={option}
              className={`p-2 border cursor-pointer text-xs rounded-none transition-colors ${
                formData.squats.includes(option) 
                  ? 'bg-blue-100 border-blue-300' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleSquatClick(option)}
            >
              {option}
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
          {singleLegSquatOptions.map((option) => (
            <div 
              key={option}
              className={`p-2 border cursor-pointer text-sm rounded-none transition-colors ${
                formData.singleLegSquats.includes(option) 
                  ? 'bg-blue-100 border-blue-300' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleSingleLegSquatClick(option)}
            >
              {option}
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

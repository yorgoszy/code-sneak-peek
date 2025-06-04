
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface FunctionalTestsFormProps {
  data: any;
  onChange: (data: any) => void;
}

export const FunctionalTestsForm = ({ data, onChange }: FunctionalTestsFormProps) => {
  const [fmsScores, setFmsScores] = useState<Record<string, number>>(data.fms_detailed_scores || {});
  const [selectedPosture, setSelectedPosture] = useState<string[]>(data.posture_issues || []);
  const [selectedSquatIssues, setSelectedSquatIssues] = useState<string[]>(data.squat_issues || []);
  const [selectedSingleLegIssues, setSelectedSingleLegIssues] = useState<string[]>(data.single_leg_squat_issues || []);

  const updateData = (updates: any) => {
    const newData = { ...data, ...updates };
    onChange(newData);
  };

  const getFmsTotal = () => {
    const fmsExercises = [
      'Shoulder Mobility', 'Active Straight Leg Raise',
      'Trunk Stability Push-Up', 'Rotary Stability',
      'Inline Lunge', 'Hurdle Step', 'Deep Squat'
    ];
    return fmsExercises.reduce((total, exercise) => total + (fmsScores[exercise] || 0), 0);
  };

  const handleFmsScoreChange = (exercise: string, score: number) => {
    const newScores = { ...fmsScores, [exercise]: score };
    setFmsScores(newScores);
    updateData({
      fms_detailed_scores: newScores,
      fms_score: Object.values(newScores).reduce((sum, val) => sum + (val || 0), 0)
    });
  };

  const postureOptions = [
    'Κεφάλι μπροστά',
    'Στρογγυλοί ώμοι',
    'Λόρδωση',
    'Κύφωση',
    'Πλαγίασμα λεκάνης',
    'Γόνατα προς τα μέσα',
    'Πλατυποδία'
  ];

  const squatIssues = [
    'Γόνατα προς τα μέσα',
    'Φτέρνες σηκώνονται',
    'Τορσό μπροστά',
    'Ανισορροπία',
    'Περιορισμένη κινητικότητα αστραγάλου'
  ];

  const singleLegIssues = [
    'Αστάθεια',
    'Γόνατο προς τα μέσα',
    'Πλάγια κλίση λεκάνης',
    'Αντισταθμιστικές κινήσεις χεριών',
    'Αδυναμία διατήρησης ισορροπίας'
  ];

  const handlePostureChange = (option: string) => {
    const newSelection = selectedPosture.includes(option)
      ? selectedPosture.filter(item => item !== option)
      : [...selectedPosture, option];
    setSelectedPosture(newSelection);
    updateData({ posture_issues: newSelection });
  };

  const handleSquatChange = (option: string) => {
    const newSelection = selectedSquatIssues.includes(option)
      ? selectedSquatIssues.filter(item => item !== option)
      : [...selectedSquatIssues, option];
    setSelectedSquatIssues(newSelection);
    updateData({ squat_issues: newSelection });
  };

  const handleSingleLegChange = (option: string) => {
    const newSelection = selectedSingleLegIssues.includes(option)
      ? selectedSingleLegIssues.filter(item => item !== option)
      : [...selectedSingleLegIssues, option];
    setSelectedSingleLegIssues(newSelection);
    updateData({ single_leg_squat_issues: newSelection });
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Λειτουργικά Τεστ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* FMS Scores */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">FMS Βαθμολογία (Σύνολο: {getFmsTotal()})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'Deep Squat', 'Hurdle Step', 'Inline Lunge',
              'Shoulder Mobility', 'Active Straight Leg Raise',
              'Trunk Stability Push-Up', 'Rotary Stability'
            ].map((exercise) => (
              <div key={exercise} className="space-y-2">
                <Label className="text-sm">{exercise}</Label>
                <Input
                  type="number"
                  min="0"
                  max="3"
                  value={fmsScores[exercise] || ''}
                  onChange={(e) => handleFmsScoreChange(exercise, parseInt(e.target.value) || 0)}
                  className="rounded-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Posture Assessment */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Αξιολόγηση Στάσης</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {postureOptions.map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPosture.includes(option)}
                  onChange={() => handlePostureChange(option)}
                  className="rounded"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Squat Issues */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Προβλήματα Καθήματος</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {squatIssues.map((issue) => (
              <label key={issue} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSquatIssues.includes(issue)}
                  onChange={() => handleSquatChange(issue)}
                  className="rounded"
                />
                <span className="text-sm">{issue}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Single Leg Squat Issues */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Προβλήματα Μονοποδικού Καθήματος</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {singleLegIssues.map((issue) => (
              <label key={issue} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSingleLegIssues.includes(issue)}
                  onChange={() => handleSingleLegChange(issue)}
                  className="rounded"
                />
                <span className="text-sm">{issue}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

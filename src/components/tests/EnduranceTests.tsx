
import { BasicEnduranceFields } from "./endurance/BasicEnduranceFields";
import { CardiacDataFields } from "./endurance/CardiacDataFields";
import { FarmerTestCard } from "./endurance/FarmerTestCard";
import { SprintTestCard } from "./endurance/SprintTestCard";
import { MasTestCard } from "./endurance/MasTestCard";

interface EnduranceData {
  pushUps: string;
  pullUps: string;
  crunches: string;
  maxHr: string;
  restingHr1min: string;
  vo2Max: string;
  farmerKg: string;
  farmerMeters: string;
  farmerSeconds: string;
  sprintSeconds: string;
  sprintMeters: string;
  sprintResistance: string;
  sprintWatt: string;
  sprintKmh: string;
  sprintExercise: string;
  masMeters: string;
  masMinutes: string;
  masMs: string;
  masKmh: string;
  masExerciseId: string;
}

interface EnduranceTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
  formData?: EnduranceData;
  onDataChange?: (data: EnduranceData) => void;
}

export const EnduranceTests = ({ 
  selectedAthleteId, 
  selectedDate, 
  hideSubmitButton = false,
  formData,
  onDataChange
}: EnduranceTestsProps) => {
  const handleInputChange = (field: string, value: string) => {
    if (onDataChange && formData) {
      onDataChange({ ...formData, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Πρώτη σειρά - Βασικά Τεστ Αντοχής */}
      <BasicEnduranceFields 
        formData={{
          pushUps: formData?.pushUps || '',
          pullUps: formData?.pullUps || '',
          crunches: formData?.crunches || ''
        }}
        onInputChange={handleInputChange}
      />

      {/* Δεύτερη σειρά - Καρδιακά Δεδομένα */}
      <CardiacDataFields
        formData={{
          maxHr: formData?.maxHr || '',
          restingHr1min: formData?.restingHr1min || '',
          vo2Max: formData?.vo2Max || ''
        }}
        onInputChange={handleInputChange}
      />

      {/* Τρίτη σειρά - Προχωρημένα Τεστ */}
      <div className="grid grid-cols-3 gap-3">
        <FarmerTestCard
          formData={{
            farmerKg: formData?.farmerKg || '',
            farmerMeters: formData?.farmerMeters || '',
            farmerSeconds: formData?.farmerSeconds || ''
          }}
          onInputChange={handleInputChange}
        />

        <SprintTestCard
          formData={{
            sprintSeconds: formData?.sprintSeconds || '',
            sprintMeters: formData?.sprintMeters || '',
            sprintResistance: formData?.sprintResistance || '',
            sprintWatt: formData?.sprintWatt || '',
            sprintKmh: formData?.sprintKmh || '',
            sprintExercise: formData?.sprintExercise || 'track'
          }}
          onInputChange={handleInputChange}
        />

        <MasTestCard
          formData={{
            masMeters: formData?.masMeters || '',
            masMinutes: formData?.masMinutes || '',
            masMs: formData?.masMs || '',
            masKmh: formData?.masKmh || '',
            masExerciseId: formData?.masExerciseId || ''
          }}
          onInputChange={handleInputChange}
        />
      </div>
    </div>
  );
};


import { BasicEnduranceFields } from "./endurance/BasicEnduranceFields";
import { CardiacDataFields } from "./endurance/CardiacDataFields";
import { FarmerTestCard } from "./endurance/FarmerTestCard";
import { SprintTestCard } from "./endurance/SprintTestCard";
import { MasTestCard } from "./endurance/MasTestCard";
import { useEnduranceTestLogic } from "./endurance/useEnduranceTestLogic";

interface EnduranceTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
}

export const EnduranceTests = ({ selectedAthleteId, selectedDate, hideSubmitButton = false }: EnduranceTestsProps) => {
  const { formData, handleInputChange } = useEnduranceTestLogic();

  return (
    <div className="space-y-6">
      {/* Πρώτη σειρά - Βασικά Τεστ Αντοχής */}
      <BasicEnduranceFields 
        formData={{
          pushUps: formData.pushUps,
          pullUps: formData.pullUps,
          crunches: formData.crunches
        }}
        onInputChange={handleInputChange}
      />

      {/* Δεύτερη σειρά - Καρδιακά Δεδομένα */}
      <CardiacDataFields
        formData={{
          maxHr: formData.maxHr,
          restingHr1min: formData.restingHr1min,
          vo2Max: formData.vo2Max
        }}
        onInputChange={handleInputChange}
      />

      {/* Τρίτη σειρά - Προχωρημένα Τεστ */}
      <div className="grid grid-cols-3 gap-3">
        <FarmerTestCard
          formData={{
            farmerKg: formData.farmerKg,
            farmerMeters: formData.farmerMeters,
            farmerSeconds: formData.farmerSeconds
          }}
          onInputChange={handleInputChange}
        />

        <SprintTestCard
          formData={{
            sprintSeconds: formData.sprintSeconds,
            sprintMeters: formData.sprintMeters,
            sprintResistance: formData.sprintResistance,
            sprintWatt: formData.sprintWatt
          }}
          onInputChange={handleInputChange}
        />

        <MasTestCard
          formData={{
            masMeters: formData.masMeters,
            masMinutes: formData.masMinutes,
            masMs: formData.masMs,
            masKmh: formData.masKmh
          }}
          onInputChange={handleInputChange}
        />
      </div>
    </div>
  );
};

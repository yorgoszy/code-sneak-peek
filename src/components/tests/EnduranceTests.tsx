
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BasicEnduranceFields } from "./endurance/BasicEnduranceFields";
import { CardiacDataFields } from "./endurance/CardiacDataFields";
import { FarmerTestCard } from "./endurance/FarmerTestCard";
import { SprintTestCard } from "./endurance/SprintTestCard";
import { MasTestCard } from "./endurance/MasTestCard";
import { useEnduranceTestLogic } from "./endurance/useEnduranceTestLogic";

interface EnduranceTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const EnduranceTests = ({ selectedAthleteId, selectedDate }: EnduranceTestsProps) => {
  const { formData, handleInputChange, handleSubmit } = useEnduranceTestLogic();

  const onSubmit = () => {
    handleSubmit(selectedAthleteId, selectedDate);
  };

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
      
      <Card className="rounded-none">
        <CardContent className="p-4 flex items-center justify-center">
          <Button onClick={onSubmit} className="rounded-none w-full max-w-md">
            Αποθήκευση Τεστ Αντοχής
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

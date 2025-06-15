
import { StrengthTestSession } from "./StrengthTestSession";

interface StrengthTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
  // callback για reset (θα το χρειαστούμε για reset μετά την αποθήκευση από έξω)
  onReset?: () => void;
}

export const StrengthTests = ({
  selectedAthleteId,
  selectedDate,
  hideSubmitButton = false,
  onReset
}: StrengthTestsProps) => {
  // Δεν υπάρχει πλέον handleRecord / κουμπί αποθήκευσης!
  return (
    <div className="space-y-4">
      <StrengthTestSession
        selectedAthleteId={selectedAthleteId}
        selectedDate={selectedDate}
        onReset={onReset}
      />
    </div>
  );
};

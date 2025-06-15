
import { StrengthTestSession } from "./StrengthTestSession";

interface StrengthTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
  // Instead of onReset, use registerReset for lifting the resetForm function
  registerReset?: (reset: () => void) => void;
}

export const StrengthTests = ({
  selectedAthleteId,
  selectedDate,
  hideSubmitButton = false,
  registerReset
}: StrengthTestsProps) => {
  // There is no save button in this component!
  return (
    <div className="space-y-4">
      <StrengthTestSession
        selectedAthleteId={selectedAthleteId}
        selectedDate={selectedDate}
        registerReset={registerReset}
      />
    </div>
  );
};

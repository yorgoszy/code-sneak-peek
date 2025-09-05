
import { StrengthTestSession } from "./StrengthTestSession";

interface StrengthTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const StrengthTests = ({
  selectedAthleteId,
  selectedDate
}: StrengthTestsProps) => {
  return (
    <div className="space-y-4">
      <StrengthTestSession
        selectedAthleteId={selectedAthleteId}
        selectedDate={selectedDate}
      />
    </div>
  );
};

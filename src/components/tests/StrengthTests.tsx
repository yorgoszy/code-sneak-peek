
import { StrengthTestSession } from "./StrengthTestSession";

interface StrengthTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const StrengthTests = ({ selectedAthleteId, selectedDate }: StrengthTestsProps) => {
  return <StrengthTestSession selectedAthleteId={selectedAthleteId} selectedDate={selectedDate} />;
};

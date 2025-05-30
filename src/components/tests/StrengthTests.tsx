
import { StrengthTestSession } from "./StrengthTestSession";

interface StrengthTestsProps {
  selectedAthleteId: string;
}

export const StrengthTests = ({ selectedAthleteId }: StrengthTestsProps) => {
  return <StrengthTestSession selectedAthleteId={selectedAthleteId} />;
};


import { useEffect } from "react";
import { StrengthTestSession } from "./StrengthTestSession";

interface StrengthTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
  registerReset?: (reset: () => void) => void;
  strengthSessionRef?: React.MutableRefObject<any>;
}

export const StrengthTests = ({
  selectedAthleteId,
  selectedDate,
  hideSubmitButton = false,
  registerReset,
  strengthSessionRef
}: StrengthTestsProps) => {
  return (
    <div className="space-y-4">
      <StrengthTestSession
        selectedAthleteId={selectedAthleteId}
        selectedDate={selectedDate}
        registerReset={registerReset}
        strengthSessionRef={strengthSessionRef}
      />
    </div>
  );
};

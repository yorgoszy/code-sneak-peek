
import { PostureTest } from "./functional/PostureTest";
import { SquatTest } from "./functional/SquatTest";
import { SingleLegSquatTest } from "./functional/SingleLegSquatTest";
import { FMSTest } from "./functional/FMSTest";

interface FunctionalData {
  fmsScores: Record<string, number>;
  selectedPosture: string[];
  selectedSquatIssues: string[];
  selectedSingleLegIssues: string[];
}

interface FunctionalTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
  formData?: FunctionalData;
  onDataChange?: (data: FunctionalData) => void;
}

export const FunctionalTests = ({ 
  selectedAthleteId, 
  selectedDate, 
  hideSubmitButton = false,
  formData,
  onDataChange
}: FunctionalTestsProps) => {
  const handleFmsScoreChange = (scores: Record<string, number>) => {
    if (onDataChange && formData) {
      onDataChange({ ...formData, fmsScores: scores });
    }
  };

  const handlePostureChange = (posture: string[]) => {
    if (onDataChange && formData) {
      onDataChange({ ...formData, selectedPosture: posture });
    }
  };

  const handleSquatChange = (issues: string[]) => {
    if (onDataChange && formData) {
      onDataChange({ ...formData, selectedSquatIssues: issues });
    }
  };

  const handleSingleLegChange = (issues: string[]) => {
    if (onDataChange && formData) {
      onDataChange({ ...formData, selectedSingleLegIssues: issues });
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-1.5">
        <PostureTest 
          selectedPosture={formData?.selectedPosture || []}
          onPostureChange={handlePostureChange}
        />
        <SquatTest 
          selectedSquatIssues={formData?.selectedSquatIssues || []}
          onSquatChange={handleSquatChange}
        />
        <SingleLegSquatTest 
          selectedSingleLegIssues={formData?.selectedSingleLegIssues || []}
          onSingleLegChange={handleSingleLegChange}
        />
      </div>
      <FMSTest 
        fmsScores={formData?.fmsScores || {}}
        onFmsScoreChange={handleFmsScoreChange}
      />
    </div>
  );
};

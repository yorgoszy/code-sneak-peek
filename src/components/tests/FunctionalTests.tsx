
import { useState } from "react";
import { PostureTest } from "./functional/PostureTest";
import { SquatTest } from "./functional/SquatTest";
import { SingleLegSquatTest } from "./functional/SingleLegSquatTest";
import { FMSTest } from "./functional/FMSTest";

interface FunctionalTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
}

export const FunctionalTests = ({ selectedAthleteId, selectedDate, hideSubmitButton = false }: FunctionalTestsProps) => {
  const [fmsScores, setFmsScores] = useState<Record<string, number>>({});
  const [selectedPosture, setSelectedPosture] = useState<string[]>([]);
  const [selectedSquatIssues, setSelectedSquatIssues] = useState<string[]>([]);
  const [selectedSingleLegIssues, setSelectedSingleLegIssues] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      {/* Πρώτη γραμμή: Στάση Σώματος, Καθήματα, Μονοποδικά Καθήματα */}
      <div className="grid grid-cols-3 gap-4">
        <PostureTest 
          selectedPosture={selectedPosture}
          onPostureChange={setSelectedPosture}
        />
        <SquatTest 
          selectedSquatIssues={selectedSquatIssues}
          onSquatChange={setSelectedSquatIssues}
        />
        <SingleLegSquatTest 
          selectedSingleLegIssues={selectedSingleLegIssues}
          onSingleLegChange={setSelectedSingleLegIssues}
        />
      </div>

      {/* FMS */}
      <FMSTest 
        fmsScores={fmsScores}
        onFmsScoreChange={setFmsScores}
      />
    </div>
  );
};

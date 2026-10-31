import { FunctionalHistoryTab } from "@/components/progress/FunctionalHistoryTab";

interface FunctionalHistoryProps {
  userId: string;
  useCoachTables?: boolean;
  coachId?: string;
}

export const FunctionalHistory: React.FC<FunctionalHistoryProps> = ({ userId, useCoachTables = false, coachId }) => {
  return <FunctionalHistoryTab key={`${userId}:${useCoachTables}:${coachId || ''}`} selectedUserId={userId} readOnly={true} useCoachTables={useCoachTables} coachId={coachId} />;
};

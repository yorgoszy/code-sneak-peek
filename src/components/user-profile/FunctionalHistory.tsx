import { FunctionalHistoryTab } from "@/components/progress/FunctionalHistoryTab";

interface FunctionalHistoryProps {
  userId: string;
  useCoachTables?: boolean;
}

export const FunctionalHistory: React.FC<FunctionalHistoryProps> = ({ userId, useCoachTables = false }) => {
  return <FunctionalHistoryTab selectedUserId={userId} readOnly={true} useCoachTables={useCoachTables} />;
};

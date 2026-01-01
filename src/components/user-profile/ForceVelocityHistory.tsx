import { HistoryTab } from "@/components/progress/HistoryTab";

interface ForceVelocityHistoryProps {
  userId: string;
  useCoachTables?: boolean;
}

export const ForceVelocityHistory: React.FC<ForceVelocityHistoryProps> = ({ userId, useCoachTables = false }) => {
  return <HistoryTab selectedUserId={userId} readOnly={true} useCoachTables={useCoachTables} />;
};

import { JumpHistoryTab } from "@/components/progress/JumpHistoryTab";

interface JumpHistoryProps {
  userId: string;
  useCoachTables?: boolean;
}

export const JumpHistory: React.FC<JumpHistoryProps> = ({ userId, useCoachTables = false }) => {
  return <JumpHistoryTab selectedUserId={userId} readOnly={true} useCoachTables={useCoachTables} />;
};

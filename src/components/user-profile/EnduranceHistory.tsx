import { EnduranceHistoryTab } from "@/components/progress/EnduranceHistoryTab";

interface EnduranceHistoryProps {
  userId: string;
  useCoachTables?: boolean;
}

export const EnduranceHistory: React.FC<EnduranceHistoryProps> = ({ userId, useCoachTables = false }) => {
  return <EnduranceHistoryTab selectedUserId={userId} readOnly={true} useCoachTables={useCoachTables} />;
};

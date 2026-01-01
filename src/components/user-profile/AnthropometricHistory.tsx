import { AnthropometricHistoryTab } from "@/components/progress/AnthropometricHistoryTab";

interface AnthropometricHistoryProps {
  userId: string;
  useCoachTables?: boolean;
}

export const AnthropometricHistory: React.FC<AnthropometricHistoryProps> = ({ userId, useCoachTables = false }) => {
  return <AnthropometricHistoryTab selectedUserId={userId} readOnly={true} useCoachTables={useCoachTables} />;
};

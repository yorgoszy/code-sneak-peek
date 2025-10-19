import { AnthropometricHistoryTab } from "@/components/progress/AnthropometricHistoryTab";

interface AnthropometricHistoryProps {
  userId: string;
}

export const AnthropometricHistory: React.FC<AnthropometricHistoryProps> = ({ userId }) => {
  return <AnthropometricHistoryTab selectedUserId={userId} readOnly={true} />;
};

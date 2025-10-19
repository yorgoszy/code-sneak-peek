import { HistoryTab } from "@/components/progress/HistoryTab";

interface ForceVelocityHistoryProps {
  userId: string;
}

export const ForceVelocityHistory: React.FC<ForceVelocityHistoryProps> = ({ userId }) => {
  return <HistoryTab selectedUserId={userId} />;
};

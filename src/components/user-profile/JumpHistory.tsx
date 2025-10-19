import { JumpHistoryTab } from "@/components/progress/JumpHistoryTab";

interface JumpHistoryProps {
  userId: string;
}

export const JumpHistory: React.FC<JumpHistoryProps> = ({ userId }) => {
  return <JumpHistoryTab selectedUserId={userId} />;
};

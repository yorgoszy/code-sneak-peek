import { FunctionalHistoryTab } from "@/components/progress/FunctionalHistoryTab";

interface FunctionalHistoryProps {
  userId: string;
}

export const FunctionalHistory: React.FC<FunctionalHistoryProps> = ({ userId }) => {
  return <FunctionalHistoryTab selectedUserId={userId} readOnly={true} />;
};

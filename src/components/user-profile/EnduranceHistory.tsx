import { EnduranceHistoryTab } from "@/components/progress/EnduranceHistoryTab";

interface EnduranceHistoryProps {
  userId: string;
}

export const EnduranceHistory: React.FC<EnduranceHistoryProps> = ({ userId }) => {
  return <EnduranceHistoryTab selectedUserId={userId} readOnly={true} />;
};

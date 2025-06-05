
import { UserProfileOverview } from "./UserProfileOverview";
import { UserProfileProgramCards } from "./UserProfileProgramCards";
import { UserProfileDailyProgram } from "./UserProfileDailyProgram";
import { UserProfileTests } from "./UserProfileTests";
import { UserProfilePayments } from "./UserProfilePayments";

interface UserProfileContentProps {
  activeTab: string;
  userProfile: any;
  stats: any;
  programs: any[];
  tests: any[];
  payments: any[];
}

export const UserProfileContent = ({
  activeTab,
  userProfile,
  stats,
  programs,
  tests,
  payments
}: UserProfileContentProps) => {
  
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <UserProfileOverview 
            userProfile={userProfile} 
            stats={stats}
            programs={programs}
            tests={tests}
            payments={payments}
          />
        );
      case "programs":
        return <UserProfileProgramCards userProfile={userProfile} />;
      case "calendar":
        return <UserProfileDailyProgram userProfile={userProfile} />;
      case "tests":
        return <UserProfileTests tests={tests} />;
      case "payments":
        return <UserProfilePayments payments={payments} />;
      default:
        return (
          <UserProfileOverview 
            userProfile={userProfile} 
            stats={stats}
            programs={programs}
            tests={tests}
            payments={payments}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
};

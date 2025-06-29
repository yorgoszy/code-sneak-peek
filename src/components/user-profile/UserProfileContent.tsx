
import React, { useState } from "react";
import { UserProfileHeader } from "./UserProfileHeader";
import { UserProfileStats } from "./UserProfileStats";
import { UserProfileDailyProgram } from "./UserProfileDailyProgram";
import { UserProfileCalendar } from "./UserProfileCalendar";
import { UserProfileProgramCards } from "./UserProfileProgramCards";
import { UserProfileTests } from "./UserProfileTests";
import { UserProfilePayments } from "./UserProfilePayments";
import { TrainingAnalytics } from "./TrainingAnalytics";
import { EnhancedAIChatDialog } from "@/components/ai-chat/EnhancedAIChatDialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

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
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Επισκόπηση Προφίλ</h2>
              <Button
                onClick={() => setIsAIChatOpen(true)}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                RID AI Προπονητής
              </Button>
            </div>
            <UserProfileHeader user={userProfile} />
            <UserProfileStats user={userProfile} stats={stats} />
            <TrainingAnalytics userId={userProfile.id} />
          </div>
        );
      case "programs":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Προγράμματα</h2>
              <Button
                onClick={() => setIsAIChatOpen(true)}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                RID AI Προπονητής
              </Button>
            </div>
            <UserProfileProgramCards userProfile={userProfile} />
          </div>
        );
      case "calendar":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Ημερολόγιο</h2>
              <Button
                onClick={() => setIsAIChatOpen(true)}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                RID AI Προπονητής
              </Button>
            </div>
            <UserProfileCalendar user={userProfile} />
          </div>
        );
      case "tests":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Τεστ & Αξιολογήσεις</h2>
              <Button
                onClick={() => setIsAIChatOpen(true)}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                RID AI Προπονητής
              </Button>
            </div>
            <UserProfileTests tests={tests} />
          </div>
        );
      case "payments":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Πληρωμές & Συνδρομές</h2>
              <Button
                onClick={() => setIsAIChatOpen(true)}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                RID AI Προπονητής
              </Button>
            </div>
            <UserProfilePayments payments={payments} />
          </div>
        );
      default:
        return <div>Άγνωστη καρτέλα</div>;
    }
  };

  return (
    <>
      {renderContent()}
      
      <EnhancedAIChatDialog
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        athleteId={userProfile?.id}
        athleteName={userProfile?.name}
        athletePhotoUrl={userProfile?.photo_url}
      />
    </>
  );
};

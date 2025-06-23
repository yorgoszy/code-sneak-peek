
import React, { useState } from "react";
import { UserProfileHeader } from "./UserProfileHeader";
import { UserProfileStats } from "./UserProfileStats";
import { DailyProgram } from "./daily-program/DailyProgram";
import { UserTests } from "./tests/UserTests";
import { UserPayments } from "./payments/UserPayments";
import { SmartAIChatDialog } from "@/components/ai-chat/SmartAIChatDialog";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

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
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Προπονητής
              </Button>
            </div>
            <UserProfileHeader user={userProfile} />
            <UserProfileStats stats={stats} />
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
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Προπονητής
              </Button>
            </div>
            <DailyProgram userProfile={userProfile} programs={programs} />
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
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Προπονητής
              </Button>
            </div>
            <UserTests userProfile={userProfile} tests={tests} />
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
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Προπονητής
              </Button>
            </div>
            <UserPayments userProfile={userProfile} payments={payments} />
          </div>
        );
      default:
        return <div>Άγνωστη καρτέλα</div>;
    }
  };

  return (
    <>
      {renderContent()}
      
      <SmartAIChatDialog
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        athleteId={userProfile.id}
        athleteName={userProfile.name}
        athletePhotoUrl={userProfile.photo_url}
      />
    </>
  );
};

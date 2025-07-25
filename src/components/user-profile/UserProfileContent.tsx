
import React, { useState } from "react";
import { UserProfileHeader } from "./UserProfileHeader";
import { UserProfileStats } from "./UserProfileStats";
import { UserProfileDailyProgram } from "./UserProfileDailyProgram";
import { UserProfileCalendar } from "./UserProfileCalendar";
import { UserProfileProgramCards } from "./UserProfileProgramCards";
import { UserProfileTests } from "./UserProfileTests";
import { UserProfilePayments } from "./UserProfilePayments";
import { UserProfileOverview } from "./UserProfileOverview";
import { UserProfileShop } from "./UserProfileShop";
import { UserProfileOnlineBooking } from "./UserProfileOnlineBooking";
import { UserProfileOffers } from "./UserProfileOffers";
import { supabase } from "@/integrations/supabase/client";
import { UserProfileOnlineCoaching } from "./UserProfileOnlineCoaching";
import { TrainingAnalytics } from "./TrainingAnalytics";
import { EnhancedAIChatDialog } from "@/components/ai-chat/EnhancedAIChatDialog";

interface UserProfileContentProps {
  activeTab: string;
  userProfile: any;
  stats: any;
  programs: any[];
  tests: any[];
  payments: any[];
  visits: any[];
  onOfferRejected?: () => void;
}

export const UserProfileContent = ({
  activeTab,
  userProfile,
  stats,
  programs,
  tests,
  payments,
  visits,
  onOfferRejected
}: UserProfileContentProps) => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Επισκόπηση Προφίλ</h2>
            <UserProfileOverview 
              userProfile={userProfile} 
              stats={stats} 
              programs={programs} 
              tests={tests} 
              payments={payments} 
              visits={visits}
            />
          </div>
        );
      case "programs":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Προγράμματα</h2>
            <UserProfileProgramCards userProfile={userProfile} />
          </div>
        );
      case "calendar":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Ημερολόγιο</h2>
            <UserProfileCalendar user={userProfile} />
          </div>
        );
      case "tests":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Τεστ & Αξιολογήσεις</h2>
            <UserProfileTests tests={tests} />
          </div>
        );
      case "payments":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Πληρωμές & Συνδρομές</h2>
            <UserProfilePayments payments={payments} userProfile={userProfile} />
          </div>
        );
      case "shop":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Αγορές</h2>
            <UserProfileShop userProfile={userProfile} />
          </div>
        );
      case "offers":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Προσφορές</h2>
            <UserProfileOffers userProfile={userProfile} onOfferRejected={onOfferRejected} />
          </div>
        );
      case "online-coaching":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Online Coaching</h2>
            <UserProfileOnlineCoaching userProfile={userProfile} />
          </div>
        );
      case "online-booking":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Online Booking</h2>
            <UserProfileOnlineBooking userProfile={userProfile} />
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

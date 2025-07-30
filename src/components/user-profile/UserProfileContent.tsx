
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
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
  setActiveTab?: (tab: string) => void;
}

export const UserProfileContent = ({
  activeTab,
  userProfile,
  stats,
  programs,
  tests,
  payments,
  visits,
  onOfferRejected,
  setActiveTab
}: UserProfileContentProps) => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Άνοιγμα του AI chat dialog όταν το tab είναι "ai-trainer"
  useEffect(() => {
    if (activeTab === "ai-trainer") {
      setIsAIChatOpen(true);
    } else {
      setIsAIChatOpen(false);
    }
  }, [activeTab]);

  const BackButton = () => (
    setActiveTab && activeTab !== 'overview' && (
      <button
        onClick={() => setActiveTab('overview')}
        className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors mb-4 font-medium"
      >
        <ArrowLeft className="h-5 w-5 font-bold stroke-2" />
        <span className="text-sm font-medium">Επιστροφή στην επισκόπηση</span>
      </button>
    )
  );

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
              setActiveTab={setActiveTab}
            />
          </div>
        );
      case "programs":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">Προγράμματα</h2>
            <UserProfileProgramCards userProfile={userProfile} />
          </div>
        );
      case "calendar":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">Ημερολόγιο</h2>
            <UserProfileCalendar user={userProfile} />
          </div>
        );
      case "tests":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">Τεστ & Αξιολογήσεις</h2>
            <UserProfileTests tests={tests} />
          </div>
        );
      case "payments":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">Πληρωμές & Συνδρομές</h2>
            <UserProfilePayments payments={payments} userProfile={userProfile} />
          </div>
        );
      case "shop":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">Αγορές</h2>
            <UserProfileShop userProfile={userProfile} />
          </div>
        );
      case "offers":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">Προσφορές</h2>
            <UserProfileOffers userProfile={userProfile} onOfferRejected={onOfferRejected} />
          </div>
        );
      case "online-coaching":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">Online Coaching</h2>
            <UserProfileOnlineCoaching userProfile={userProfile} />
          </div>
        );
      case "online-booking":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">Online Booking</h2>
            <UserProfileOnlineBooking userProfile={userProfile} />
          </div>
        );
      case "ai-trainer":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">RidAI Προπονητής</h2>
            <div className="bg-white rounded-none border border-gray-200 p-6">
              <div className="text-center">
                <button
                  onClick={() => setIsAIChatOpen(true)}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black px-6 py-3 rounded-none font-medium transition-colors"
                >
                  Άνοιγμα AI Προπονητή
                </button>
                <p className="text-gray-600 mt-4">
                  Συνομιλήστε με τον έξυπνο AI προπονητή για προπόνηση, διατροφή και συμβουλές
                </p>
              </div>
            </div>
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

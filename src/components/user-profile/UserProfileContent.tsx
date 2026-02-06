
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from 'react-i18next';
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
import { InlineAIChat } from "@/components/ai-chat/InlineAIChat";
import { EnhancedAIChatDialog } from "@/components/ai-chat/EnhancedAIChatDialog";
import { UserProfileEdit } from "./UserProfileEdit";
import { UserProgressSection } from "./UserProgressSection";
import { UserProfileHistory } from "./UserProfileHistory";
import { SchoolNotes } from "@/pages/SchoolNotes";
import { UserProfileNutrition } from "./UserProfileNutrition";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useUserSubscriptionStatus } from "@/hooks/useUserSubscriptionStatus";

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

// Έλεγχος αν ο χρήστης ανήκει σε coach (coach_id που δείχνει σε trainer)
const useIsCoachManagedUser = (userProfile: any) => {
  const [isCoachManaged, setIsCoachManaged] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userProfile?.coach_id) {
        if (!cancelled) setIsCoachManaged(false);
        return;
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', userProfile.coach_id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error('Error resolving coach role:', error);
        setIsCoachManaged(false);
        return;
      }

      setIsCoachManaged(data?.role === 'coach');
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userProfile?.coach_id]);

  return isCoachManaged;
};

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
  const { t } = useTranslation();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const { isAdmin } = useRoleCheck();
  const isCoachManagedUser = useIsCoachManagedUser(userProfile);
  const { hasActiveSubscription } = useUserSubscriptionStatus(userProfile?.id);
  
  const hasSubscription = isAdmin() || hasActiveSubscription;
  
  // Allowed tabs without subscription
  const allowedWithoutSubscription = ['shop', 'edit-profile', 'download-app'];

  // Άνοιγμα του AI chat dialog όταν το tab είναι "ai-trainer" - χρησιμοποιείται μόνο για άλλα components
  useEffect(() => {
    if (activeTab !== "ai-trainer") {
      setIsAIChatOpen(false);
    }
  }, [activeTab]);

  // Redirect to shop if no subscription and restricted tab
  useEffect(() => {
    if (!hasSubscription && !allowedWithoutSubscription.includes(activeTab) && setActiveTab) {
      setActiveTab('shop');
    }
  }, [hasSubscription, activeTab]);

  // Το βελάκι εμφανίζεται μόνο σε admin mode
  const BackButton = () => (
    setActiveTab && activeTab !== 'overview' && isAdmin() && (
      <button
        onClick={() => setActiveTab('overview')}
        className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors mb-4 font-medium"
      >
        <ArrowLeft className="h-5 w-5 font-bold stroke-2" />
        <span className="text-sm font-medium">{t('overview.backToOverview')}</span>
      </button>
    )
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t('overview.title')}</h2>
            <UserProfileOverview 
              userProfile={userProfile} 
              stats={stats} 
              setActiveTab={setActiveTab}
            />
          </div>
        );
      case "programs":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">{t('overview.programs')}</h2>
            <UserProfileProgramCards userProfile={userProfile} />
          </div>
        );
      case "calendar":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">{t('overview.calendar')}</h2>
            <UserProfileCalendar user={userProfile} />
          </div>
        );
      case "tests":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">{t('overview.testsEvaluations')}</h2>
            <UserProgressSection
              userId={userProfile?.id}
              useCoachTables={isCoachManagedUser}
              coachId={isCoachManagedUser ? userProfile?.coach_id : undefined}
            />
          </div>
        );
      case "progress":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">{t('overview.progress')}</h2>
            <UserProgressSection
              userId={userProfile?.id}
              useCoachTables={isCoachManagedUser}
              coachId={isCoachManagedUser ? userProfile?.coach_id : undefined}
            />
          </div>
        );
      case "history":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">{t('overview.history')}</h2>
            <UserProfileHistory userId={userProfile?.id} useCoachTables={isCoachManagedUser} />
          </div>
        );
      case "payments":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">{t('overview.paymentsSubscriptions')}</h2>
            <UserProfilePayments payments={payments} userProfile={userProfile} />
          </div>
        );
      case "shop":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">{t('overview.shop')}</h2>
            <UserProfileShop userProfile={userProfile} />
          </div>
        );
      case "offers":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">{t('overview.activeOffers')}</h2>
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
            <UserProfileOnlineBooking userProfile={userProfile} visits={visits} />
          </div>
        );
      case "ai-trainer":
        return (
          <div className="space-y-4">
            <BackButton />
            <h2 className="text-xl font-semibold">{t('overview.aiCoach')}</h2>
            <InlineAIChat
              athleteId={userProfile?.id}
              athleteName={userProfile?.name}
              athletePhotoUrl={userProfile?.photo_url}
            />
          </div>
        );
      case "edit-profile":
        return (
          <div className="space-y-4">
            <BackButton />
            <UserProfileEdit 
              userProfile={userProfile}
              onProfileUpdated={() => {
                // Refresh του προφίλ μετά την ενημέρωση
                window.location.reload();
              }}
            />
          </div>
        );
      case "school-notes":
        return (
          <div className="space-y-4">
            <BackButton />
            <SchoolNotes userId={userProfile?.id} />
          </div>
        );
      case "nutrition":
        return (
          <div className="space-y-4">
            <BackButton />
            <UserProfileNutrition userId={userProfile?.id} userProfile={userProfile} />
          </div>
        );
      default:
        return <div>{t('overview.unknownTab')}</div>;
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

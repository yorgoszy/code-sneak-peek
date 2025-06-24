
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Crown } from "lucide-react";
import { SmartAIChatDialog } from "@/components/ai-chat/SmartAIChatDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";

interface TestsHeaderProps {
  selectedAthleteId?: string;
  selectedAthleteName?: string;
}

export const TestsHeader: React.FC<TestsHeaderProps> = ({ 
  selectedAthleteId, 
  selectedAthleteName 
}) => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const { user } = useAuth();
  const { userProfile, isAdmin } = useRoleCheck();

  useEffect(() => {
    if (user?.id && userProfile?.id) {
      checkSubscriptionStatus();
    }
  }, [user?.id, userProfile?.id]);

  const checkSubscriptionStatus = async () => {
    if (!userProfile?.id) return;
    
    setIsCheckingSubscription(true);
    try {
      // Αν είναι admin, δίνουμε πρόσβαση
      if (isAdmin()) {
        setHasActiveSubscription(true);
        setIsCheckingSubscription(false);
        return;
      }

      // Ελέγχουμε τη συνδρομή με το RPC function
      const { data: subscriptionStatus, error } = await supabase.rpc('has_active_subscription', { 
        user_uuid: userProfile.id 
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setHasActiveSubscription(false);
      } else {
        setHasActiveSubscription(subscriptionStatus);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasActiveSubscription(false);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const handleAIChatClick = () => {
    if (isCheckingSubscription) {
      toast.info('Ελέγχω τη συνδρομή σου...');
      return;
    }

    if (!hasActiveSubscription) {
      toast.error('Χρειάζεσαι ενεργή συνδρομή για να χρησιμοποιήσεις το RID AI');
      return;
    }

    setIsAIChatOpen(true);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Τεστ</h1>
            <p className="text-sm text-gray-600">
              Διαχείριση τεστ αθλητών
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleAIChatClick}
              className={`rounded-none flex items-center gap-2 ${
                hasActiveSubscription 
                  ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={isCheckingSubscription}
            >
              {hasActiveSubscription ? (
                <Bot className="w-4 h-4" />
              ) : (
                <Crown className="w-4 h-4" />
              )}
              {isCheckingSubscription ? 'Έλεγχος...' : hasActiveSubscription ? 'AI Βοηθός' : 'AI Βοηθός (Απαιτείται Συνδρομή)'}
            </Button>
          </div>
        </div>
      </nav>

      <SmartAIChatDialog
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        athleteId={selectedAthleteId}
        athleteName={selectedAthleteName}
      />
    </>
  );
};

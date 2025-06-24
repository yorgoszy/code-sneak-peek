
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
  const { isAdmin } = useRoleCheck();

  useEffect(() => {
    if (selectedAthleteId) {
      checkSubscriptionStatus();
    }
  }, [selectedAthleteId]);

  const checkSubscriptionStatus = async () => {
    if (!selectedAthleteId) {
      console.log('❌ No selectedUserId found');
      setHasActiveSubscription(false);
      setIsCheckingSubscription(false);
      return;
    }
    
    setIsCheckingSubscription(true);
    try {
      console.log('🔍 TestsHeader: Checking subscription for user:', selectedAthleteId);
      
      // Αν είναι admin, δίνουμε πρόσβαση
      if (isAdmin()) {
        console.log('✅ TestsHeader: Admin user detected - access granted');
        setHasActiveSubscription(true);
        setIsCheckingSubscription(false);
        return;
      }

      // Έλεγχος ΜΟΝΟ του subscription_status στον πίνακα app_users
      const { data: userStatus, error: userError } = await supabase
        .from('app_users')
        .select('subscription_status')
        .eq('id', selectedAthleteId)
        .single();

      if (userError) {
        console.error('❌ TestsHeader: Error fetching user status:', userError);
        setHasActiveSubscription(false);
        setIsCheckingSubscription(false);
        return;
      }

      console.log('📊 TestsHeader: User subscription status:', userStatus?.subscription_status);

      // ΜΟΝΟ έλεγχος του subscription_status
      const hasSubscription = userStatus?.subscription_status === 'active';
      console.log('🎯 TestsHeader: Final subscription decision:', hasSubscription);
      setHasActiveSubscription(hasSubscription);
    } catch (error) {
      console.error('💥 TestsHeader: Error checking subscription:', error);
      setHasActiveSubscription(false);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const handleAIChatClick = () => {
    console.log('🔄 TestsHeader: AI Chat button clicked. Current state:', {
      isCheckingSubscription,
      hasActiveSubscription,
      selectedUserId: selectedAthleteId,
      isAdmin: isAdmin()
    });

    if (isCheckingSubscription) {
      toast.info('Ελέγχω τη συνδρομή σου...');
      return;
    }

    if (!hasActiveSubscription && !isAdmin()) {
      console.log('❌ TestsHeader: Access denied - no active subscription and not admin');
      toast.error('Απαιτείται ενεργή συνδρομή για να χρησιμοποιήσεις το RID AI');
      return;
    }

    console.log('✅ TestsHeader: Access granted - opening AI chat');
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
                hasActiveSubscription || isAdmin()
                  ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={isCheckingSubscription || (!hasActiveSubscription && !isAdmin())}
            >
              {hasActiveSubscription || isAdmin() ? (
                <Bot className="w-4 h-4" />
              ) : (
                <Crown className="w-4 h-4" />
              )}
              {isCheckingSubscription 
                ? 'Έλεγχος...' 
                : hasActiveSubscription || isAdmin()
                  ? 'AI Βοηθός' 
                  : 'AI Βοηθός (Απαιτείται Συνδρομή)'
              }
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

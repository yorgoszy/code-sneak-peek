
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
    } else {
      setHasActiveSubscription(false);
      setIsCheckingSubscription(false);
    }
  }, [selectedAthleteId]);

  const checkSubscriptionStatus = async () => {
    if (!selectedAthleteId) {
      console.log('❌ TestsHeader: No selectedAthleteId found');
      setHasActiveSubscription(false);
      setIsCheckingSubscription(false);
      return;
    }
    
    setIsCheckingSubscription(true);
    try {
      console.log('🔍 TestsHeader: Checking subscription for user:', selectedAthleteId);
      
      // Έλεγχος ΜΟΝΟ του subscription_status για τον επιλεγμένο αθλητή
      const { data: userStatus, error: userError } = await supabase
        .from('app_users')
        .select('subscription_status, role')
        .eq('id', selectedAthleteId)
        .single();

      if (userError) {
        console.error('❌ TestsHeader: Error fetching user status:', userError);
        setHasActiveSubscription(false);
        setIsCheckingSubscription(false);
        return;
      }

      console.log('📊 TestsHeader: User subscription status:', userStatus?.subscription_status);

      // Αν ο επιλεγμένος αθλητής είναι admin, δίνουμε πρόσβαση
      if (userStatus?.role === 'admin') {
        console.log('✅ TestsHeader: Selected user is admin - access granted');
        setHasActiveSubscription(true);
        setIsCheckingSubscription(false);
        return;
      }

      // Έλεγχος του subscription_status για τον επιλεγμένο αθλητή
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
      selectedAthleteId,
      isCurrentUserAdmin: isAdmin()
    });

    if (isCheckingSubscription) {
      toast.info('Ελέγχω τη συνδρομή...');
      return;
    }

    if (!selectedAthleteId) {
      toast.error('Παρακαλώ επιλέξτε έναν αθλητή πρώτα');
      return;
    }

    if (!hasActiveSubscription) {
      console.log('❌ TestsHeader: Access denied - selected athlete has no active subscription');
      toast.error('Ο επιλεγμένος αθλητής δεν έχει ενεργή συνδρομή για το RID AI');
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
                hasActiveSubscription
                  ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={isCheckingSubscription || !hasActiveSubscription || !selectedAthleteId}
            >
              {hasActiveSubscription ? (
                <Bot className="w-4 h-4" />
              ) : (
                <Crown className="w-4 h-4" />
              )}
              {isCheckingSubscription 
                ? 'Έλεγχος...' 
                : hasActiveSubscription
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

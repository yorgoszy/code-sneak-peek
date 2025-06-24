
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Crown } from "lucide-react";
import { SmartAIChatDialog } from "@/components/ai-chat/SmartAIChatDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";

interface TestsHeaderProps {
  selectedUserId?: string;
  selectedUserName?: string;
}

export const TestsHeader: React.FC<TestsHeaderProps> = ({ 
  selectedUserId, 
  selectedUserName 
}) => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const { user } = useAuth();
  const { isAdmin } = useRoleCheck();

  useEffect(() => {
    if (selectedUserId) {
      checkSubscriptionStatus();
    } else {
      setHasActiveSubscription(false);
      setIsCheckingSubscription(false);
    }
  }, [selectedUserId]);

  const checkSubscriptionStatus = async () => {
    if (!selectedUserId) {
      console.log('❌ TestsHeader: No selectedUserId found');
      setHasActiveSubscription(false);
      setIsCheckingSubscription(false);
      return;
    }
    
    setIsCheckingSubscription(true);
    try {
      console.log('🔍 TestsHeader: Checking subscription for user:', selectedUserId);
      
      // Έλεγχος ΜΟΝΟ του subscription_status για τον επιλεγμένο χρήστη
      const { data: userStatus, error: userError } = await supabase
        .from('app_users')
        .select('subscription_status, role')
        .eq('id', selectedUserId)
        .single();

      if (userError) {
        console.error('❌ TestsHeader: Error fetching user status:', userError);
        setHasActiveSubscription(false);
        setIsCheckingSubscription(false);
        return;
      }

      console.log('📊 TestsHeader: User subscription status:', userStatus?.subscription_status);

      // Αν ο επιλεγμένος χρήστης είναι admin, δίνουμε πρόσβαση
      if (userStatus?.role === 'admin') {
        console.log('✅ TestsHeader: Selected user is admin - access granted');
        setHasActiveSubscription(true);
        setIsCheckingSubscription(false);
        return;
      }

      // Έλεγχος του subscription_status για τον επιλεγμένο χρήστη
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
      selectedUserId,
      isCurrentUserAdmin: isAdmin()
    });

    if (isCheckingSubscription) {
      toast.info('Ελέγχω τη συνδρομή...');
      return;
    }

    if (!selectedUserId) {
      toast.error('Παρακαλώ επιλέξτε έναν χρήστη πρώτα');
      return;
    }

    if (!hasActiveSubscription) {
      console.log('❌ TestsHeader: Access denied - selected user has no active subscription');
      toast.error('Ο επιλεγμένος χρήστης δεν έχει ενεργή συνδρομή για το RID AI');
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
              disabled={isCheckingSubscription || !hasActiveSubscription || !selectedUserId}
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
        userId={selectedUserId}
        userName={selectedUserName}
      />
    </>
  );
};

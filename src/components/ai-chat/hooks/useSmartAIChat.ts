
import { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface UseSmartAIChatProps {
  isOpen: boolean;
  athleteId?: string;
  athleteName?: string;
}

export const useSmartAIChat = ({ isOpen, athleteId, athleteName }: UseSmartAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end"
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (isOpen && athleteId) {
      checkSubscriptionStatus();
    }
  }, [isOpen, athleteId]);

  const checkSubscriptionStatus = async () => {
    if (!athleteId) {
      setHasActiveSubscription(false);
      setIsCheckingSubscription(false);
      return;
    }
    
    setIsCheckingSubscription(true);
    try {
      console.log('🔍 AI Chat: Checking subscription for user:', athleteId);
      
      // Πρώτα ελέγχουμε αν ο χρήστης είναι admin
      const { data: userProfile, error: profileError } = await supabase
        .from('app_users')
        .select('role, subscription_status')
        .eq('id', athleteId)
        .single();

      if (profileError) {
        console.error('❌ AI Chat: Error fetching user profile:', profileError);
        setHasActiveSubscription(false);
        setIsCheckingSubscription(false);
        return;
      }

      console.log('📊 AI Chat: User profile:', userProfile);

      // Αν είναι admin, δίνουμε πρόσβαση
      if (userProfile?.role === 'admin') {
        console.log('✅ AI Chat: Admin user detected - access granted');
        setHasActiveSubscription(true);
        setIsCheckingSubscription(false);
        loadConversationHistory();
        return;
      }

      // Έλεγχος αν έχει ενεργή συνδρομή στον πίνακα app_users
      if (userProfile?.subscription_status !== 'active') {
        console.log('❌ AI Chat: User subscription_status is not active:', userProfile?.subscription_status);
        setHasActiveSubscription(false);
        setIsCheckingSubscription(false);
        return;
      }

      // Διπλός έλεγχος με το RPC function
      const { data: subscriptionStatus, error: subscriptionError } = await supabase.rpc('has_active_subscription', { 
        user_uuid: athleteId 
      });

      if (subscriptionError) {
        console.error('❌ AI Chat: Error checking subscription with RPC:', subscriptionError);
        setHasActiveSubscription(false);
      } else {
        console.log('✅ AI Chat: RPC Subscription status:', subscriptionStatus);
        
        // Και οι δύο έλεγχοι πρέπει να επιστρέφουν true
        const finalStatus = subscriptionStatus && userProfile?.subscription_status === 'active';
        console.log('🎯 AI Chat: Final subscription decision:', finalStatus);
        setHasActiveSubscription(finalStatus);
        
        if (finalStatus) {
          loadConversationHistory();
        }
      }
    } catch (error) {
      console.error('💥 AI Chat: Error checking subscription:', error);
      setHasActiveSubscription(false);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const loadConversationHistory = async () => {
    if (!athleteId || !hasActiveSubscription) {
      console.log('❌ AI Chat: Cannot load history - no athleteId or no active subscription');
      return;
    }
    
    setIsLoadingHistory(true);
    try {
      console.log('📚 AI Chat: Loading conversation history for:', athleteId);
      
      const { data: history, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', athleteId)
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) throw error;

      if (history && history.length > 0) {
        const formattedMessages: Message[] = history.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.message_type as 'user' | 'assistant',
          timestamp: new Date(msg.created_at)
        }));
        setMessages(formattedMessages);
        console.log('✅ AI Chat: Loaded', formattedMessages.length, 'messages from history');
      } else {
        setMessages([{
          id: 'welcome',
          content: `Γεια σου ${athleteName}! 👋

Είμαι ο **RID**, ο προσωπικός σου AI προπονητής! 🤖

Έχω πρόσβαση στα βασικά σου δεδομένα:

📊 **Σωματομετρικά στοιχεία**
💪 **Τεστ δύναμης και προόδους** 
🏃 **Προγράμματα προπονήσεων**
🍎 **Διατροφικές συμβουλές**
🎯 **Στόχους και προτιμήσεις**

Μπορώ να:
• Υπολογίσω τις θερμίδες που έκαψες σήμερα
• Προτείνω διατροφή βάσει των στόχων σου
• Αναλύσω την πρόοδό σου στα τεστ
• Δώσω συμβουλές για την προπόνησή σου
• Θυμάμαι τις προηγούμενες συζητήσεις μας

**Μαθαίνω από κάθε συνομιλία μας!** 🧠

Τι θα θέλες να μάθεις σήμερα;`,
          role: 'assistant',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('❌ AI Chat: Error loading conversation history:', error);
      toast.error('Σφάλμα κατά τη φόρτωση του ιστορικού');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading || !athleteId) return;

    // Αυστηρός έλεγχος συνδρομής πριν από κάθε μήνυμα
    if (!hasActiveSubscription) {
      console.log('❌ AI Chat: No active subscription - blocking message');
      toast.error('Απαιτείται ενεργή συνδρομή για να χρησιμοποιήσεις το RID AI');
      
      // Επανέλεγχος συνδρομής
      await checkSubscriptionStatus();
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      console.log('🤖 AI Chat: Calling RID AI for user:', athleteId, 'Message:', userMessage);
      
      const { data, error } = await supabase.functions.invoke('smart-ai-chat', {
        body: {
          message: userMessage,
          userId: athleteId
        }
      });

      if (error) {
        console.error('❌ AI Chat: RID AI Error:', error);
        
        // Αν το error είναι για συνδρομή, ενημερώνουμε την κατάσταση
        if (error.message?.includes('No active subscription') || error.message?.includes('subscription')) {
          setHasActiveSubscription(false);
          toast.error('Η συνδρομή σου έχει λήξει. Επικοινώνησε με τον διαχειριστή.');
          return;
        }
        
        throw error;
      }

      console.log('✅ AI Chat: RID AI Response received:', data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('💥 AI Chat: RID AI Error:', error);
      toast.error('Σφάλμα στον RID AI βοηθό');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά σε λίγο.',
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    if (!hasActiveSubscription) {
      toast.error('Απαιτείται ενεργή συνδρομή για αυτή την ενέργεια');
      return;
    }

    setMessages([{
      id: 'welcome',
      content: `Γεια σου ${athleteName}! 👋

Είμαι ο **RID**, ο προσωπικός σου AI προπονητής! 🤖

Έχω πρόσβαση στα βασικά σου δεδομένα:

📊 **Σωματομετρικά στοιχεία**
💪 **Τεστ δύναμης και προόδους** 
🏃 **Προγράμματα προπονήσεων**
🍎 **Διατροφικές συμβουλές**
🎯 **Στόχους και προτιμήσεις**

Μπορώ να:
• Υπολογίσω τις θερμίδες που έκαψες σήμερα
• Προτείνω διατροφή βάσει των στόχων σου
• Αναλύσω την πρόοδό σου στα τεστ
• Δώσω συμβουλές για την προπόνησή σου
• Θυμάμαι τις προηγούμενες συζητήσεις μας

**Μαθαίνω από κάθε συνομιλία μας!** 🧠

Τι θα θέλες να μάθεις σήμερα;`,
      role: 'assistant',
      timestamp: new Date()
    }]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasActiveSubscription) {
        sendMessage(input);
      } else {
        toast.error('Απαιτείται ενεργή συνδρομή για να χρησιμοποιήσεις το RID AI');
      }
    }
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    isLoadingHistory,
    hasActiveSubscription,
    isCheckingSubscription,
    messagesEndRef,
    sendMessage,
    clearConversation,
    handleKeyPress
  };
};

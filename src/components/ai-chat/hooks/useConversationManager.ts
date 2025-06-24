
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Message, ConversationState } from './types';

interface UseConversationManagerProps {
  userId?: string;
  userName?: string;
  hasActiveSubscription: boolean;
}

export const useConversationManager = ({ 
  userId, 
  userName, 
  hasActiveSubscription 
}: UseConversationManagerProps): ConversationState & { clearConversation: () => void } => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (hasActiveSubscription && userId) {
      loadConversationHistory();
    }
  }, [hasActiveSubscription, userId]);

  const loadConversationHistory = async () => {
    if (!userId) {
      console.log('❌ useConversationManager: Cannot load history - no userId');
      return;
    }
    
    setIsLoadingHistory(true);
    try {
      console.log('📚 useConversationManager: Loading conversation history for user:', userId);
      
      const { data: history, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
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
        console.log('✅ useConversationManager: Loaded', formattedMessages.length, 'messages from history');
      } else {
        setMessages([createWelcomeMessage(userName)]);
      }
    } catch (error) {
      console.error('❌ useConversationManager: Error loading conversation history:', error);
      toast.error('Σφάλμα κατά τη φόρτωση του ιστορικού');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const createWelcomeMessage = (userName?: string): Message => ({
    id: 'welcome',
    content: `Γεια σου ${userName}! 👋

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
  });

  const clearConversation = () => {
    if (!hasActiveSubscription) {
      toast.error('Απαιτείται ενεργή συνδρομή για αυτή την ενέργεια');
      return;
    }

    setMessages([createWelcomeMessage(userName)]);
  };

  return { messages, isLoadingHistory, clearConversation, setMessages };
};

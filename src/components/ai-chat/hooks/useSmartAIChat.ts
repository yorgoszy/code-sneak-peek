
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
    if (!athleteId) return;
    
    setIsCheckingSubscription(true);
    try {
      console.log('🔍 Checking subscription for user:', athleteId);
      
      const { data, error } = await supabase.rpc('has_active_subscription', { 
        user_uuid: athleteId 
      });

      if (error) {
        console.error('❌ Error checking subscription:', error);
        setHasActiveSubscription(false);
      } else {
        console.log('✅ Subscription status:', data);
        setHasActiveSubscription(data);
        if (data) {
          loadConversationHistory();
        }
      }
    } catch (error) {
      console.error('💥 Error checking subscription:', error);
      setHasActiveSubscription(false);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const loadConversationHistory = async () => {
    if (!athleteId) return;
    
    setIsLoadingHistory(true);
    try {
      console.log('📚 Loading conversation history for:', athleteId);
      
      const { data: history, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', athleteId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (history && history.length > 0) {
        const formattedMessages: Message[] = history.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.message_type as 'user' | 'assistant',
          timestamp: new Date(msg.created_at)
        }));
        setMessages(formattedMessages);
        console.log('✅ Loaded', formattedMessages.length, 'messages from history');
      } else {
        setMessages([{
          id: 'welcome',
          content: `Γεια σου ${athleteName}! 👋

Είμαι ο **RID**, ο προσωπικός σου AI προπονητής και διατροφολόγος! 🤖

Έχω πρόσβαση σε όλα τα δεδομένα σου:

📊 **Σωματομετρικά στοιχεία**
💪 **Τεστ δύναμης και προόδους** 
🏃 **Προγράμματα προπονήσεων**
🍎 **Διατροφικές συμβουλές**
🎯 **Στόχους και προτιμήσεις**

Μπορώ να:
• Υπολογίσω τις θερμίδες που έκαψες σήμερα
• Προτείνω διατροφή βάσει των στόχων σου
• Αναλύσω την πρόοδό σου στα τεστ
• Προσαρμόσω συμβουλές στο σημερινό σου πρόγραμμα
• Θυμάμαι τις προηγούμενες συζητήσεις μας

**Μαθαίνω από κάθε συνομιλία μας!** 🧠

Τι θα θέλες να μάθεις σήμερα;`,
          role: 'assistant',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('❌ Error loading conversation history:', error);
      toast.error('Σφάλμα κατά τη φόρτωση του ιστορικού');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !athleteId || !hasActiveSubscription) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('🤖 Calling RID AI for user:', athleteId, 'Message:', input);
      
      const { data, error } = await supabase.functions.invoke('smart-ai-chat', {
        body: {
          message: input,
          userId: athleteId
        }
      });

      if (error) {
        console.error('❌ RID AI Error:', error);
        throw error;
      }

      console.log('✅ RID AI Response received:', data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('💥 RID AI Error:', error);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
    handleKeyPress
  };
};

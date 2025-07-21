
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from './types';

interface UseMessageSenderProps {
  userId?: string;
  hasActiveSubscription: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  checkSubscriptionStatus: () => Promise<void>;
}

export const useMessageSender = ({
  userId,
  hasActiveSubscription,
  setMessages,
  checkSubscriptionStatus
}: UseMessageSenderProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading || !userId) return;

    // Αυστηρός έλεγχος συνδρομής πριν από κάθε μήνυμα
    if (!hasActiveSubscription) {
      console.log('❌ useMessageSender: No active subscription - blocking message');
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
      console.log('🤖 useMessageSender: Calling RID AI for user:', userId, 'Message:', userMessage);
      
      const { data, error } = await supabase.functions.invoke('smart-ai-chat', {
        body: {
          message: userMessage,
          userId: userId
        }
      });

      if (error) {
        console.error('❌ useMessageSender: RID AI Error:', error);
        
        // Αν το error είναι για συνδρομή, ενημερώνουμε την κατάσταση
        if (error.message?.includes('No active subscription') || error.message?.includes('subscription')) {
          toast.error('Η συνδρομή σου έχει λήξει. Επικοινώνησε με τον διαχειριστή.');
          return;
        }
        
        throw error;
      }

      console.log('✅ useMessageSender: RID AI Response received:', data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Αποθήκευση στη βάση δεδομένων
      try {
        console.log('💾 Saving conversation to database...');
        
        await supabase.from('ai_conversations').insert([
          {
            user_id: userId,
            content: userMessage,
            message_type: 'user',
            metadata: {}
          },
          {
            user_id: userId,
            content: data.response,
            message_type: 'assistant',
            metadata: { aiType: 'rid-smart' }
          }
        ]);

        console.log('✅ Conversation saved successfully');
      } catch (saveError) {
        console.error('❌ Error saving conversation:', saveError);
        // Δεν διακόπτουμε τη λειτουργία αν αποτύχει η αποθήκευση
      }

    } catch (error) {
      console.error('💥 useMessageSender: RID AI Error:', error);
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

  return { sendMessage, isLoading };
};

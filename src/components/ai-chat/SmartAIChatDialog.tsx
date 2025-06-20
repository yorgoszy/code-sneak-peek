import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, Brain, Zap, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface SmartAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
}

export const SmartAIChatDialog: React.FC<SmartAIChatDialogProps> = ({
  isOpen,
  onClose,
  athleteId,
  athleteName
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Βελτιωμένο auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end"
    });
  };

  useEffect(() => {
    // Delay για να εξασφαλίσουμε ότι το DOM έχει ενημερωθεί
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  // Έλεγχος συνδρομής
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

  // Φόρτωση ιστορικού συνομιλίας
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
        // Μήνυμα καλωσορίσματος από τον RID
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

  // Έλεγχος συνδρομής
  useEffect(() => {
    if (isOpen && athleteId) {
      checkSubscriptionStatus();
    }
  }, [isOpen, athleteId]);

  const SubscriptionRequiredContent = () => (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div className="text-center max-w-md">
        <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          Απαιτείται Ενεργή Συνδρομή
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Για να έχεις πρόσβαση στον **RID AI**, χρειάζεσαι ενεργή συνδρομή. 
          Επικοινώνησε με τον διαχειριστή για να ενεργοποιήσεις τη συνδρομή σου.
        </p>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-none">
          <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Τι περιλαμβάνει η συνδρομή:</h4>
          <ul className="text-xs sm:text-sm text-blue-800 text-left space-y-1">
            <li>• Απεριόριστη πρόσβαση στον RID AI</li>
            <li>• Εξατομικευμένες συμβουλές διατροφής</li>
            <li>• Ανάλυση προόδου και τεστ</li>
            <li>• Υπολογισμοί θερμίδων και μακροθρεπτικών</li>
            <li>• Προσαρμοσμένες προτάσεις προπόνησης</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] w-[95vw] h-[90vh] m-2' : 'max-w-4xl h-[80vh]'} rounded-none p-0 flex flex-col`}>
        <DialogHeader className={`${isMobile ? 'p-3 pb-0' : 'p-6 pb-0'}`}>
          <DialogTitle className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center gap-3'}`}>
            <div className="flex items-center gap-2">
              <Brain className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-[#00ffba]`} />
              <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold`}>RID - Έξυπνος AI Προπονητής</span>
            </div>
            {athleteName && (
              <span className={`${isMobile ? 'text-xs' : 'text-base'} font-normal text-gray-600`}>
                για {athleteName}
              </span>
            )}
            <div className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center gap-2'}`}>
              <div className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-xs'} bg-blue-100 text-blue-800 px-2 py-1 rounded-none`}>
                <Zap className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} />
                <span>Powered by OpenAI</span>
              </div>
              {hasActiveSubscription && (
                <div className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-xs'} bg-green-100 text-green-800 px-2 py-1 rounded-none`}>
                  <Brain className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} />
                  <span>Ενεργή Συνδρομή</span>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {isCheckingSubscription ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
              <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>Ελέγχω τη συνδρομή σου...</span>
            </div>
          </div>
        ) : !hasActiveSubscription ? (
          <SubscriptionRequiredContent />
        ) : isLoadingHistory ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
              <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>Φορτώνω το ιστορικό συνομιλίας...</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto">
              <div className={`space-y-3 ${isMobile ? 'p-3' : 'p-4'}`}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 ${isMobile ? 'max-w-[90%]' : 'max-w-[85%]'} ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-[#00ffba] text-black'
                      }`}>
                        {message.role === 'user' ? 
                          <User className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} /> : 
                          <Brain className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                        }
                      </div>
                      <div className={`${isMobile ? 'p-3' : 'p-4'} rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} whitespace-pre-wrap leading-relaxed`}>{message.content}</p>
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} opacity-70 mt-2`}>
                          {message.timestamp.toLocaleTimeString('el-GR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-[#00ffba] text-black flex items-center justify-center`}>
                      <Brain className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    </div>
                    <div className={`bg-gray-100 text-gray-900 ${isMobile ? 'p-3' : 'p-4'} rounded-lg rounded-bl-none`}>
                      <div className="flex items-center gap-2">
                        <Loader2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                        <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Ο RID αναλύει τα δεδομένα σου και σκέφτεται...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className={`flex gap-2 ${isMobile ? 'p-3' : 'p-4'} border-t`}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Πληκτρολογήστε το μήνυμά σας στον RID..."
                className={`rounded-none ${isMobile ? 'text-sm' : ''}`}
                disabled={isLoading || !hasActiveSubscription}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || !hasActiveSubscription}
                className={`rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black ${isMobile ? 'px-3' : 'px-4'}`}
              >
                {isLoading ? (
                  <Loader2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                ) : (
                  <Send className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

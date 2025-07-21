import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Brain, Send } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  aiType?: 'rid-smart';
}

interface EnhancedAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
  athletePhotoUrl?: string;
}

// Έξυπνο Local AI
class SmartLocalAI {
  private static instance: SmartLocalAI;

  static getInstance(): SmartLocalAI {
    if (!SmartLocalAI.instance) {
      SmartLocalAI.instance = new SmartLocalAI();
    }
    return SmartLocalAI.instance;
  }

  // Προετοιμάζει το context για την AI
  async prepareContext(athleteId: string) {
    try {
      // Φορτώνει στοιχεία χρήστη
      const { data: userProfile } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', athleteId)
        .single();

      // Φορτώνει πρόσφατα τεστ
      const { data: tests } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', athleteId)
        .order('test_date', { ascending: false })
        .limit(5);

      // Φορτώνει προγράμματα
      const { data: programs } = await supabase
        .from('program_assignments')
        .select('*')
        .eq('user_id', athleteId)
        .eq('status', 'active');

      return {
        userProfile,
        tests,
        programs
      };
    } catch (error) {
      console.error('Σφάλμα προετοιμασίας context:', error);
      return null;
    }
  }
}

export const EnhancedAIChatDialog: React.FC<EnhancedAIChatDialogProps> = ({
  isOpen,
  onClose,
  athleteId,
  athleteName,
  athletePhotoUrl
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const smartLocalAI = SmartLocalAI.getInstance();

  useEffect(() => {
    if (isOpen && athleteId) {
      console.log('🔄 Dialog opened, loading conversation for athleteId:', athleteId);
      loadConversationHistory();
    } else if (!isOpen) {
      console.log('🧹 Dialog closed, clearing messages');
      setMessages([]);
    }
  }, [isOpen, athleteId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversationHistory = async () => {
    if (!athleteId) return;
    
    setIsLoadingHistory(true);
    setMessages([]);
    
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
          timestamp: new Date(msg.created_at),
          aiType: msg.message_type === 'assistant' ? 'rid-smart' : undefined
        }));
        setMessages(formattedMessages);
        console.log('✅ Loaded', formattedMessages.length, 'messages from history');
      } else {
        console.log('📝 No history found, showing welcome message');
        const welcomeMessage: Message = {
          id: 'welcome',
          content: `Γεια σου HYPERKIDS! 👋

Είμαι ο **RID AI** και έχω φορτώσει όλα τα δεδομένα σου! 🤖

Μπορώ να σε βοηθήσω με:
💪 **Προπόνηση & Προγράμματα**
🥗 **Διατροφή & Θερμίδες**
📊 **Ανάλυση Προόδου**
🧪 **Αξιολόγηση Τεστ**
😴 **Ανάκαμψη & Ύπνο**

**Μαθαίνω από κάθε συνομιλία μας!** 🧠

Τι θα θέλες να μάθεις;`,
          role: 'assistant',
          timestamp: new Date(),
          aiType: 'rid-smart'
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('❌ Error loading conversation history:', error);
      toast.error('Σφάλμα κατά τη φόρτωση του ιστορικού');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveMessageToDatabase = async (message: Message) => {
    if (!athleteId) return;
    
    try {
      console.log('💾 Saving message to database:', { athleteId, role: message.role, content: message.content.substring(0, 50) });
      
      const { error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: athleteId,
          message_type: message.role,
          content: message.content,
          metadata: message.aiType ? { aiType: message.aiType } : {}
        });

      if (error) {
        console.error('❌ Error saving message:', error);
      } else {
        console.log('✅ Message saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving message to database:', error);
    }
  };

  const sendMessage = async (input: string) => {
    console.log('🔄 EnhancedAIChatDialog sendMessage called with:', { input, athleteId });
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Αποθήκευση μηνύματος χρήστη στη βάση
      await saveMessageToDatabase(userMessage);

      // Προετοιμασία context για την AI
      const context = await smartLocalAI.prepareContext(athleteId);

      // Κλήση edge function για AI response
      const { data, error } = await supabase.functions.invoke('smart-ai-chat', {
        body: {
          message: userMessage.content,
          userId: athleteId,
          userName: 'HYPERKIDS',
          platformData: context,
          files: null
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (data?.response) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date(),
          aiType: 'rid-smart'
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Αποθήκευση απάντησης AI στη βάση
        await saveMessageToDatabase(assistantMessage);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Σφάλμα κατά την αποστολή μηνύματος');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] rounded-none flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#00ffba]" />
            RID AI Προπονητής
            {athleteName && (
              <span className="text-sm font-normal text-gray-600">
                για {athleteName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                  <span className="text-gray-500">Φόρτωση ιστορικού...</span>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    athleteName={athleteName}
                    athletePhotoUrl={athletePhotoUrl}
                  />
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-[#00ffba] text-black flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      <span className="text-sm">Το RID AI σκέφτεται...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t bg-card p-4">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Γράψε το μήνυμά σου..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && input.trim() && !isLoading) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                disabled={isLoading}
                className="rounded-none"
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
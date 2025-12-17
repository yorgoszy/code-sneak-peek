import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Brain, Crown, Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAIProgramBuilder } from "@/contexts/AIProgramBuilderContext";
import { Badge } from "@/components/ui/badge";
import { QuickAssignProgramDialog } from "@/components/ai-chat/QuickAssignProgramDialog";

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
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { openDialog: openProgramBuilder, queueAction, executeAction } = useAIProgramBuilder();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!athleteId) return;
      
      try {
        // Check if user is admin
        const { data: userData } = await supabase
          .from('app_users')
          .select('role')
          .eq('id', athleteId)
          .single();
        
        setIsAdmin(userData?.role === 'admin');
        
        // Check subscription status
        const today = new Date().toISOString().split('T')[0];
        const { data: subscriptionData } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', athleteId)
          .eq('status', 'active')
          .gte('end_date', today)
          .limit(1);
        
        setHasActiveSubscription(subscriptionData && subscriptionData.length > 0);
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };
    
    if (isOpen) {
      checkUserStatus();
    }
  }, [isOpen, athleteId]);

  useEffect(() => {
    if (isOpen && athleteId) {
      loadConversationHistory();
    }
  }, [isOpen, athleteId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversationHistory = async () => {
    if (!athleteId) return;
    
    setIsLoadingHistory(true);
    try {
      console.log('📚 Loading conversation history for:', athleteId);
      
      const { data: history, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', athleteId)
        .order('created_at', { ascending: false })
        .limit(50); // Τα 50 πιο πρόσφατα μηνύματα

      if (error) throw error;

      if (history && history.length > 0) {
        // Αντιστρέφουμε τη σειρά για να δείξουμε τα παλαιότερα πρώτα
        const formattedMessages: Message[] = history.reverse().map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.message_type as 'user' | 'assistant',
          timestamp: new Date(msg.created_at),
          aiType: msg.message_type === 'assistant' ? 'rid-smart' : undefined
        }));
        setMessages(formattedMessages);
        console.log('✅ Loaded', formattedMessages.length, 'messages from history');
      } else {
        // Αν δεν υπάρχει ιστορικό, δείχνουμε το καλωσόρισμα
        await initializeChat();
      }
    } catch (error) {
      console.error('❌ Error loading conversation history:', error);
      toast.error('Σφάλμα κατά τη φόρτωση του ιστορικού');
      // Αν αποτύχει η φόρτωση, δείχνουμε τουλάχιστον το καλωσόρισμα
      await initializeChat();
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
        toast.error('Σφάλμα αποθήκευσης μηνύματος');
      } else {
        console.log('✅ Message saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving message to database:', error);
      toast.error('Σφάλμα αποθήκευσης συνομιλίας');
    }
  };

  const initializeChat = async () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Γεια σου${athleteName ? ` ${athleteName}` : ''}! 👋

Είμαι ο **RID AI Προπονητής** και είμαι εδώ για να σε βοηθήσω με:

🏋️ Προπονητικές συμβουλές
🥗 Διατροφή και σχεδιασμό γευμάτων  
📊 Ανάλυση της προόδου σου
💪 Ασκησιολογικές τεχνικές
🔄 Αποκατάσταση και πρόληψη τραυματισμών

Έχω πρόσβαση στο ιστορικό προόδου σου και μπορώ να σου δώσω εξατομικευμένες συμβουλές!

Τι θα ήθελες να συζητήσουμε σήμερα;`,
      role: 'assistant',
      timestamp: new Date(),
      aiType: 'rid-smart'
    };

    setMessages([welcomeMessage]);
    
    // Αποθηκεύουμε το μήνυμα καλωσορίσματος
    await saveMessageToDatabase(welcomeMessage);
  };

  // Επεξεργασία AI actions (δημιουργία/ανάθεση προγραμμάτων + ProgramBuilder control)
  const processAIActions = async (response: string) => {
    // Βρες το ai-action block
    const actionMatch = response.match(/```ai-action\s*([\s\S]*?)```/);
    if (!actionMatch) return;

    let jsonStr = actionMatch[1].trim();
    
    // Έλεγχος αν το content ξεκινάει με { (είναι JSON)
    if (!jsonStr.startsWith('{')) {
      console.error('❌ AI action block δεν περιέχει valid JSON - ξεκινάει με:', jsonStr.substring(0, 50));
      toast.error('Το AI έδωσε λάθος format. Παρακαλώ δοκίμασε ξανά.');
      return;
    }
    
    try {
      // Διόρθωση JSON
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      const openBraces = (jsonStr.match(/{/g) || []).length;
      const closeBraces = (jsonStr.match(/}/g) || []).length;
      const openBrackets = (jsonStr.match(/\[/g) || []).length;
      const closeBrackets = (jsonStr.match(/]/g) || []).length;
      
      // Έλεγχος αν λείπουν πολλές αγκύλες (truncated JSON)
      const missingBraces = openBraces - closeBraces;
      const missingBrackets = openBrackets - closeBrackets;
      
      if (missingBraces > 5 || missingBrackets > 5) {
        console.error('❌ JSON φαίνεται truncated - λείπουν πολλές αγκύλες');
        toast.error('Το πρόγραμμα ήταν πολύ μεγάλο. Ζήτα απλούστερο πρόγραμμα με λιγότερες ασκήσεις.');
        return;
      }
      
      for (let i = 0; i < missingBrackets; i++) jsonStr += ']';
      for (let i = 0; i < missingBraces; i++) jsonStr += '}';
      
      const actionData = JSON.parse(jsonStr);
      console.log('🤖 Processing AI action:', actionData);

      // Έλεγχος για ProgramBuilder actions
      if (actionData.action === 'open_program_builder') {
        openProgramBuilder();
        toast.success('Άνοιξε ο Program Builder!');
        
        // Εκτέλεση ακολουθίας actions αν υπάρχουν
        if (actionData.actions && Array.isArray(actionData.actions)) {
          setTimeout(() => {
            actionData.actions.forEach((act: any) => {
              executeAction(act);
            });
          }, 500);
        }
        return;
      }

      // Υπάρχουσα λογική για create_program
      if (actionData.action === 'create_program') {
        toast.loading('Δημιουργία προγράμματος...', { id: 'ai-action' });

        const result = await fetch(
          `https://dicwdviufetibnafzipa.supabase.co/functions/v1/ai-program-actions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8`,
            },
            body: JSON.stringify(actionData),
          }
        );

        const data = await result.json();
        
        if (data.success) {
          toast.success(data.message || 'Το πρόγραμμα δημιουργήθηκε επιτυχώς!', { id: 'ai-action' });
        } else {
          toast.error(data.error || 'Σφάλμα κατά τη δημιουργία του προγράμματος', { id: 'ai-action' });
        }
      }
    } catch (error) {
      console.error('Error processing AI action:', error, 'JSON:', jsonStr);
      toast.error('Σφάλμα επεξεργασίας AI action');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !athleteId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    // Δημιουργία placeholder για το streaming message
    const assistantMessageId = (Date.now() + 1).toString();
    const placeholderMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      aiType: 'rid-smart'
    };
    
    setMessages(prev => [...prev, placeholderMessage]);

    try {
      // Κλήση rid-ai-coach με streaming
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rid-ai-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: currentInput }],
            userId: athleteId
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Υπερβήκατε το όριο αιτημάτων. Παρακαλώ δοκιμάστε αργότερα.');
        }
        if (response.status === 402) {
          throw new Error('Απαιτείται πληρωμή. Παρακαλώ προσθέστε πιστώσεις στο Lovable AI workspace.');
        }
        throw new Error('Σφάλμα επικοινωνίας με το AI');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (!reader) throw new Error('No response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                // Update message in real-time
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: fullResponse }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      console.log('✅ Streaming completed');
      
      // Έλεγχος για AI actions στην απάντηση
      await processAIActions(fullResponse);
      
    } catch (error) {
      console.error('RID AI Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Σφάλμα στην επικοινωνία με το AI';
      toast.error(errorMessage);
      
      // Update placeholder with error message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: `Λυπάμαι, ${errorMessage}` }
            : msg
        )
      );
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

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] rounded-none flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#cb8954]" />
              RidAI Προπονητής
              {athleteName && (
                <span className="text-sm font-normal text-gray-600">
                  για {athleteName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Badge variant="default" className="bg-[#cb8954] text-white rounded-none">
                  <Crown className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              ) : hasActiveSubscription ? (
                <Badge variant="default" className="bg-[#00ffba] text-black rounded-none">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-none">
                  Βασική
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-gray-500">Φόρτωση ιστορικού...</span>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex-shrink-0">
                        {message.role === 'user' ? (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={athletePhotoUrl} alt={athleteName || 'User'} />
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {getUserInitials(athleteName)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#cb8954] text-white flex items-center justify-center">
                            <Brain className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString('el-GR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {message.role === 'assistant' && (
                            <span className="text-xs opacity-70 ml-2">
                              RidAI
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-[#cb8954] text-white flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Το RidAI σκέφτεται έξυπνα...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2 p-4 border-t bg-white">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ρώτα τον RidAI Προπονητή για προπόνηση, διατροφή, ανάκαμψη..."
              className="rounded-none"
              disabled={isLoading || isLoadingHistory}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isLoadingHistory}
              className="rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

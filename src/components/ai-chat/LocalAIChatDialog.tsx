
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Download, Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useExerciseRenderer } from './hooks/useExerciseRenderer';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface LocalAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
  userPhotoUrl?: string;
}

export const LocalAIChatDialog: React.FC<LocalAIChatDialogProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userPhotoUrl
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { renderExercisesInText, ExerciseVideoDialogComponent } = useExerciseRenderer();

  useEffect(() => {
    if (isOpen && userId) {
      setMessages([{
        id: 'welcome',
        content: `Γεια σας! Είμαι ο έξυπνος RID AI βοηθός σας. ${userName ? `Έχω πρόσβαση στα δεδομένα του ${userName}` : 'Έχω πρόσβαση στα δεδομένα σας'} από την πλατφόρμα και μπορώ να δώσω εξατομικευμένες συμβουλές για:

🏋️ Τα προγράμματά σας και τις ασκήσεις σας
📊 Τα αποτελέσματα των τεστ σας  
💪 Προσωποποιημένες συμβουλές διατροφής και προπόνησης
📈 Ανάλυση της προόδου σας

✅ Συλλέγω δεδομένα από την πλατφόρμα και χρησιμοποιώ AI για καλύτερες απαντήσεις!`,
        role: 'assistant',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, userId, userName]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchUserData = async () => {
    if (!userId) return null;

    try {
      console.log('🔍 Fetching user data for Local AI:', userId);

      // Fetch user's active programs with exercises
      const { data: userPrograms, error: programsError } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs!inner(
            name,
            description,
            program_weeks(
              program_days(
                program_blocks(
                  program_exercises(
                    sets,
                    reps,
                    kg,
                    exercises(
                      id,
                      name,
                      description,
                      video_url
                    )
                  )
                )
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (programsError) {
        console.error('❌ Error fetching programs:', programsError);
      }

      // Fetch recent test results
      const { data: testSessions, error: testError } = await supabase
        .from('test_sessions')
        .select(`
          *,
          anthropometric_test_data(*),
          functional_test_data(*),
          endurance_test_data(*),
          jump_test_data(*),
          strength_test_data(
            *,
            exercises(name)
          )
        `)
        .eq('user_id', userId)
        .order('test_date', { ascending: false })
        .limit(5);

      if (testError) {
        console.error('❌ Error fetching tests:', testError);
      }

      return {
        programs: userPrograms || [],
        tests: testSessions || []
      };
    } catch (error) {
      console.error('💥 Error fetching user data:', error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !userId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      console.log('🤖 Local AI: Fetching user data and calling smart AI...');
      
      // Fetch user data from platform
      const userData = await fetchUserData();
      
      // Call the smart AI endpoint with user data
      const { data, error } = await supabase.functions.invoke('smart-ai-chat', {
        body: { 
          message: userInput, 
          userId: userId, 
          userName: userName,
          platformData: userData
        }
      });

      if (error) {
        throw new Error(error.message || 'AI service error');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Λυπάμαι, δεν μπόρεσα να επεξεργαστώ το αίτημά σας.',
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('💥 Local AI Error:', error);
      toast.error('Σφάλμα στον AI βοηθό');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά.',
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

  const renderMessageContent = (content: string, role: string) => {
    if (role === 'assistant') {
      const renderedContent = renderExercisesInText(content);
      if (Array.isArray(renderedContent)) {
        return (
          <div className="text-sm whitespace-pre-wrap">
            {renderedContent.map((part, index) => 
              typeof part === 'string' ? (
                <span key={index}>{part}</span>
              ) : (
                <React.Fragment key={index}>{part}</React.Fragment>
              )
            )}
          </div>
        );
      }
    }
    return <p className="text-sm whitespace-pre-wrap">{content}</p>;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] rounded-none flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#00ffba]" />
              Έξυπνος RID AI Βοηθός - Με Πρόσβαση στα Δεδομένα σας
              {userName && (
                <span className="text-sm font-normal text-gray-600">
                  για {userName}
                </span>
              )}
              <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-none">
                <Bot className="w-3 h-3" />
                Smart AI
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-4 border rounded-none" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-[#00ffba] text-black'
                      }`}>
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}>
                        {renderMessageContent(message.content, message.role)}
                        <p className="text-xs opacity-70 mt-1">
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
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-[#00ffba] text-black flex items-center justify-center">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Αναλύω τα δεδομένα σας και σκέφτομαι...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2 p-4 border-t">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={userId ? "Πληκτρολογήστε το μήνυμά σας..." : "Παρακαλώ επιλέξτε χρήστη πρώτα..."}
                className="rounded-none min-h-[80px] max-h-[120px] resize-none"
                disabled={isLoading || !userId}
                rows={3}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || !userId}
                className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black self-end"
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

      <ExerciseVideoDialogComponent />
    </>
  );
};

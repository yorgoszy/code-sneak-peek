
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Database, Bot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useExerciseRenderer } from './hooks/useExerciseRenderer';
import { PredefinedQuestions } from './components/PredefinedQuestions';
import { WelcomeMessage } from './components/WelcomeMessage';
import { LocalChatMessages } from './components/LocalChatMessages';
import { LocalChatInput } from './components/LocalChatInput';

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
  const [showQuestions, setShowQuestions] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { renderExercisesInText, ExerciseVideoDialogComponent } = useExerciseRenderer();

  useEffect(() => {
    if (isOpen && userId) {
      setMessages([{
        id: 'welcome',
        content: '',
        role: 'assistant',
        timestamp: new Date()
      }]);
      setShowQuestions(true);
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

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading || !userId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput('');
    setShowQuestions(false);
    setIsLoading(true);

    try {
      console.log('🤖 Local AI: Fetching user data and calling smart AI...');
      
      // Fetch user data from platform
      const userData = await fetchUserData();
      
      // Call the smart AI endpoint with user data
      const { data, error } = await supabase.functions.invoke('smart-ai-chat', {
        body: { 
          message: textToSend, 
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

  const handlePredefinedQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessageContent = (content: string, role: string) => {
    if (role === 'assistant' && content === '') {
      return <WelcomeMessage userName={userName} />;
    }
    
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
            <LocalChatMessages
              messages={messages}
              isLoading={isLoading}
              scrollAreaRef={scrollAreaRef}
              renderMessageContent={renderMessageContent}
            />

            <PredefinedQuestions
              onQuestionClick={handlePredefinedQuestion}
              showQuestions={showQuestions}
              messagesLength={messages.length}
            />

            <LocalChatInput
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              userId={userId}
              onSend={() => sendMessage()}
              onKeyPress={handleKeyPress}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ExerciseVideoDialogComponent />
    </>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User, Loader2, Users, Camera } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserUpcomingEvents } from "@/hooks/useUserUpcomingEvents";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { AICoachDialog } from "@/components/ai-coach";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const RidAiCoach = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showAICoach, setShowAICoach] = useState(false);
  const { userProfile } = useRoleCheck();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  
  // Admin features
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const isAdmin = userProfile?.role === 'admin';

  // Fetch upcoming events για τον χρήστη
  const targetUserId = isAdmin && selectedUserId ? selectedUserId : userProfile?.id;
  const { competitions, tests } = useUserUpcomingEvents(targetUserId);

  // Load all users for admin
  useEffect(() => {
    if (isAdmin) {
      loadAllUsers();
    }
  }, [isAdmin]);

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email')
        .order('name', { ascending: true });

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Load conversation history - ΜΟΝΟ ΓΙΑ RID AI COACH
  const loadHistory = async (targetUserId?: string) => {
    const userId = targetUserId || userProfile?.id;
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .contains('metadata', { conversation_type: 'rid-ai-coach' }) // 🔥 Φιλτράρουμε μόνο rid-ai-coach
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedMessages: Message[] = data.map((msg: any) => ({
          role: msg.message_type as 'user' | 'assistant',
          content: msg.content
        }));
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      toast.error('Σφάλμα κατά τη φόρτωση του ιστορικού');
    }
  };

  // Load history on mount or when selected user changes
  useEffect(() => {
    const init = async () => {
      setIsLoadingHistory(true);
      await loadHistory(isAdmin ? selectedUserId : undefined);
      setIsLoadingHistory(false);
    };
    init();
  }, [userProfile?.id, selectedUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !userProfile?.id) return;
    
    // Prevent double-calls
    if (isProcessingRef.current) {
      console.log('⚠️ Already processing a message, ignoring duplicate call');
      return;
    }
    
    isProcessingRef.current = true;
    const userMessage: Message = { role: 'user', content: input };
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    // Optimistically add user message
    setMessages(prev => [...prev, userMessage]);

    try {
      // Prepare all messages including the new one for full conversation context
      const allMessages = [...messages, userMessage];
      
      // Prepare user context με competitions και tests (παρελθόντα και μελλοντικά)
      const userContext: any = {};
      
      if (competitions.length > 0) {
        const pastComps = competitions.filter(c => c.isPast);
        const futureComps = competitions.filter(c => !c.isPast);
        
        if (pastComps.length > 0) {
          userContext.pastCompetitions = pastComps.map(comp => ({
            date: format(new Date(comp.date), 'EEEE, d MMMM yyyy', { locale: el }),
            daysAgo: Math.abs(comp.daysUntil),
            programName: comp.programName,
            dayName: comp.dayName
          }));
        }
        
        if (futureComps.length > 0) {
          userContext.upcomingCompetitions = futureComps.map(comp => ({
            date: format(new Date(comp.date), 'EEEE, d MMMM yyyy', { locale: el }),
            daysUntil: comp.daysUntil,
            programName: comp.programName,
            dayName: comp.dayName
          }));
        }
      }
      
      if (tests.length > 0) {
        const pastTests = tests.filter(t => t.isPast);
        const futureTests = tests.filter(t => !t.isPast);
        
        if (pastTests.length > 0) {
          userContext.pastTests = pastTests.map(test => ({
            date: format(new Date(test.date), 'EEEE, d MMMM yyyy', { locale: el }),
            daysAgo: Math.abs(test.daysUntil),
            type: test.type === 'scheduled' ? 'προγραμματισμένο' : 'από πρόγραμμα',
            testTypes: test.testTypes?.join(', ')
          }));
        }
        
        if (futureTests.length > 0) {
          userContext.upcomingTests = futureTests.map(test => ({
            date: format(new Date(test.date), 'EEEE, d MMMM yyyy', { locale: el }),
            daysUntil: test.daysUntil,
            type: test.type === 'scheduled' ? 'προγραμματισμένο' : 'από πρόγραμμα',
            testTypes: test.testTypes?.join(', ')
          }));
        }
      }
      
      console.log('🎯 RID AI: Sending context for user:', targetUserId);
      console.log('🎯 Competitions:', competitions);
      console.log('🎯 Tests:', tests);
      console.log('🎯 UserContext:', userContext);
      
      const response = await fetch(
        'https://dicwdviufetibnafzipa.supabase.co/functions/v1/rid-ai-coach',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: allMessages,
            userId: userProfile.id,
            userContext: Object.keys(userContext).length > 0 ? userContext : undefined,
            ...(isAdmin && selectedUserId && { targetUserId: selectedUserId })
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let textBuffer = ''; // Buffer για incomplete lines

      // Add empty assistant message for streaming
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        // Decode chunk και πρόσθεσε στο buffer
        textBuffer += decoder.decode(value, { stream: true });

        // Process γραμμή-γραμμή
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          // Handle CRLF
          if (line.endsWith('\r')) line = line.slice(0, -1);
          
          // Skip comments και κενές γραμμές
          if (line.startsWith(':') || line.trim() === '') continue;
          
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: assistantMessage
                };
                return newMessages;
              });
            }
          } catch (e) {
            // Incomplete JSON - αφήνουμε στο buffer για το επόμενο chunk
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush τελικό buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw || raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: assistantMessage
                };
                return newMessages;
              });
            }
          } catch { /* ignore */ }
        }
      }

      // ✅ ΔΕΝ χρειάζεται reload - τα messages είναι ήδη στο state και αποθηκεύονται στη βάση από το edge function
      // Το reload προκαλούσε διπλασιασμό των μηνυμάτων
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Σφάλμα κατά την αποστολή μηνύματος');
      // Remove optimistic messages
      setMessages(prev => prev.slice(0, -2));
      // Restore input
      setInput(currentInput);
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col rounded-none">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#00ffba]" />
              RID AI Coach
            </CardTitle>
            <p className="text-sm text-gray-600">
              Ο προσωπικός σου προπονητής που σε θυμάται και μαθαίνει από κάθε συζήτηση
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Camera AI Coach button */}
            <Button
              onClick={() => setShowAICoach(true)}
              variant="outline"
              className="rounded-none flex items-center gap-2"
              title="AI Coach με Κάμερα"
            >
              <Camera className="w-4 h-4 text-[#00ffba]" />
              <span className="hidden md:inline">Κάμερα</span>
            </Button>
            
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <Select value={selectedUserId || "__self__"} onValueChange={(val) => setSelectedUserId(val === "__self__" ? "" : val)}>
                  <SelectTrigger className="w-[250px] rounded-none">
                    <SelectValue placeholder="Επίλεξε χρήστη..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__self__">Ο δικός μου λογαριασμός</SelectItem>
                    {allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {isLoadingHistory && (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#00ffba]" />
              </div>
            )}

            {!isLoadingHistory && messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-[#00ffba]" />
                <p className="font-semibold mb-2">Γεια σου! Είμαι ο RID</p>
                <p className="text-sm">
                  Μίλησέ μου για τους στόχους σου, την προπόνησή σου ή οτιδήποτε σχετικό με το fitness!
                </p>
              </div>
            )}

            {!isLoadingHistory && messages.map((message, index) => (

              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'assistant' ? 'justify-start' : 'justify-end'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#00ffba] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-black" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'assistant'
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-[#00ffba] text-black'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-[#00ffba] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Γράψε το μήνυμά σου..."
              disabled={isLoading}
              className="rounded-none"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isLoadingHistory}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      <AICoachDialog isOpen={showAICoach} onClose={() => setShowAICoach(false)} />
    </Card>
  );
};

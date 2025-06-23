
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Download, Sparkles, Brain } from "lucide-react";
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

// Έξυπνο Local AI που μαθαίνει από Gemini και OpenAI
class SmartLocalAI {
  private static instance: SmartLocalAI;
  private knowledgeBase: Map<string, string> = new Map();

  static getInstance(): SmartLocalAI {
    if (!SmartLocalAI.instance) {
      SmartLocalAI.instance = new SmartLocalAI();
    }
    return SmartLocalAI.instance;
  }

  // Το Local AI μαθαίνει από τις απαντήσεις του Gemini και OpenAI
  learnFromResponse(question: string, response: string, source: 'gemini' | 'openai') {
    const normalizedQuestion = question.toLowerCase().trim();
    
    // Αποθηκεύει τη γνώση για μελλοντική χρήση
    this.knowledgeBase.set(normalizedQuestion, response);
    
    console.log(`🧠 Local AI έμαθε από ${source.toUpperCase()}: "${normalizedQuestion.substring(0, 50)}..."`);
  }

  // Ελέγχει αν το Local AI γνωρίζει την απάντηση
  hasKnowledge(question: string): string | null {
    const normalizedQuestion = question.toLowerCase().trim();
    
    // Ακριβής match
    if (this.knowledgeBase.has(normalizedQuestion)) {
      return this.knowledgeBase.get(normalizedQuestion) || null;
    }

    // Partial match για παρόμοιες ερωτήσεις
    for (const [storedQuestion, answer] of this.knowledgeBase.entries()) {
      if (storedQuestion.includes(normalizedQuestion) || normalizedQuestion.includes(storedQuestion)) {
        return answer;
      }
    }

    return null;
  }

  // Βασικές απαντήσεις που γνωρίζει ήδη το Local AI
  getBasicResponse(message: string, athleteName?: string): string | null {
    const lowerMessage = message.toLowerCase();
    const greeting = athleteName ? `${athleteName}` : 'φίλε μου';
    
    if (lowerMessage.includes('γεια') || lowerMessage.includes('hello') || lowerMessage.includes('καλησπέρα') || lowerMessage.includes('καλημέρα')) {
      return `Γεια σου ${greeting}! 👋 

Είμαι ο **RID AI Προπονητής** - ένα έξυπνο σύστημα που συνδυάζει:
🔥 **Gemini AI** (δωρεάν και γρήγορο)
🚀 **OpenAI GPT** (για πολύπλοκες ερωτήσεις)  
🧠 **Smart Local AI** (μαθαίνει από τα άλλα δύο)

**Ειδικεύομαι σε:**
🏋️ Προπόνηση & Ασκήσεις
🥗 Διατροφή & Θερμίδες  
💪 Μυϊκή Ανάπτυξη
🔥 Απώλεια Βάρους
😴 Ανάκαμψη & Ύπνο

Ρώτα με ό,τι θέλεις και θα σου δώσω την καλύτερη δυνατή απάντηση! 🚀`;
    }

    return null;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const smartLocalAI = SmartLocalAI.getInstance();

  useEffect(() => {
    if (isOpen) {
      setMessages([{
        id: 'welcome',
        content: `Γεια σου${athleteName ? ` ${athleteName}` : ''}! 👋

Καλώς ήρθες στον **RID AI Προπονητή** - το πιο έξυπνο AI σύστημα για fitness! 🤖💪

**Πώς λειτουργώ:**
🔥 **Πρώτα δοκιμάζω το Gemini AI** (δωρεάν & γρήγορο)
🚀 **Αν χρειάζεται, καλώ το OpenAI GPT** (για δύσκολες ερωτήσεις)
🧠 **Το Smart Local AI μαθαίνει** από κάθε απάντηση

**Αποτέλεσμα:** Μία τέλεια απάντηση που γίνεται καλύτερη με κάθε ερώτηση! ⚡

**Ειδικεύομαι σε:**
🏋️ Προπόνηση & Τεχνική Ασκήσεων
🥗 Διατροφή & Μακροθρεπτικά  
💪 Μυϊκή Ανάπτυξη & Δύναμη
🔥 Απώλεια Βάρους & Καρδιό
😴 Ανάκαμψη & Ποιότητα Ύπνου

Ρώτα με ό,τι θέλεις για fitness και διατροφή! 🚀`,
        role: 'assistant',
        timestamp: new Date(),
        aiType: 'rid-smart'
      }]);
    }
  }, [isOpen, athleteName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callGeminiAI = async (message: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('gemini-ai-chat', {
      body: { message, athleteName }
    });

    if (error) throw error;
    return data.response;
  };

  const callOpenAI = async (message: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('ai-fitness-chat', {
      body: { message, athleteName }
    });

    if (error) throw error;
    return data.response;
  };

  // Ελέγχει αν μια απάντηση είναι ικανοποιητική
  const isGoodResponse = (response: string): boolean => {
    const lowResponse = response.toLowerCase();
    
    // Αν η απάντηση είναι πολύ σύντομη ή γενική
    if (response.length < 50) return false;
    
    // Αν περιέχει φράσεις που δείχνουν αβεβαιότητα
    const uncertainPhrases = [
      'δεν είμαι σίγουρος',
      'δεν γνωρίζω',
      'δεν μπορώ να',
      'λυπάμαι',
      'δεν έχω πληροφορίες',
      'δεν είμαι ειδικός'
    ];
    
    return !uncertainPhrases.some(phrase => lowResponse.includes(phrase));
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

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

    try {
      let finalResponse = '';
      let usedSource = '';

      // Βήμα 1: Έλεγχος αν το Smart Local AI γνωρίζει την απάντηση
      const localKnowledge = smartLocalAI.hasKnowledge(currentInput);
      const basicResponse = smartLocalAI.getBasicResponse(currentInput, athleteName);

      if (localKnowledge) {
        finalResponse = `🧠 **Smart Local AI:**\n${localKnowledge}\n\n*Έμαθα αυτή την απάντηση από προηγούμενες ερωτήσεις!*`;
        usedSource = 'local-learned';
      } else if (basicResponse) {
        finalResponse = basicResponse;
        usedSource = 'local-basic';
      } else {
        // Βήμα 2: Δοκιμάζουμε πρώτα το Gemini AI (δωρεάν)
        try {
          console.log('🔥 Δοκιμάζω Gemini AI πρώτα...');
          const geminiResponse = await callGeminiAI(currentInput);
          
          if (isGoodResponse(geminiResponse)) {
            finalResponse = `🔥 **Gemini AI:**\n${geminiResponse}`;
            usedSource = 'gemini';
            
            // Το Smart Local AI μαθαίνει από το Gemini
            smartLocalAI.learnFromResponse(currentInput, geminiResponse, 'gemini');
          } else {
            throw new Error('Gemini response not satisfactory');
          }
        } catch (geminiError) {
          console.log('⚠️ Gemini AI δεν μπόρεσε, δοκιμάζω OpenAI...');
          
          // Βήμα 3: Αν το Gemini αποτύχει, καλούμε το OpenAI
          try {
            const openaiResponse = await callOpenAI(currentInput);
            finalResponse = `🚀 **OpenAI GPT:**\n${openaiResponse}\n\n*Χρησιμοποίησα το προηγμένο OpenAI επειδή η ερώτηση ήταν πολύπλοκη*`;
            usedSource = 'openai';
            
            // Το Smart Local AI μαθαίνει από το OpenAI
            smartLocalAI.learnFromResponse(currentInput, openaiResponse, 'openai');
          } catch (openaiError) {
            finalResponse = `❌ **Σφάλμα:**\nΔυστυχώς αντιμετωπίζω τεχνικά προβλήματα με όλα τα AI συστήματα.\n\nΠαρακαλώ δοκιμάστε ξανά σε λίγο.`;
            usedSource = 'error';
          }
        }
      }

      // Προσθήκη πληροφοριών για το ποιο σύστημα χρησιμοποιήθηκε
      if (usedSource === 'gemini') {
        finalResponse += `\n\n📊 **Χρησιμοποιήθηκε:** Gemini AI (Δωρεάν & Γρήγορο)`;
      } else if (usedSource === 'openai') {
        finalResponse += `\n\n📊 **Χρησιμοποιήθηκε:** OpenAI GPT (Προηγμένο για δύσκολες ερωτήσεις)`;
      } else if (usedSource === 'local-learned') {
        finalResponse += `\n\n📊 **Χρησιμοποιήθηκε:** Smart Local AI (Έμαθα από προηγούμενες απαντήσεις)`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: finalResponse,
        role: 'assistant',
        timestamp: new Date(),
        aiType: 'rid-smart'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('RID AI Error:', error);
      toast.error('Σφάλμα στον RID AI Προπονητή');
      
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
              {messages.map((message) => (
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
                        <div className="w-8 h-8 rounded-full bg-[#00ffba] text-black flex items-center justify-center">
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
                            RID AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-[#00ffba] text-black flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Το RID AI σκέφτεται έξυπνα...</span>
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
              placeholder="Ρώτα τον RID AI Προπονητή για προπόνηση, διατροφή, ανάκαμψη..."
              className="rounded-none"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
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

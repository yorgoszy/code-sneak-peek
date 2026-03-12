import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Sparkles, Brain } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  aiType?: 'rid-smart';
}

interface InlineAIChatProps {
  athleteId?: string;
  athleteName?: string;
  athletePhotoUrl?: string;
}

// Κλήσεις στα AI Edge Functions
const callGeminiAI = async (message: string, userId?: string, userName?: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-ai-chat', {
      body: { 
        message,
        userId,
        userName
      }
    });

    if (error) throw error;
    return data?.response || 'Σφάλμα στην απάντηση του Gemini AI';
  } catch (error) {
    console.error('Gemini AI Error:', error);
    throw new Error('Το Gemini AI δεν είναι διαθέσιμο αυτή τη στιγμή');
  }
};

const callOpenAI = async (message: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-fitness-chat', {
      body: { message }
    });

    if (error) throw error;
    return data?.response || 'Σφάλμα στην απάντηση του OpenAI';
  } catch (error) {
    console.error('OpenAI Error:', error);
    throw new Error('Το OpenAI δεν είναι διαθέσιμο αυτή τη στιγμή');
  }
};

const callPerplexityAI = async (message: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('perplexity-search', {
      body: { message }
    });

    if (error) throw error;
    return data?.response || 'Σφάλμα στην απάντηση του Perplexity AI';
  } catch (error) {
    console.error('Perplexity AI Error:', error);
    throw new Error('Το Perplexity AI δεν είναι διαθέσιμο αυτή τη στιγμή');
  }
};

export const InlineAIChat: React.FC<InlineAIChatProps> = ({
  athleteId,
  athleteName,
  athletePhotoUrl
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Προσθήκη καλωσόρισμα μήνυμα όταν φορτώνεται το component
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Γεια σου${athleteName ? ` ${athleteName}` : ''}! 👋

Είμαι ο **RidAI Προπονητής** - ένα έξυπνο σύστημα τεχνητής νοημοσύνης.

**Τι μπορώ να κάνω για εσένα:**
🏋️ Δημιουργία προγραμμάτων προπόνησης
🥗 Συμβουλές διατροφής 
📊 Ανάλυση προόδου
💪 Συμβουλές ανάκαμψης
🎯 Στόχους fitness

**Παραδείγματα ερωτήσεων:**
• "Δημιούργησε μου πρόγραμμα για δύναμη"
• "Τι να φάω για μυϊκή μάζα;"
• "Πώς να βελτιώσω την αντοχή μου;"

Τι θα θέλες να μάθεις σήμερα; 🚀`,
      role: 'assistant',
      timestamp: new Date(),
      aiType: 'rid-smart'
    };

    setMessages([welcomeMessage]);
  }, [athleteName]);

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />')
      .replace(/• /g, '• ');
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
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      let response: string;
      
      // Χρησιμοποιούμε διαφορετικά AI ανάλογα με το περιεχόμενο
      if (userInput.toLowerCase().includes('τελευταίες νέα') || 
          userInput.toLowerCase().includes('έρευνα') ||
          userInput.toLowerCase().includes('τάσεις')) {
        response = await callPerplexityAI(userInput);
      } else if (userInput.toLowerCase().includes('προπόνηση') ||
                 userInput.toLowerCase().includes('άσκηση') ||
                 userInput.toLowerCase().includes('workout')) {
        response = await callOpenAI(userInput);
      } else {
        response = await callGeminiAI(userInput, athleteId, athleteName);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        aiType: 'rid-smart'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('Σφάλμα στον RidAI Προπονητή');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Συγγνώμη, προέκυψε ένα σφάλμα. Παρακαλώ δοκίμασε ξανά.',
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

  return (
    <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot className="w-8 h-8 text-[#00ffba]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">RidAI Προπονητής</h3>
            <p className="text-sm text-gray-500">Έξυπνος AI Προπονητής</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <Brain className="w-5 h-5 text-purple-500" />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-2`}
            >
              {message.role === 'assistant' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-[#00ffba] text-black">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] rounded-none px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-[#00ffba] text-black'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(formatMessage(message.content), {
                      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'span'],
                      ALLOWED_ATTR: []
                    })
                  }}
                  className="text-sm leading-relaxed"
                />
                
                <div className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-black/70' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('el-GR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  {message.aiType && (
                    <span className="ml-2 font-medium">• RID Smart AI</span>
                  )}
                </div>
              </div>

              {message.role === 'user' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={athletePhotoUrl} />
                  <AvatarFallback className="bg-blue-500 text-white">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start items-start space-x-2">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src="" />
                <AvatarFallback className="bg-[#00ffba] text-black">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-none px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Σκέφτομαι...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ρώτα τον RidAI Προπονητή για προπόνηση, διατροφή, ανάκαμψη..."
            disabled={isLoading}
            className="flex-1 rounded-none border-gray-300 focus:border-[#00ffba] focus:ring-[#00ffba]"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
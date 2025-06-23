
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
  aiType?: 'ensemble';
}

interface EnhancedAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
  athletePhotoUrl?: string;
}

// Τοπικό AI που τρέχει στον browser
class LocalAI {
  private static instance: LocalAI;

  static getInstance(): LocalAI {
    if (!LocalAI.instance) {
      LocalAI.instance = new LocalAI();
    }
    return LocalAI.instance;
  }

  async generateResponse(message: string, athleteName?: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    return this.generateFitnessResponse(message, athleteName);
  }

  private generateFitnessResponse(message: string, athleteName?: string): string {
    const lowerMessage = message.toLowerCase();
    const greeting = athleteName ? `${athleteName}` : 'φίλε μου';
    
    if (lowerMessage.includes('γεια') || lowerMessage.includes('hello') || lowerMessage.includes('καλησπέρα') || lowerMessage.includes('καλημέρα')) {
      return `Γεια σου ${greeting}! 👋 
      
Είμαι ο **Local AI Προπονητής** σου! 🤖💪

Μπορώ να σε βοηθήσω με:
• 🏋️ Συμβουλές προπόνησης
• 🥗 Διατροφικές οδηγίες  
• 💪 Μυϊκή ανάπτυξη
• 🔥 Απώλεια βάρους
• 😴 Ανάκαμψη και ύπνο

Τι θα θέλες να μάθεις σήμερα;`;
    }

    // Διατροφικές συμβουλές
    if (lowerMessage.includes('διατροφή') || lowerMessage.includes('φαγητό') || lowerMessage.includes('τροφή') || lowerMessage.includes('θερμίδες')) {
      return `🥗 **Διατροφικές Συμβουλές για τον/την ${greeting}:**

**Βασικές Αρχές:**
• Πρωτεΐνες: 1.6-2.2g ανά κιλό σωματικού βάρους
• Υδατάνθρακες: 3-7g ανά κιλό (ανάλογα με την εντατικότητα)  
• Λίπη: 20-35% των συνολικών θερμίδων
• Νερό: 35-40ml ανά κιλό σωματικού βάρους

**Καλές Επιλογές:**
✅ Κοτόπουλο, ψάρι, αυγά (πρωτεΐνη)
✅ Ρύζι, βρώμη, γλυκοπατάτα (υδατάνθρακες)
✅ Αβοκάντο, ξηροί καρποί, ελαιόλαδο (λίπη)
✅ Φρούτα και λαχανικά (βιταμίνες)

Προτιμήστε φρέσκα, ελάχιστα επεξεργασμένα τρόφιμα! 🌱`;
    }

    return `Γεια σου ${greeting}! 👋 

Είμαι ο **Local AI Προπονητής** και είμαι εδώ για να σε βοηθήσω! 🤖💪

**Μπορώ να σε βοηθήσω με:**

🏋️ **Προπόνηση:** Ασκήσεις, τεχνική, προγραμματισμό
🥗 **Διατροφή:** Μακροθρεπτικά, γεύματα, υδατάνθρακες  
😴 **Ανάκαμψη:** Ύπνο, stretching, πρόληψη τραυματισμών
💪 **Μυϊκή ανάπτυξη:** Πρωτεΐνη, όγκο, δύναμη
🔥 **Απώλεια βάρους:** Θερμίδες, καρδιό, διατροφή
📊 **Τεστ & Μετρήσεις:** Πρόοδος, αξιολόγηση

Τι θα θέλες να μάθεις σήμερα; 🚀`;
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
  const localAI = LocalAI.getInstance();

  useEffect(() => {
    if (isOpen) {
      setMessages([{
        id: 'welcome',
        content: `Γεια σου${athleteName ? ` ${athleteName}` : ''}! 👋

Έχεις στη διάθεσή σου **τρεις AI προπονητές** που δουλεύουν μαζί! 🤖💪

🔥 **Local AI** - Τρέχει στον browser σου (100% δωρεάν)
🧠 **Gemini AI** - Προηγμένη τεχνητή νοημοσύνη από Google
🚀 **OpenAI GPT** - Ισχυρότατη AI από την OpenAI

**Τώρα όλα τρέχουν ταυτόχρονα!** ⚡
Κάθε ερώτησή σου θα πάρει απαντήσεις από όλα τα AI συστήματα για να έχεις την πιο ολοκληρωμένη βοήθεια!

**Ειδικεύομαι σε:**
🏋️ Προπόνηση & Ασκήσεις
🥗 Διατροφή & Θερμίδες  
💪 Μυϊκή Ανάπτυξη
🔥 Απώλεια Βάρους
😴 Ανάκαμψη & Ύπνο

Ρώτα με ό,τι θέλεις για fitness και διατροφή! 🚀`,
        role: 'assistant',
        timestamp: new Date(),
        aiType: 'ensemble'
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

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
      // Καλούμε όλα τα AI ταυτόχρονα
      const [localResponse, geminiResponse, openaiResponse] = await Promise.allSettled([
        localAI.generateResponse(input, athleteName),
        callGeminiAI(input),
        callOpenAI(input)
      ]);

      let responses: { content: string; type: string; icon: string }[] = [];

      if (localResponse.status === 'fulfilled') {
        responses.push({ 
          content: localResponse.value, 
          type: 'Local AI', 
          icon: '🤖' 
        });
      }
      if (geminiResponse.status === 'fulfilled') {
        responses.push({ 
          content: geminiResponse.value, 
          type: 'Gemini AI', 
          icon: '🧠' 
        });
      }
      if (openaiResponse.status === 'fulfilled') {
        responses.push({ 
          content: openaiResponse.value, 
          type: 'OpenAI GPT', 
          icon: '🚀' 
        });
      }

      // Δημιουργούμε την ensemble απάντηση
      let finalContent = '';

      if (responses.length === 0) {
        finalContent = 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα με όλα τα AI συστήματα. Παρακαλώ δοκιμάστε ξανά.';
      } else {
        finalContent = `**🤖💪 Τρεις AI Προπονητές Απαντούν:**\n\n`;
        
        responses.forEach((response, index) => {
          finalContent += `**${response.icon} ${response.type}:**\n${response.content}\n\n`;
          if (index < responses.length - 1) {
            finalContent += `---\n\n`;
          }
        });

        finalContent += `*Σύγκριση ${responses.length} διαφορετικών AI συστημάτων για την πιο ολοκληρωμένη απάντηση*`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: finalContent,
        role: 'assistant',
        timestamp: new Date(),
        aiType: 'ensemble'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('Σφάλμα στους AI βοηθούς');
      
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
      <DialogContent className="max-w-2xl max-h-[80vh] rounded-none flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00ffba]" />
            Triple AI Προπονητής
            {athleteName && (
              <span className="text-sm font-normal text-gray-600">
                για {athleteName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4 border rounded-none">
            <div className="space-y-4">
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
                          <Sparkles className="w-4 h-4" />
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
                            Triple AI
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
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Τα 3 AI σκέφτονται ταυτόχρονα...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2 p-4 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ρώτα τους 3 AI προπονητές για προπόνηση, διατροφή, ανάκαμψη..."
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

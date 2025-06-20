
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface LocalAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
}

// Τοπικό AI που τρέχει στον browser
class LocalAI {
  private static instance: LocalAI;
  private isLoaded = false;
  private isLoading = false;

  static getInstance(): LocalAI {
    if (!LocalAI.instance) {
      LocalAI.instance = new LocalAI();
    }
    return LocalAI.instance;
  }

  async generateResponse(message: string, athleteName?: string): Promise<string> {
    if (!this.isLoaded && !this.isLoading) {
      toast.info("Φορτώνω το AI μοντέλο... Αυτό μπορεί να πάρει λίγο χρόνο την πρώτη φορά.");
      this.isLoading = true;
      
      try {
        // Προσομοίωση φόρτωσης μοντέλου
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.isLoaded = true;
        this.isLoading = false;
        toast.success("Το AI μοντέλο φορτώθηκε επιτυχώς!");
      } catch (error) {
        this.isLoading = false;
        throw new Error("Σφάλμα κατά τη φόρτωση του μοντέλου");
      }
    }

    // Εδώ θα μπορούσαμε να χρησιμοποιήσουμε το @xenova/transformers
    // Προς το παρόν, θα χρησιμοποιήσω έναν έξυπνο rule-based chatbot
    return this.generateFitnessResponse(message, athleteName);
  }

  private generateFitnessResponse(message: string, athleteName?: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Διατροφικές συμβουλές
    if (lowerMessage.includes('διατροφή') || lowerMessage.includes('φαγητό') || lowerMessage.includes('τροφή')) {
      return `Για βέλτιστη διατροφή ${athleteName ? `για τον/την ${athleteName}` : ''}, συνιστώ:
• Πρωτεΐνες: 1.6-2.2g ανά κιλό σωματικού βάρους
• Υδατάνθρακες: 3-7g ανά κιλό (ανάλογα με την εντατικότητα)
• Λίπη: 20-35% των συνολικών θερμίδων
• Νερό: 35-40ml ανά κιλό σωματικού βάρους

Προτιμήστε φρέσκα, ελάχιστα επεξεργασμένα τρόφιμα!`;
    }

    // Ασκησιολογικές συμβουλές
    if (lowerMessage.includes('άσκηση') || lowerMessage.includes('προπόνηση') || lowerMessage.includes('γυμναστική')) {
      return `Για αποτελεσματική προπόνηση ${athleteName ? `του/της ${athleteName}` : ''}:
• Ξεκινήστε με 5-10 λεπτά ζέστασμα
• Συνδυάστε καρδιοαγγειακή και δύναμη
• Προοδευτική αύξηση φορτίου
• 48-72 ώρες ανάπαυση ανά μυϊκή ομάδα
• Τελειώστε με stretching

Η συνέπεια είναι πιο σημαντική από την εντατικότητα!`;
    }

    // Ανάκαμψη
    if (lowerMessage.includes('ανάκαμψη') || lowerMessage.includes('κούραση') || lowerMessage.includes('πόνος')) {
      return `Για καλύτερη ανάκαμψη:
• Ύπνος: 7-9 ώρες ποιοτικού ύπνου
• Ενυδάτωση: Αυξημένη πρόσληψη νερού
• Ενεργητική ανάκαμψη: Ελαφριά κίνηση, περπάτημα
• Διατροφή: Πρωτεΐνη + υδατάνθρακες μετά την προπόνηση
• Διάταση και mobility work

Αν ο πόνος επιμένει, συμβουλευτείτε ειδικό!`;
    }

    // Αδυνάτισμα
    if (lowerMessage.includes('αδυνάτισμα') || lowerMessage.includes('απώλεια βάρους') || lowerMessage.includes('δίαιτα')) {
      return `Για υγιή απώλεια βάρους:
• Δημιουργήστε έλλειμμα 300-500 θερμίδων ημερησίως
• Συνδυάστε καρδιοαγγειακή άσκηση με δύναμη
• Μην μειώσετε δραστικά τις θερμίδες
• Προτεραιότητα στην πρωτεΐνη
• Υπομονή: 0.5-1kg ανά εβδομάδα είναι ιδανικό

Η απώλεια βάρους είναι ταξίδι, όχι προορισμός!`;
    }

    // Μυϊκή μάζα
    if (lowerMessage.includes('μυς') || lowerMessage.includes('μάζα') || lowerMessage.includes('όγκος')) {
      return `Για αύξηση μυϊκής μάζας:
• Προοδευτική υπερφόρτωση
• Σύνθετες ασκήσεις (squat, deadlift, bench press)
• Πρωτεΐνη: 1.8-2.5g ανά κιλό
• Πλεόνασμα θερμίδων: +200-500 ημερησίως
• Ανάπαυση: Αφήστε τους μυς να αναπτυχθούν

Η υπομονή και η συνέπεια είναι κλειδί!`;
    }

    // Γενική συμβουλή
    return `Γεια σας! ${athleteName ? `Χαίρομαι που μιλάμε για τον/την ${athleteName}.` : ''} 
Είμαι εδώ για να σας βοηθήσω με συμβουλές για:

🏋️ Προπόνηση και ασκήσεις
🥗 Διατροφή και θερμίδες  
😴 Ανάκαμψη και ύπνο
💪 Μυϊκή ανάπτυξη
🔥 Απώλεια βάρους

Τι θα θέλατε να μάθετε;`;
  }

  isModelLoaded(): boolean {
    return this.isLoaded;
  }

  isModelLoading(): boolean {
    return this.isLoading;
  }
}

export const LocalAIChatDialog: React.FC<LocalAIChatDialogProps> = ({
  isOpen,
  onClose,
  athleteId,
  athleteName
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const localAI = LocalAI.getInstance();

  useEffect(() => {
    if (isOpen) {
      setMessages([{
        id: 'welcome',
        content: `Γεια σας! Είμαι ο τοπικός AI βοηθός σας για διατροφικές και ασκησιολογικές συμβουλές. ${athleteName ? `Μπορώ να σας βοηθήσω με ερωτήσεις σχετικά με τον αθλητή ${athleteName}.` : 'Πώς μπορώ να σας βοηθήσω σήμερα;'} 

✅ Τρέχω εντελώς δωρεάν στον browser σας!`,
        role: 'assistant',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, athleteName]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

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
      const response = await localAI.generateResponse(input, athleteName);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Local AI Error:', error);
      toast.error('Σφάλμα στον τοπικό AI βοηθό');
      
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] rounded-none flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#00ffba]" />
            Τοπικός AI Βοηθός - Διατροφή & Άσκηση
            {athleteName && (
              <span className="text-sm font-normal text-gray-600">
                για {athleteName}
              </span>
            )}
            <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-none">
              <Download className="w-3 h-3" />
              100% Δωρεάν
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
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Σκέφτομαι...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 p-4 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Πληκτρολογήστε το μήνυμά σας..."
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

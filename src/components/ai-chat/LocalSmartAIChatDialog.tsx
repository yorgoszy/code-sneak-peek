
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brain, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LocalSmartAI } from './services/LocalSmartAI';
import { SmartChatMessages } from './components/SmartChatMessages';
import { SmartChatInput } from './components/SmartChatInput';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface LocalSmartAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
}

export const LocalSmartAIChatDialog: React.FC<LocalSmartAIChatDialogProps> = ({
  isOpen,
  onClose,
  athleteId,
  athleteName
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);  
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localAI = LocalSmartAI.getInstance();

  // Initialize AI when dialog opens
  useEffect(() => {
    if (isOpen && athleteId && !hasInitialized) {
      initializeAI();
    }
  }, [isOpen, athleteId, hasInitialized]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }, [messages, isLoading]);

  const initializeAI = async () => {
    setIsInitializing(true);
    try {
      await localAI.loadAthleteData(athleteId!);
      
      // Add welcome message only once
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Γεια σου ${athleteName}! 👋

Είμαι ο **RID AI**, ο προσωπικός σου AI προπονητής! 🤖

Μόλις φόρτωσα όλα τα δεδομένα σου:
📊 Προγράμματα προπονήσεων
💪 Τεστ δύναμης και μετρήσεις  
🏃 Προηγούμενες προπονήσεις
📈 Στατιστικά προόδου

**✅ Τρέχω 100% δωρεάν στον browser σου!**
**🔒 Κανένα API key δεν χρειάζεται**
**📊 Έχω πλήρη πρόσβαση στα δεδομένα σου**
**🧠 Μαθαίνω από κάθε συνομιλία μας**

Μπορώ να σε βοηθήσω με:
• Ανάλυση προόδου
• Διατροφικές συμβουλές
• Προτάσεις προπόνησης
• Αξιολόγηση τεστ
• Συμβουλές ανάκαμψης

Τι θα θέλες να μάθεις πρώτα;`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      setHasInitialized(true);
    } catch (error) {
      console.error('Σφάλμα αρχικοποίησης AI:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isInitializing) return;

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
      toast.error('Σφάλμα στον RID AI');
      
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

  // Reset state when dialog closes
  const handleClose = () => {
    setHasInitialized(false);
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setIsInitializing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[85vh] rounded-none flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-[#00ffba]" />
            <span className="text-lg font-semibold">RID AI - Δωρεάν AI Προπονητής</span>
            {athleteName && (
              <span className="text-base font-normal text-gray-600">
                για {athleteName}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-3 py-1 rounded-none">
                <Zap className="w-3 h-3" />
                <span>100% Δωρεάν</span>
              </div>
              <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-none">
                <Brain className="w-3 h-3" />
                <span>Τοπικό AI</span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {isInitializing ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#00ffba]" />
              <span className="ml-3 text-lg">Φορτώνω τα δεδομένα σου...</span>
            </div>
          ) : (
            <>
              <SmartChatMessages
                messages={messages}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
              />

              <div className="flex-shrink-0">
                <SmartChatInput
                  input={input}
                  setInput={setInput}
                  onSend={sendMessage}
                  onKeyPress={handleKeyPress}
                  isLoading={isLoading}
                  isInitializing={isInitializing}
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

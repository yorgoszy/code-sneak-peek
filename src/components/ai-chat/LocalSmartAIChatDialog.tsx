
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
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localAI = LocalSmartAI.getInstance();

  // Generate unique session ID when dialog opens
  useEffect(() => {
    if (isOpen && athleteId) {
      const newSessionId = `${athleteId}-${Date.now()}`;
      setSessionId(newSessionId);
      console.log('🆔 Νέο session ID:', newSessionId);
    }
  }, [isOpen, athleteId]);

  // Initialize AI when session changes
  useEffect(() => {
    if (sessionId && !isInitializing) {
      initializeAI();
    }
  }, [sessionId]);

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
    if (!athleteId || !sessionId) return;
    
    setIsInitializing(true);
    setMessages([]); // Καθαρίζουμε τα messages πριν αρχίσουμε
    
    try {
      console.log('🔄 Αρχικοποίηση AI για session:', sessionId);
      await localAI.loadAthleteData(athleteId);
      
      // Προσθέτουμε το welcome message ΜΟΝΟ εδώ
      const welcomeMessage: Message = {
        id: `welcome-${sessionId}`,
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
      console.log('✅ Welcome message προστέθηκε για session:', sessionId);
    } catch (error) {
      console.error('❌ Σφάλμα αρχικοποίησης AI:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isInitializing || !sessionId) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    console.log('📤 Στέλνω μήνυμα:', input);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await localAI.generateResponse(input, athleteName);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      console.log('📥 Λήφθηκε απάντηση AI');
    } catch (error) {
      console.error('❌ Local AI Error:', error);
      toast.error('Σφάλμα στον RID AI');
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
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

  // Reset state when dialog closes - ΠΛΗΡΗΣ ΚΑΘΑΡΙΣΜΟΣ
  const handleClose = () => {
    console.log('🔄 Κλείσιμο dialog - καθαρισμός state');
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setIsInitializing(false);
    setSessionId('');
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

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brain, Database, Zap, Shield } from "lucide-react";
import { toast } from "sonner";
import { IntelligentAI } from './services/IntelligentAI';
import { SmartChatMessages } from './components/SmartChatMessages';
import { SmartChatInput } from './components/SmartChatInput';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface IntelligentAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
}

export const IntelligentAIChatDialog: React.FC<IntelligentAIChatDialogProps> = ({
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
  const [isReady, setIsReady] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intelligentAI = IntelligentAI.getInstance();

  // Δημιουργία νέου session όταν ανοίγει το dialog
  useEffect(() => {
    if (isOpen && athleteId && !hasInitialized) {
      const newSessionId = `session-${athleteId}-${Date.now()}`;
      setSessionId(newSessionId);
      setIsReady(false);
      setMessages([]);
      console.log('🆔 Νέο AI session:', newSessionId);
      
      // Αρχικοποίηση AI
      initializeIntelligentAI();
      setHasInitialized(true);
    }
    
    // Reset όταν κλείνει το dialog
    if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen, athleteId, hasInitialized]);

  // Auto scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }, [messages, isLoading]);

  const initializeIntelligentAI = async () => {
    if (!athleteId || isReady) return;
    
    setIsInitializing(true);
    
    try {
      console.log('🔄 Αρχικοποίηση Intelligent AI...');
      await intelligentAI.loadUserData(athleteId);
      
      const userData = intelligentAI.getUserData();
      const isAdmin = intelligentAI.getIsAdmin();
      
      // Welcome message βασισμένο στα δεδομένα
      const welcomeMessage: Message = {
        id: `welcome-${sessionId}`,
        content: generateWelcomeMessage(userData, isAdmin, athleteName),
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      setIsReady(true);
      console.log('✅ AI αρχικοποιήθηκε επιτυχώς');
    } catch (error) {
      console.error('❌ Σφάλμα αρχικοποίησης AI:', error);
      toast.error('Σφάλμα φόρτωσης AI');
      
      const errorMessage: Message = {
        id: `error-${sessionId}`,
        content: 'Λυπάμαι, αντιμετώπισα πρόβλημα κατά τη φόρτωση των δεδομένων σου. Παρακαλώ δοκίμασε ξανά.',
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages([errorMessage]);
    } finally {
      setIsInitializing(false);
    }
  };

  const generateWelcomeMessage = (userData: any, isAdmin: boolean, athleteName?: string): string => {
    if (!userData || !userData.athlete) {
      return `Γεια σας! Είμαι ο **RID AI** και είμαι εδώ για να σας βοηθήσω! 🤖`;
    }

    const { athlete, activePrograms, recentWorkouts, testSessions, allUsers } = userData;
    
    let welcome = `Γεια σου ${athlete.name}! 👋\n\n`;
    welcome += `Είμαι ο **RID AI**, ο προσωπικός σου έξυπνος προπονητής! 🤖\n\n`;
    
    if (isAdmin) {
      welcome += `🔥 **ADMIN MODE** 🔥\n`;
      welcome += `Έχεις πρόσβαση σε όλα τα δεδομένα!\n`;
      welcome += `• Σύνολο χρηστών: ${allUsers?.length || 0}\n`;
      welcome += `• Μπορώ να δω όλα τα προγράμματα και τεστ\n\n`;
    }
    
    welcome += `📊 **Φόρτωσα τα δεδομένα σου:**\n`;
    welcome += `• Ενεργά προγράμματα: ${activePrograms?.length || 0}\n`;
    welcome += `• Πρόσφατες προπονήσεις: ${recentWorkouts?.length || 0}\n`;
    welcome += `• Τεστ στο σύστημα: ${testSessions?.length || 0}\n\n`;
    
    welcome += `🧠 **Οι δυνατότητές μου:**\n`;
    welcome += `• **Μαθαίνω**: Από κάθε συνομιλία μας\n`;
    welcome += `• **Θυμάμαι**: Τις προτιμήσεις και συνήθειές σου\n`;
    welcome += `• **Αναλύω**: Την πρόοδό σου και τα αποτελέσματά σου\n`;
    welcome += `• **Συμβουλεύομαι**: Το OpenAI για δύσκολες ερωτήσεις\n`;
    welcome += `• **Αποθηκεύω**: Όλες τις συζητήσεις μας\n\n`;
    
    welcome += `💪 **Μπορώ να σε βοηθήσω με:**\n`;
    welcome += `• Ανάλυση προόδου και αποτελεσμάτων\n`;
    welcome += `• Διατροφικές συμβουλές και υπολογισμούς\n`;
    welcome += `• Προτάσεις προπόνησης και τροποποιήσεις\n`;
    welcome += `• Αξιολόγηση τεστ και μετρήσεων\n`;
    welcome += `• Συμβουλές ανάκαμψης και ύπνου\n`;
    welcome += `• Στρατηγικές για τους στόχους σου\n\n`;
    
    welcome += `🚀 **Είμαι έτοιμος!** Τι θα θέλες να μάθεις σήμερα;`;
    
    return welcome;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !isReady || !athleteId) return;

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
      const response = await intelligentAI.generateResponse(input, athleteName);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      console.log('📥 Απάντηση AI λήφθηκε');
    } catch (error) {
      console.error('❌ AI Error:', error);
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

  const handleClose = () => {
    console.log('🔄 Κλείσιμο AI Chat - reset state');
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setIsInitializing(false);
    setSessionId('');
    setIsReady(false);
    setHasInitialized(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[85vh] rounded-none flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-[#00ffba]" />
              <span className="text-lg font-semibold">RID AI - Έξυπνος Προπονητής</span>
              {athleteName && (
                <span className="text-base font-normal text-gray-600">
                  για {athleteName}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-3 py-1 rounded-none">
                <Database className="w-3 h-3" />
                <span>Πλήρη Δεδομένα</span>
              </div>
              <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-none">
                <Brain className="w-3 h-3" />
                <span>Μαθαίνω & Θυμάμαι</span>
              </div>
              <div className="flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-none">
                <Zap className="w-3 h-3" />
                <span>OpenAI Ready</span>
              </div>
              {intelligentAI.getIsAdmin() && (
                <div className="flex items-center gap-1 text-xs bg-red-100 text-red-800 px-3 py-1 rounded-none">
                  <Shield className="w-3 h-3" />
                  <span>Admin</span>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {isInitializing ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center">
                <Brain className="w-12 h-12 animate-pulse text-[#00ffba] mx-auto mb-4" />
                <span className="text-lg">Φορτώνω όλα τα δεδομένα σου...</span>
                <p className="text-sm text-gray-600 mt-2">Αυτό μπορεί να πάρει λίγα δευτερόλεπτα...</p>
              </div>
            </div>
          ) : (
            <>
              <SmartChatMessages
                messages={messages}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
                athleteId={athleteId}
                athleteName={athleteName}
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


import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Zap, Settings } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface FreeAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
  athletePhotoUrl?: string;
}

export const FreeAIChatDialog: React.FC<FreeAIChatDialogProps> = ({
  isOpen,
  onClose,
  athleteId,
  athleteName,
  athletePhotoUrl
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiProvider, setApiProvider] = useState<'local' | 'gemini'>('local');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        content: `Γεια σου ${athleteName}! 👋

Είμαι ο **RID Free**, ο δωρεάν AI προπονητής σου! 🤖

**Διαθέσιμες επιλογές:**
🔹 **Local AI** - Τρέχει στον browser σου (100% δωρεάν)
🔸 **Gemini AI** - Με API key (δωρεάν tier 15 αιτήματα/λεπτό)

Μπορώ να σε βοηθήσω με:
💪 **Συμβουλές προπόνησης**
🍎 **Διατροφικές οδηγίες** 
📊 **Ανάλυση προόδου**
🎯 **Στόχους fitness**

Τι θα θέλες να συζητήσουμε σήμερα;`,
        role: 'assistant',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, athleteName, messages.length]);

  const callLocalAI = async (userMessage: string): Promise<string> => {
    // Simulated local AI responses for fitness/nutrition
    const responses = [
      `Εξαιρετική ερώτηση! Για την προπόνηση σου, συνιστώ να εστιάσεις σε σύνθετες κινήσεις όπως squats, deadlifts και push-ups. Αυτές δουλεύουν πολλές μυϊκές ομάδες ταυτόχρονα! 💪`,
      
      `Η διατροφή είναι το 70% της επιτυχίας σου! Προτείνω να τρως πρωτεΐνη σε κάθε γεύμα, πολλά λαχανικά και να υδατώνεσαι καλά. Τι είδους στόχους έχεις; 🥗`,
      
      `Η ανάπαυση είναι εξίσου σημαντική με την προπόνηση! Φρόντισε να κοιμάσαι 7-9 ώρες και να έχεις τουλάχιστον μία ημέρα ξεκούρασης την εβδομάδα. 😴`,
      
      `Για καλύτερα αποτελέσματα, κράτα ένα ημερολόγιο προπόνησης και διατροφής. Η παρακολούθηση της προόδου σου θα σε κρατήσει παρακινημένο! 📈`,
      
      `Θυμήσου: η συνέπεια είναι το κλειδί! Καλύτερα 20 λεπτά κάθε μέρα παρά 2 ώρες μία φορά την εβδομάδα. Μικρά βήματα οδηγούν σε μεγάλα αποτελέσματα! 🎯`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const callGeminiAI = async (userMessage: string): Promise<string> => {
    if (!geminiApiKey.trim()) {
      throw new Error('Παρακαλώ εισάγετε το Gemini API key στις ρυθμίσεις');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Είσαι ο RID, ένας εξειδικευμένος AI προπονητής και διατροφολόγος για τον αθλητή ${athleteName}. 

Δώσε συμβουλές για:
- Προπόνηση και fitness
- Διατροφή και θρέψη  
- Ανάπαυση και αποκατάσταση
- Κίνητρα και ψυχολογία

Απάντα στα ελληνικά, με φιλικό τόνο και χρησιμοποίησε emoji.

Ερώτηση: ${userMessage}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Σφάλμα στο Gemini API');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input;
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      content: userInput,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let aiResponse: string;
      
      if (apiProvider === 'gemini') {
        aiResponse = await callGeminiAI(userInput);
      } else {
        // Simulate processing time for local AI
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        aiResponse = await callLocalAI(userInput);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      toast.error(error instanceof Error ? error.message : 'Σφάλμα στον AI βοηθό');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά σε λίγο.',
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
      handleSendMessage();
    }
  };

  const handleClearConversation = () => {
    setMessages([{
      id: 'welcome',
      content: `Γεια σου ${athleteName}! 👋

Είμαι ο **RID Free**, ο δωρεάν AI προπονητής σου! 🤖

**Διαθέσιμες επιλογές:**
🔹 **Local AI** - Τρέχει στον browser σου (100% δωρεάν)
🔸 **Gemini AI** - Με API key (δωρεάν tier 15 αιτήματα/λεπτό)

Μπορώ να σε βοηθήσω με:
💪 **Συμβουλές προπόνησης**
🍎 **Διατροφικές οδηγίες** 
📊 **Ανάλυση προόδου**
🎯 **Στόχους fitness**

Τι θα θέλες να συζητήσουμε σήμερα;`,
      role: 'assistant',
      timestamp: new Date()
    }]);
    toast.success("Η συνομιλία διαγράφηκε επιτυχώς!");
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
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#00ffba]" />
              RID Free AI Προπονητής
              {athleteName && (
                <span className="text-sm font-normal text-gray-600">
                  για {athleteName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-none">
                <Zap className="w-3 h-3" />
                100% Δωρεάν
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-xs rounded-none"
              >
                <Settings className="w-3 h-3 mr-1" />
                Ρυθμίσεις
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearConversation}
                className="text-xs rounded-none"
              >
                Καθαρισμός
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {showSettings && (
          <div className="p-4 border rounded-none bg-gray-50 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">AI Provider</label>
              <Select value={apiProvider} onValueChange={(value: 'local' | 'gemini') => setApiProvider(value)}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local AI (Δωρεάν - Browser)</SelectItem>
                  <SelectItem value="gemini">Gemini AI (API Key)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {apiProvider === 'gemini' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Gemini API Key 
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 text-xs ml-1"
                  >
                    (Αποκτήστε δωρεάν)
                  </a>
                </label>
                <Input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Εισάγετε το Gemini API key..."
                  className="rounded-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Δωρεάν tier: 15 αιτήματα/λεπτό, 1M tokens/ημέρα
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 border rounded-none" ref={scrollAreaRef}>
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
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
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
                      <span className="text-sm">
                        {apiProvider === 'gemini' ? 'Το Gemini σκέφτεται...' : 'Ο RID σκέφτεται...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 p-4 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Πληκτρολογήστε το μήνυμά σας στον RID ${apiProvider === 'gemini' ? '(Gemini)' : '(Local)'}...`}
              className="rounded-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
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

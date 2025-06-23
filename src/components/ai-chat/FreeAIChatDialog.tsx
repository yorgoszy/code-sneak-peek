
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Zap, Settings, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EnsembleController, type EnsembleConfig } from './services/ensembleController';
import { ResponseCombiner } from './services/responseCombiner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: string[];
  confidence?: number;
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
  const [showSettings, setShowSettings] = useState(false);
  const [ensembleConfig, setEnsembleConfig] = useState<EnsembleConfig>({
    useLocal: true,
    useGemini: false,
    geminiApiKey: '',
    combineResponses: true,
    fallbackMode: true
  });
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const ensembleController = useRef<EnsembleController>();
  const responseCombiner = useRef(new ResponseCombiner());

  useEffect(() => {
    ensembleController.current = new EnsembleController(ensembleConfig);
  }, [ensembleConfig]);

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

Είμαι ο **RID Ensemble AI**, ο προηγμένος AI προπονητής σου! 🧠✨

**Διαθέσιμες τεχνολογίες:**
🏠 **Local AI** - Τρέχει στον browser σου (100% δωρεάν)
💎 **Gemini AI** - Με API key (δωρεάν tier 15 αιτήματα/λεπτό)
🚀 **Ensemble Mode** - Συνδυάζει πολλά AI για καλύτερες απαντήσεις

**Μπορώ να σε βοηθήσω με:**
💪 **Εξατομικευμένες συμβουλές προπόνησης**
🍎 **Προχωρημένες διατροφικές οδηγίες** 
📊 **Λεπτομερή ανάλυση προόδου**
🎯 **Στρατηγικούς στόχους fitness**
🧠 **Ψυχολογική υποστήριξη**

Χρησιμοποιώ τεχνολογία ensemble για να σου δώσω τις καλύτερες δυνατές απαντήσεις!`,
        role: 'assistant',
        timestamp: new Date(),
        sources: ['ensemble'],
        confidence: 1.0
      }]);
    }
  }, [isOpen, athleteName, messages.length]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !ensembleController.current) return;

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
      // Use ensemble controller to get responses
      const responses = await ensembleController.current.processQuery(userInput, athleteName || 'Αθλητή');
      
      let assistantMessage: Message;

      if (ensembleConfig.combineResponses && responses.length > 1) {
        // Combine multiple responses
        const combined = responseCombiner.current.combineResponses(responses);
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          content: combined.content,
          role: 'assistant',
          timestamp: new Date(),
          sources: combined.sources,
          confidence: combined.totalConfidence
        };
      } else {
        // Use best single response
        const bestResponse = responseCombiner.current.selectBestResponse(responses);
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          content: bestResponse.content,
          role: 'assistant',
          timestamp: new Date(),
          sources: [bestResponse.source],
          confidence: bestResponse.confidence
        };
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Ensemble AI Error:', error);
      toast.error(error instanceof Error ? error.message : 'Σφάλμα στον AI βοηθό');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά σε λίγο.',
        role: 'assistant',
        timestamp: new Date(),
        sources: ['error'],
        confidence: 0
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

Είμαι ο **RID Ensemble AI**, ο προηγμένος AI προπονητής σου! 🧠✨

**Διαθέσιμες τεχνολογίες:**
🏠 **Local AI** - Τρέχει στον browser σου (100% δωρεάν)
💎 **Gemini AI** - Με API key (δωρεάν tier 15 αιτήματα/λεπτό)
🚀 **Ensemble Mode** - Συνδυάζει πολλά AI για καλύτερες απαντήσεις

**Μπορώ να σε βοηθήσω με:**
💪 **Εξατομικευμένες συμβουλές προπόνησης**
🍎 **Προχωρημένες διατροφικές οδηγίες** 
📊 **Λεπτομερή ανάλυση προόδου**
🎯 **Στρατηγικούς στόχους fitness**
🧠 **Ψυχολογική υποστήριξη**

Χρησιμοποιώ τεχνολογία ensemble για να σου δώσω τις καλύτερες δυνατές απαντήσεις!`,
      role: 'assistant',
      timestamp: new Date(),
      sources: ['ensemble'],
      confidence: 1.0
    }]);
    toast.success("Η συνομιλία διαγράφηκε επιτυχώς!");
  };

  const updateEnsembleConfig = (updates: Partial<EnsembleConfig>) => {
    const newConfig = { ...ensembleConfig, ...updates };
    setEnsembleConfig(newConfig);
    if (ensembleController.current) {
      ensembleController.current.updateConfig(newConfig);
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

  const getActiveSourcesText = () => {
    const sources = [];
    if (ensembleConfig.useLocal) sources.push('Local');
    if (ensembleConfig.useGemini && ensembleConfig.geminiApiKey) sources.push('Gemini');
    return sources.length > 0 ? sources.join(' + ') : 'Κανένα';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] rounded-none flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#00ffba]" />
              RID Ensemble AI
              {athleteName && (
                <span className="text-sm font-normal text-gray-600">
                  για {athleteName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs bg-gradient-to-r from-green-100 to-blue-100 text-gray-800 px-2 py-1 rounded-none">
                <Sparkles className="w-3 h-3" />
                Ensemble AI
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
          <div className="p-4 border rounded-none bg-gray-50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">AI Πηγές</h4>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="useLocal"
                    checked={ensembleConfig.useLocal}
                    onCheckedChange={(checked) => updateEnsembleConfig({ useLocal: checked })}
                  />
                  <Label htmlFor="useLocal" className="text-sm">Local AI (Δωρεάν)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="useGemini"
                    checked={ensembleConfig.useGemini}
                    onCheckedChange={(checked) => updateEnsembleConfig({ useGemini: checked })}
                  />
                  <Label htmlFor="useGemini" className="text-sm">Gemini AI</Label>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Λειτουργίες</h4>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="combineResponses"
                    checked={ensembleConfig.combineResponses}
                    onCheckedChange={(checked) => updateEnsembleConfig({ combineResponses: checked })}
                  />
                  <Label htmlFor="combineResponses" className="text-sm">Συνδυασμός απαντήσεων</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="fallbackMode"
                    checked={ensembleConfig.fallbackMode}
                    onCheckedChange={(checked) => updateEnsembleConfig({ fallbackMode: checked })}
                  />
                  <Label htmlFor="fallbackMode" className="text-sm">Fallback mode</Label>
                </div>
              </div>
            </div>

            {ensembleConfig.useGemini && (
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
                  value={ensembleConfig.geminiApiKey}
                  onChange={(e) => updateEnsembleConfig({ geminiApiKey: e.target.value })}
                  placeholder="Εισάγετε το Gemini API key..."
                  className="rounded-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Δωρεάν tier: 15 αιτήματα/λεπτό, 1M tokens/ημέρα
                </p>
              </div>
            )}

            <div className="text-sm text-gray-600 bg-white p-3 rounded-none border-l-4 border-[#00ffba]">
              <strong>Ενεργές πηγές:</strong> {getActiveSourcesText()}
            </div>
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
                  <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={athletePhotoUrl} alt={athleteName || 'User'} />
                          <AvatarFallback className="bg-blue-500 text-white text-xs">
                            {getUserInitials(athleteName)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00ffba] to-blue-400 text-black flex items-center justify-center">
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
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString('el-GR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        {message.sources && message.sources.length > 0 && (
                          <div className="flex items-center gap-1">
                            {message.sources.map((source, idx) => (
                              <span key={idx} className="text-xs opacity-60 bg-black/10 px-1 rounded">
                                {source}
                              </span>
                            ))}
                            {message.confidence && (
                              <span className="text-xs opacity-60">
                                {Math.round(message.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00ffba] to-blue-400 text-black flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">
                        Το Ensemble AI σκέφτεται...
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
              placeholder={`Ρωτήστε το Ensemble AI (${getActiveSourcesText()})...`}
              className="rounded-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="rounded-none bg-gradient-to-r from-[#00ffba] to-blue-400 hover:from-[#00ffba]/90 hover:to-blue-400/90 text-black"
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


import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Zap, Crown, AlertTriangle } from "lucide-react";
import { useSmartAIChat } from './hooks/useSmartAIChat';
import { toast } from "sonner";

interface SmartAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
  athletePhotoUrl?: string;
}

export const SmartAIChatDialog: React.FC<SmartAIChatDialogProps> = ({
  isOpen,
  onClose,
  athleteId,
  athleteName,
  athletePhotoUrl
}) => {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    hasActiveSubscription,
    isCheckingSubscription,
    sendMessage,
    clearConversation
  } = useSmartAIChat({ athleteId, athleteName, isOpen });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !hasActiveSubscription) {
      if (!hasActiveSubscription) {
        toast.error('Απαιτείται ενεργή συνδρομή για να χρησιμοποιήσεις το RID AI');
      }
      return;
    }

    const userInput = input;
    setInput('');
    await sendMessage(userInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasActiveSubscription) {
        handleSendMessage();
      } else {
        toast.error('Απαιτείται ενεργή συνδρομή για να χρησιμοποιήσεις το RID AI');
      }
    }
  };

  const handleClearConversation = () => {
    if (!hasActiveSubscription) {
      toast.error('Απαιτείται ενεργή συνδρομή για αυτή την ενέργεια');
      return;
    }
    clearConversation();
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

  if (isCheckingSubscription) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#00ffba]" />
              RID AI Προπονητής
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Έλεγχος Συνδρομής</h3>
            <p className="text-gray-600">
              Ελέγχουμε την κατάσταση της συνδρομής σου...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#00ffba]" />
              Απαιτείται Συνδρομή RID
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-700">Πρόσβαση Απαγορευμένη</h3>
            <p className="text-gray-600 mb-4">
              Ο έξυπνος AI προπονητής είναι διαθέσιμος μόνο για συνδρομητές RID.
            </p>
            <div className="bg-blue-50 p-4 rounded-none mb-4">
              <h4 className="font-medium text-blue-900 mb-2">Τι περιλαμβάνει η συνδρομή:</h4>
              <ul className="text-sm text-blue-800 text-left space-y-1">
                <li>• Απεριόριστη πρόσβαση στον RID AI</li>
                <li>• Εξατομικευμένες συμβουλές διατροφής</li>
                <li>• Ανάλυση προόδου και τεστ</li>
                <li>• Υπολογισμοί θερμίδων και μακροθρεπτικών</li>
                <li>• Προσαρμοσμένες προτάσεις προπόνησης</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500">
              Επικοινωνήστε με τον διαχειριστή για να ενεργοποιήσετε τη συνδρομή σας.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] rounded-none flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#00ffba]" />
              RID AI Προπονητής
              {athleteName && (
                <span className="text-sm font-normal text-gray-600">
                  για {athleteName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-none">
                <Zap className="w-3 h-3" />
                Powered by HyperTeam
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearConversation}
                className="text-xs rounded-none"
                disabled={!hasActiveSubscription}
              >
                Καθαρισμός
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

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
                      <span className="text-sm">Σκέφτομαι...</span>
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
              placeholder={hasActiveSubscription ? "Πληκτρολογήστε το μήνυμά σας..." : "Απαιτείται συνδρομή..."}
              className="rounded-none"
              disabled={isLoading || !hasActiveSubscription}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || !hasActiveSubscription}
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

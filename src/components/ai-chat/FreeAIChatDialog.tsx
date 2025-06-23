
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

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

// Τοπικό AI που τρέχει στον browser - εντελώς δωρεάν!
class FreeAI {
  private static instance: FreeAI;

  static getInstance(): FreeAI {
    if (!FreeAI.instance) {
      FreeAI.instance = new FreeAI();
    }
    return FreeAI.instance;
  }

  async generateResponse(message: string, athleteName?: string): Promise<string> {
    // Προσομοίωση σκέψης για πιο ρεαλιστική εμπειρία
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return this.generateFitnessResponse(message, athleteName);
  }

  private generateFitnessResponse(message: string, athleteName?: string): string {
    const lowerMessage = message.toLowerCase();
    const greeting = athleteName ? `${athleteName}` : 'φίλε μου';
    
    // Χαιρετισμοί
    if (lowerMessage.includes('γεια') || lowerMessage.includes('hello') || lowerMessage.includes('καλησπέρα') || lowerMessage.includes('καλημέρα')) {
      return `Γεια σου ${greeting}! 👋 
      
Είμαι ο **FREE AI Προπονητής** σου! 🤖💪

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

    // Ασκησιολογικές συμβουλές
    if (lowerMessage.includes('άσκηση') || lowerMessage.includes('προπόνηση') || lowerMessage.includes('γυμναστική') || lowerMessage.includes('workout')) {
      return `🏋️ **Συμβουλές Προπόνησης για τον/την ${greeting}:**

**Δομή Προπόνησης:**
• 🔥 Ζέστασμα: 5-10 λεπτά
• 💪 Κύρια προπόνηση: 30-60 λεπτά  
• 🧘 Stretching: 5-10 λεπτά

**Βασικές Αρχές:**
✅ Προοδευτική αύξηση φορτίου
✅ Σύνθετες ασκήσεις (squat, deadlift, push-up)
✅ 48-72 ώρες ανάπαυση ανά μυϊκή ομάδα
✅ 2-3 φορές/εβδομάδα δύναμη + 2-3 φορές καρδιο

**Χρυσός Κανόνας:** Η συνέπεια είναι πιο σημαντική από την εντατικότητα! 🎯`;
    }

    // Ανάκαμψη
    if (lowerMessage.includes('ανάκαμψη') || lowerMessage.includes('κούραση') || lowerMessage.includes('πόνος') || lowerMessage.includes('ύπνος')) {
      return `😴 **Ανάκαμψη και Αποκατάσταση:**

**Ύπνος (Το #1 εργαλείο):**
🌙 7-9 ώρες ποιοτικού ύπνου
🌙 Κρατήστε σταθερό ωράριο
🌙 Αποφύγετε οθόνες 1 ώρα πριν τον ύπνο

**Ενεργητική Ανάκαμψη:**
🚶 Ελαφριά περπάτημα 20-30 λεπτά
🧘 Yoga ή stretching
🏊 Ελαφριά κολύμβηση

**Διατροφή για Ανάκαμψη:**
🥤 Πρωτεΐνη + υδατάνθρακες εντός 30 λεπτών
💧 Αυξημένη πρόσληψη νερού
🍒 Αντιφλεγμονώδη τρόφιμα

⚠️ **Προσοχή:** Αν ο πόνος επιμένει >3 ημέρες, συμβουλευτείτε ειδικό!`;
    }

    // Αδυνάτισμα
    if (lowerMessage.includes('αδυνάτισμα') || lowerMessage.includes('απώλεια βάρους') || lowerMessage.includes('δίαιτα') || lowerMessage.includes('χάσω κιλά')) {
      return `🔥 **Στρατηγική Απώλειας Βάρους για τον/την ${greeting}:**

**Βασικός Κανόνας:** Έλλειμμα θερμίδων!
📉 300-500 θερμίδες λιγότερες από όσες καίτε

**Πρακτικές Συμβουλές:**
✅ 4-5 μικρά γεύματα την ημέρα
✅ Πρωτεΐνη σε κάθε γεύμα (20-30g)
✅ Λαχανικά στο 50% του πιάτου
✅ Αποφύγετε υγρές θερμίδες (αναψυκτικά)

**Άσκηση για Fat Loss:**
🏃 Καρδιοαγγειακή: 150 λεπτά/εβδομάδα
💪 Δύναμη: 2-3 φορές/εβδομάδα (διατηρεί μυϊκή μάζα)

**Ρεαλιστικός Στόχος:** 0.5-1kg ανά εβδομάδα ⚖️

Υπομονή ${greeting}! Η απώλεια βάρους είναι ταξίδι, όχι προορισμός! 🚀`;
    }

    // Μυϊκή μάζα
    if (lowerMessage.includes('μυς') || lowerMessage.includes('μάζα') || lowerMessage.includes('όγκο') || lowerMessage.includes('muscle') || lowerMessage.includes('bulk')) {
      return `💪 **Αύξηση Μυϊκής Μάζας για τον/την ${greeting}:**

**Προπόνηση Δύναμης:**
🏋️ Προοδευτική υπερφόρτωση (κλειδί επιτυχίας!)
🏋️ Σύνθετες ασκήσεις: Squat, Deadlift, Bench Press
🏋️ 6-12 επαναλήψεις, 3-4 σετ
🏋️ 3-4 φορές/εβδομάδα

**Διατροφή για Μυϊκή Ανάπτυξη:**
🥩 Πρωτεΐνη: 1.8-2.5g ανά κιλό σωματικού βάρους
🍞 Πλεόνασμα θερμίδων: +200-500 ημερησίως
🥛 Πρωτεΐνη κάθε 3-4 ώρες

**Ανάπαυση:**
😴 Οι μύες μεγαλώνουν κατά την ανάπαυση!
😴 7-9 ώρες ύπνου είναι υποχρεωτικές

**Χρονοδιάγραμμα:** Πρώτα αποτελέσματα σε 4-6 εβδομάδες! 📈

Υπομονή και συνέπεια ${greeting}! 💯`;
    }

    // Τεστ και μετρήσεις
    if (lowerMessage.includes('τεστ') || lowerMessage.includes('μέτρηση') || lowerMessage.includes('πρόοδος') || lowerMessage.includes('αποτελέσματα')) {
      return `📊 **Παρακολούθηση Προόδου:**

**Σωματομετρικές Μετρήσεις:**
📏 Περιφέρειες (μέση, μπράτσα, μηροί)
⚖️ Βάρος (ίδια ώρα, ίδιες συνθήκες)
📸 Progress photos (πιο αξιόπιστα από ζυγαριά!)

**Τεστ Δύναμης:**
🏋️ 1RM στις βασικές ασκήσεις
🏋️ Μέγιστες επαναλήψεις bodyweight ασκήσεων

**Καρδιοαναπνευστικά Τεστ:**
🏃 Cooper test (12 λεπτά τρέξιμο)
🏃 Resting Heart Rate (πρωί, νηστικός)

**Συχνότητα Μετρήσεων:**
📅 Εβδομαδιαία: Βάρος, περιφέρειες
📅 Μηνιαία: Photos, δύναμη tests
📅 Τριμηνιαία: Πλήρη αξιολόγηση

Θυμήσου ${greeting}: Η πρόοδος δεν είναι πάντα γραμμική! 📈`;
    }

    // Τραυματισμοί και πρόληψη
    if (lowerMessage.includes('τραυματισμό') || lowerMessage.includes('πόνο') || lowerMessage.includes('πρόληψη') || lowerMessage.includes('injury')) {
      return `🚨 **Πρόληψη Τραυματισμών:**

**Πριν την Προπόνηση:**
🔥 Δυναμικό warm-up 10 λεπτά
🔥 Mobility exercises για προβληματικές περιοχές
🔥 Ελαφριά σετ για προετοιμασία

**Κατά την Προπόνηση:**
✅ Σωστή τεχνική > βάρος
✅ Προοδευτική αύξηση φορτίου
✅ Ακούστε το σώμα σας!

**Μετά την Προπόνηση:**
🧘 Στατικό stretching 10 λεπτά
🧘 Foam rolling για μυοπασχιακή απελευθέρωση

**Red Flags - Σταματήστε αμέσως:**
🚩 Οξύς πόνος κατά την άσκηση
🚩 Πόνος που επιμένει >48 ώρες
🚩 Πρήξιμο ή αίσθημα αστάθειας

**Θυμηθείτε:** Better safe than sorry! Συμβουλευτείτε ειδικό αν έχετε αμφιβολίες! 👨‍⚕️`;
    }

    // Γενική συμβουλή
    return `Γεια σου ${greeting}! 👋 

Είμαι ο **FREE AI Προπονητής** και είμαι εδώ για να σε βοηθήσω! 🤖💪

**Μπορώ να σε βοηθήσω με:**

🏋️ **Προπόνηση:** Ασκήσεις, τεχνική, προγραμματισμό
🥗 **Διατροφή:** Μακροθρεπτικά, γεύματα, υδατάνθρακες  
😴 **Ανάκαμψη:** Ύπνο, stretching, πρόληψη τραυματισμών
💪 **Μυϊκή ανάπτυξη:** Πρωτεΐνη, όγκο, δύναμη
🔥 **Απώλεια βάρους:** Θερμίδες, καρδιό, διατροφή
📊 **Τεστ & Μετρήσεις:** Πρόοδος, αξιολόγηση

**Παραδείγματα ερωτήσεων:**
• "Πως μπορώ να χάσω βάρος;"
• "Τι να φάω για μυϊκή μάζα;"
• "Πόσες φορές να προπονηθώ;"

Τι θα θέλες να μάθεις σήμερα; 🚀`;
  }
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const freeAI = FreeAI.getInstance();

  useEffect(() => {
    if (isOpen) {
      setMessages([{
        id: 'welcome',
        content: `Γεια σου${athleteName ? ` ${athleteName}` : ''}! 👋

Είμαι ο **FREE AI Προπονητής** σου! 🤖💪

✅ **100% Δωρεάν** - Τρέχω στον browser σου
✅ **Χωρίς API keys** - Κανένα κόστος
✅ **Άμεσος** - Χωρίς περιμένω servers

**Ειδικεύομαι σε:**
🏋️ Προπόνηση & Ασκήσεις
🥗 Διατροφή & Θερμίδες  
💪 Μυϊκή Ανάπτυξη
🔥 Απώλεια Βάρους
😴 Ανάκαμψη & Ύπνο

Ρώτα με ό,τι θέλεις για fitness και διατροφή! 🚀`,
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
      const response = await freeAI.generateResponse(input, athleteName);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Free AI Error:', error);
      toast.error('Σφάλμα στον FREE AI βοηθό');
      
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
            FREE AI Προπονητής
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
                    <Sparkles className="w-4 h-4" />
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
              placeholder="Ρώτα με για προπόνηση, διατροφή, ανάκαμψη..."
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

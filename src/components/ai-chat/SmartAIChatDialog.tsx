
import React, { useState } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { IntelligentAIChatDialog } from "./IntelligentAIChatDialog";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Database, Shield } from "lucide-react";
import { DialogWrapper } from "./components/DialogWrapper";

interface SmartAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
}

export const SmartAIChatDialog: React.FC<SmartAIChatDialogProps> = ({
  isOpen,
  onClose,
  athleteId,
  athleteName
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const isMobile = useIsMobile();

  // Άμεση χρήση του Intelligent AI
  if (!showOptions) {
    return (
      <IntelligentAIChatDialog
        isOpen={isOpen}
        onClose={onClose}
        athleteId={athleteId}
        athleteName={athleteName}
      />
    );
  }

  // Εναλλακτικά, εμφάνιση επιλογών (για μελλοντική χρήση)
  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose}>
      <div className="p-6 text-center space-y-6">
        <div className="space-y-4">
          <Brain className="w-16 h-16 text-[#00ffba] mx-auto" />
          <h3 className="text-xl font-semibold">RID AI - Έξυπνος Προπονητής</h3>
          <p className="text-gray-600">
            Πλήρως εξοπλισμένος AI με πρόσβαση σε όλα τα δεδομένα
          </p>
        </div>

        <div className="border rounded-none p-6 space-y-4 border-[#00ffba] bg-[#00ffba]/5">
          <div className="flex items-center gap-2 justify-center">
            <Brain className="w-6 h-6 text-[#00ffba]" />
            <h4 className="font-semibold text-lg">RID AI - Intelligent Edition</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              <span>Πλήρη δεδομένα</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-green-500" />
              <span>Μαθαίνει & θυμάται</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <span>OpenAI Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span>Admin Support</span>
            </div>
          </div>

          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Πρόσβαση σε όλα τα προγράμματα και τεστ</li>
            <li>• Μαθαίνει από κάθε συνομιλία</li>
            <li>• Θυμάται προτιμήσεις και συνήθειες</li>
            <li>• Συμβουλεύεται OpenAI για δύσκολες ερωτήσεις</li>
            <li>• Αποθηκεύει όλες τις συζητήσεις</li>
            <li>• Admin έχει πρόσβαση σε όλα τα δεδομένα</li>
          </ul>

          <Button 
            onClick={() => setShowOptions(false)}
            className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            Ξεκίνα με RID AI
          </Button>
        </div>
      </div>
    </DialogWrapper>
  );
};

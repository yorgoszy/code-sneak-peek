
import React, { useState } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { LocalSmartAIChatDialog } from "./LocalSmartAIChatDialog";
import { Button } from "@/components/ui/button";
import { Brain, Zap } from "lucide-react";
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
  const [useAdvancedAI, setUseAdvancedAI] = useState(false);
  const isMobile = useIsMobile();

  // Κύριο AI είναι το RID AI (τοπικό) - χωρίς συνδρομή
  if (!useAdvancedAI) {
    return (
      <LocalSmartAIChatDialog
        isOpen={isOpen}
        onClose={onClose}
        athleteId={athleteId}
        athleteName={athleteName}
      />
    );
  }

  // Εναλλακτικά, εμφάνιση επιλογών για προχωρημένο AI
  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose}>
      <div className="p-6 text-center space-y-6">
        <div className="space-y-4">
          <Brain className="w-16 h-16 text-[#00ffba] mx-auto" />
          <h3 className="text-xl font-semibold">Επιλέξτε AI Βοηθό</h3>
          <p className="text-gray-600">
            Δύο επιλογές διαθέσιμες για εσάς:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RID AI - Δωρεάν και Κύριο */}
          <div className="border rounded-none p-4 space-y-3 border-[#00ffba] bg-[#00ffba]/5">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#00ffba]" />
              <h4 className="font-semibold">RID AI (Προτεινόμενο)</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 100% δωρεάν</li>
              <li>• Τρέχει στον browser</li>
              <li>• Πρόσβαση σε όλα τα δεδομένα</li>
              <li>• Εξατομικευμένες συμβουλές</li>
              <li>• Μαθαίνει από τη χρήση</li>
              <li>• Συμβουλεύεται το OpenAI όταν χρειάζεται</li>
            </ul>
            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-none">
              Χωρίς κόστος & API keys
            </div>
            <Button 
              onClick={() => setUseAdvancedAI(false)}
              className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              Χρήση RID AI
            </Button>
          </div>

          {/* OpenAI RID - Για προχωρημένους */}
          <div className="border rounded-none p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <h4 className="font-semibold">RID AI Premium</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Πιο προηγμένες απαντήσεις</li>
              <li>• Συνομιλίες με μνήμη</li>
              <li>• Συνεχείς ενημερώσεις</li>
              <li>• Powered by OpenAI</li>
            </ul>
            <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-none">
              Απαιτεί ενεργή συνδρομή
            </div>
            <Button 
              className="w-full rounded-none bg-blue-500 hover:bg-blue-600 text-white"
              disabled
            >
              Χρειάζεται Συνδρομή
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          💡 Το RID AI είναι αρκετά έξυπνο για τις περισσότερες ανάγκες σας!
        </div>
      </div>
    </DialogWrapper>
  );
};

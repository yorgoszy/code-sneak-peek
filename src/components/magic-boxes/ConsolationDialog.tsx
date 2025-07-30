import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

interface ConsolationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsolationDialog: React.FC<ConsolationDialogProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-none bg-white shadow-2xl border-0">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Gift className="w-6 h-6 text-[#00ffba]" />
            Δωρεάν Επίσκεψη!
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 text-center">
          <p className="text-gray-700 text-base leading-relaxed mb-6">
            Λυπούμαστε που δεν κερδίσατε σήμερα, αλλά δεν φεύγετε με άδεια χέρια! 
            Σας προσφέρουμε μία δωρεάν επίσκεψη στο γυμναστήριό μας ως ένδειξη εκτίμησης.
            <br /><br />
            Κάντε booking την ώρα της επιλογής σας και ανακαλύψτε όλες τις υπηρεσίες μας!
          </p>
          
          <Button 
            onClick={onClose}
            className="rounded-none px-8 py-3 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black font-medium transition-colors"
          >
            Κλείσιμο
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RpeScoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rpeScore: number) => void;
}

const RPE_DESCRIPTIONS: Record<number, string> = {
  1: 'Πολύ εύκολο',
  2: 'Εύκολο',
  3: 'Σχετικά εύκολο',
  4: 'Μέτριο',
  5: 'Λίγο δύσκολο',
  6: 'Δύσκολο',
  7: 'Πολύ δύσκολο',
  8: 'Εξαιρετικά δύσκολο',
  9: 'Σχεδόν μέγιστο',
  10: 'Μέγιστη προσπάθεια'
};

export const RpeScoreDialog: React.FC<RpeScoreDialogProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [selectedRpe, setSelectedRpe] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selectedRpe) {
      onSubmit(selectedRpe);
      setSelectedRpe(null);
    }
  };

  const handleClose = () => {
    setSelectedRpe(null);
    onClose();
  };

  const getColorForRpe = (rpe: number) => {
    if (rpe <= 3) return 'bg-green-500 hover:bg-green-600';
    if (rpe <= 5) return 'bg-yellow-500 hover:bg-yellow-600';
    if (rpe <= 7) return 'bg-orange-500 hover:bg-orange-600';
    return 'bg-red-500 hover:bg-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="text-center">Πόσο δύσκολη ήταν η προπόνηση;</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 text-center mb-4">
            Βαθμολόγησε την προσπάθειά σου (RPE 1-10)
          </p>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
              <button
                key={rpe}
                onClick={() => setSelectedRpe(rpe)}
                className={cn(
                  "aspect-square flex items-center justify-center text-lg font-bold rounded-none transition-all",
                  selectedRpe === rpe 
                    ? `${getColorForRpe(rpe)} text-white ring-2 ring-offset-2 ring-black` 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                {rpe}
              </button>
            ))}
          </div>

          {selectedRpe && (
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-gray-900">
                RPE {selectedRpe}: {RPE_DESCRIPTIONS[selectedRpe]}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="rounded-none flex-1"
          >
            Ακύρωση
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedRpe}
            className="rounded-none flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            Ολοκλήρωση
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

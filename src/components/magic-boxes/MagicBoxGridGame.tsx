import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ConsolationDialog } from './ConsolationDialog';

interface MagicBoxGridGameProps {
  isOpen: boolean;
  onClose: () => void;
  magicBox: any;
  targetUserId?: string;
  onPrizeWon?: (prize: any) => void;
}

interface BoxPosition {
  id: number;
  hasPrize: boolean;
  prizeId?: string;
  isOpened: boolean;
  isWinning?: boolean;
}

export const MagicBoxGridGame: React.FC<MagicBoxGridGameProps> = ({
  isOpen,
  onClose,
  magicBox,
  targetUserId,
  onPrizeWon
}) => {
  const [boxes, setBoxes] = useState<BoxPosition[]>([]);
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wonPrize, setWonPrize] = useState<any>(null);
  const [showConsolationDialog, setShowConsolationDialog] = useState(false);

  const GRID_SIZE = 100; // 10x10 grid

  // Για τώρα χρησιμοποιούμε mock prizes
  const mockPrizes = [
    { id: '1', name: 'Δωρεάν Προπόνηση', description: 'Μια δωρεάν προπόνηση στο γυμναστήριο' },
    { id: '2', name: 'Protein Shake', description: 'Δωρεάν protein shake' },
    { id: '3', name: 'Gym Towel', description: 'Πετσέτα γυμναστηρίου' },
    { id: '4', name: '10% Έκπτωση', description: '10% έκπτωση στην επόμενη συνδρομή' },
    { id: '5', name: 'Personal Training', description: 'Μια δωρεάν συνεδρία personal training' }
  ];

  const initializeGame = useCallback(() => {
    // Δημιουργία κουτιών
    const newBoxes: BoxPosition[] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      newBoxes.push({
        id: i,
        hasPrize: false,
        isOpened: false
      });
    }

    // Τοποθέτηση βραβείων σε τυχαίες θέσεις
    // Μπορούμε να έχουμε 1-3 βραβεία
    const numberOfPrizes = Math.min(Math.floor(Math.random() * 3) + 1, mockPrizes.length);
    const usedPositions = new Set<number>();

    for (let i = 0; i < numberOfPrizes; i++) {
      let position: number;
      do {
        position = Math.floor(Math.random() * GRID_SIZE);
      } while (usedPositions.has(position));
      
      usedPositions.add(position);
      const randomPrize = mockPrizes[Math.floor(Math.random() * mockPrizes.length)];
      
      newBoxes[position] = {
        ...newBoxes[position],
        hasPrize: true,
        prizeId: randomPrize.id
      };
    }

    setBoxes(newBoxes);
    setGameStarted(true);
    setGameCompleted(false);
    setSelectedBox(null);
    setWonPrize(null);
  }, []);

  const handleBoxClick = useCallback(async (boxId: number) => {
    if (!gameStarted || gameCompleted || selectedBox !== null || loading) return;

    setSelectedBox(boxId);
    setLoading(true);

    try {
      const clickedBox = boxes[boxId];
      
      // Ενημέρωση κουτιού ως ανοιγμένο
      const updatedBoxes = boxes.map(box => 
        box.id === boxId ? { ...box, isOpened: true, isWinning: box.hasPrize } : box
      );
      setBoxes(updatedBoxes);

      // Πάντα καλούμε το edge function για να μαρκάρουμε το κουτί ως ανοιγμένο
      try {
        const { data: result, error: openError } = await supabase.functions.invoke('magic-box-open', {
          body: {
            magic_box_id: magicBox.id,
            ...(targetUserId && { target_user_id: targetUserId })
          }
        });

        if (openError) {
          console.error('Error opening magic box:', openError);
          toast.error('Σφάλμα κατά το άνοιγμα του κουτιού');
          return;
        }

        // Έλεγχος αν κέρδισε πραγματικό βραβείο (όχι "nothing")
        if (result?.prize_type && result.prize_type !== 'nothing') {
          // Κέρδισε πραγματικό βραβείο!
          const prize = {
            id: result.prize_id || 'unknown',
            name: result.prize_name || 'Βραβείο',
            description: result.prize_description || '',
            type: result.prize_type
          };
          setWonPrize(prize);
          toast.success(`Συγχαρητήρια! Κερδίσατε: ${prize.name}!`);
          onPrizeWon?.(prize);
        } else {
          // Δεν κέρδισε - δείχνουμε το consolation dialog
          setShowConsolationDialog(true);
        }
      } catch (err) {
        console.error('Function call failed:', err);
        toast.error('Σφάλμα κατά το άνοιγμα του κουτιού');
        return;
      }

      setGameCompleted(true);
    } catch (error) {
      console.error('Error handling box click:', error);
      toast.error('Σφάλμα κατά το άνοιγμα του κουτιού');
    } finally {
      setLoading(false);
    }
  }, [gameStarted, gameCompleted, selectedBox, loading, boxes, mockPrizes, magicBox?.id, onPrizeWon]);

  const resetGame = useCallback(() => {
    setBoxes([]);
    setGameStarted(false);
    setGameCompleted(false);
    setSelectedBox(null);
    setWonPrize(null);
  }, []);

  const handleClose = useCallback(() => {
    resetGame();
    onClose();
  }, [resetGame, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#00ffba]" />
              <span>Μαγικό Κουτί - Παιχνίδι Τύχης</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="rounded-none"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!gameStarted ? (
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-[#00ffba]/20 to-transparent p-6 rounded-none border border-[#00ffba]/30">
                <h3 className="text-xl font-semibold mb-2">Καλώς ήρθατε στο Μαγικό Κουτί!</h3>
                <p className="text-gray-600 mb-4">
                  Επιλέξτε ένα από τα {GRID_SIZE} magic box για να δείτε αν κρύβει βραβείο!
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Έχετε μόνο μία προσπάθεια - διαλέξτε προσεκτικά!
                </p>
                <Button
                  onClick={initializeGame}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Ξεκίνησε το Παιχνίδι
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-medium">
                  {gameCompleted 
                    ? (wonPrize ? 'Συγχαρητήρια! 🎉' : 'Δοκιμάστε ξανά!')
                    : 'Επιλέξτε ένα κουτί:'
                  }
                </p>
                {wonPrize && (
                  <div className="mt-2 p-4 bg-green-100 border border-green-300 rounded-none">
                    <p className="text-green-800 font-semibold">
                      🏆 Κερδίσατε: {wonPrize.name}
                    </p>
                    {wonPrize.description && (
                      <p className="text-green-600 text-sm mt-1">{wonPrize.description}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Grid των κουτιών */}
              <div className="grid grid-cols-10 gap-1 p-4 bg-gray-50 rounded-none max-h-96 overflow-y-auto">
                {boxes.map((box) => (
                  <button
                    key={box.id}
                    onClick={() => handleBoxClick(box.id)}
                    disabled={gameCompleted || selectedBox !== null || loading}
                    className={`
                      aspect-square w-8 h-8 border-2 transition-all duration-200 rounded-none
                      ${box.isOpened 
                        ? (box.isWinning 
                          ? 'bg-[#00ffba] border-[#00ffba] shadow-lg' 
                          : 'bg-gray-300 border-gray-400')
                        : 'bg-white border-gray-300 hover:border-[#00ffba] hover:bg-[#00ffba]/10'
                      }
                      ${selectedBox === box.id ? 'animate-pulse' : ''}
                      disabled:cursor-not-allowed
                      flex items-center justify-center
                    `}
                  >
                    {!box.isOpened && (
                      <Gift className="w-4 h-4 text-[#00ffba]" />
                    )}
                    {box.isOpened && box.isWinning && (
                      <Gift className="w-3 h-3 text-black" />
                    )}
                    {box.isOpened && !box.isWinning && (
                      <X className="w-3 h-3 text-gray-600" />
                    )}
                  </button>
                ))}
              </div>

              {gameCompleted && (
                <div className="text-center space-y-3">
                  <Button
                    onClick={resetGame}
                    variant="outline"
                    className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba] hover:text-black"
                  >
                    Παίξε Ξανά
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <ConsolationDialog
          isOpen={showConsolationDialog}
          onClose={() => setShowConsolationDialog(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
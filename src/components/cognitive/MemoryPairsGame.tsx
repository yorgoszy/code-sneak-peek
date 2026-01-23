import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, ArrowLeft, Play } from "lucide-react";

interface MemoryPairsGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onBack: () => void;
  onPlayAgain: () => void;
}

const SYMBOLS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑', '🥭', '🍍', '🫐', '🍌'];

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryPairsGame: React.FC<MemoryPairsGameProps> = ({
  difficulty,
  onBack,
  onPlayAgain,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPreviewPhase, setIsPreviewPhase] = useState(false);
  const [previewCountdown, setPreviewCountdown] = useState(5);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [lastFlipTime, setLastFlipTime] = useState<number>(0);

  // Grid size based on difficulty
  const getPairCount = () => {
    switch (difficulty) {
      case 'easy': return 6; // 12 cards (4x3)
      case 'medium': return 8; // 16 cards (4x4)
      case 'hard': return 12; // 24 cards (6x4)
    }
  };

  const getGridCols = () => {
    switch (difficulty) {
      case 'easy': return 4;
      case 'medium': return 4;
      case 'hard': return 6;
    }
  };

  // Initialize cards with preview phase
  const initializeCards = useCallback(() => {
    const pairCount = getPairCount();
    const selectedSymbols = SYMBOLS.slice(0, pairCount);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];
    
    // Shuffle
    const shuffled = cardPairs
      .map((symbol, index) => ({
        id: index,
        symbol,
        isFlipped: true, // Start with all cards flipped (visible)
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);
    
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameOver(false);
    setGameStarted(true);
    setIsPreviewPhase(true);
    setPreviewCountdown(5);
    setReactionTimes([]);
  }, [difficulty]);

  // Auto-start game on mount
  useEffect(() => {
    initializeCards();
  }, [initializeCards]);

  // Preview countdown effect
  useEffect(() => {
    if (!isPreviewPhase) return;

    if (previewCountdown > 0) {
      const timer = setTimeout(() => {
        setPreviewCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // End preview phase - flip all cards face down
      setCards(prev => prev.map(card => ({ ...card, isFlipped: false })));
      setIsPreviewPhase(false);
      setStartTime(Date.now());
      setLastFlipTime(Date.now());
    }
  }, [isPreviewPhase, previewCountdown]);

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameOver || isPreviewPhase) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, startTime, isPreviewPhase]);

  // Handle card click
  const handleCardClick = (cardIndex: number) => {
    if (isPreviewPhase) return;
    if (flippedCards.length === 2) return;
    
    const card = cards[cardIndex];
    if (card.isFlipped || card.isMatched) return;

    // Track reaction time
    if (lastFlipTime > 0) {
      const reactionTime = Date.now() - lastFlipTime;
      setReactionTimes(prev => [...prev, reactionTime]);
    }
    setLastFlipTime(Date.now());

    const newCards = [...cards];
    newCards[cardIndex].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, cardIndex];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      
      const [first, second] = newFlipped;
      if (cards[first].symbol === cards[second].symbol) {
        // Match found
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[first].isMatched = true;
            updated[second].isMatched = true;
            return updated;
          });
          setFlippedCards([]);
          setMatches(prev => {
            const newMatches = prev + 1;
            if (newMatches === getPairCount()) {
              setGameOver(true);
            }
            return newMatches;
          });
        }, 300);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[first].isFlipped = false;
            updated[second].isFlipped = false;
            return updated;
          });
          setFlippedCards([]);
        }, 800);
      }
    }
  };

  // Calculate stats
  const averageReactionTime = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameOver) {
    return (
      <div className="text-center space-y-4 py-4">
        <Trophy className="w-12 h-12 mx-auto text-[#cb8954]" />
        
        <div>
          <h2 className="text-xl font-bold mb-1">Μπράβο! 🎉</h2>
          <p className="text-sm text-muted-foreground">Βρήκες όλα τα ζευγάρια!</p>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-muted/50 p-2 rounded-none">
            <div className="text-xl font-bold text-[#00ffba]">{matches}</div>
            <div className="text-[10px] text-muted-foreground">Ζευγάρια</div>
          </div>
          <div className="bg-muted/50 p-2 rounded-none">
            <div className="text-xl font-bold">{moves}</div>
            <div className="text-[10px] text-muted-foreground">Κινήσεις</div>
          </div>
          <div className="bg-muted/50 p-2 rounded-none">
            <div className="text-xl font-bold text-[#cb8954]">{formatTime(elapsedTime)}</div>
            <div className="text-[10px] text-muted-foreground">Χρόνος</div>
          </div>
          <div className="bg-muted/50 p-2 rounded-none">
            <div className="text-xl font-bold text-blue-500">
              {averageReactionTime > 0 ? `${(averageReactionTime / 1000).toFixed(1)}s` : '-'}
            </div>
            <div className="text-[10px] text-muted-foreground">Μ.Ο.</div>
          </div>
        </div>
        
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onBack} className="rounded-none h-8 text-xs">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Πίσω
          </Button>
          <Button onClick={onPlayAgain} className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90 h-8 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            Ξανά
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state if not started yet
  if (!gameStarted) {
    return (
      <div className="text-center py-4">
        <div className="text-muted-foreground">Φόρτωση...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-[#00ffba]">{matches}</div>
            <div className="text-[10px] text-muted-foreground">Ζευγάρια</div>
          </div>
          <div className="text-center">
            <div className="text-base font-medium">{moves}</div>
            <div className="text-[10px] text-muted-foreground">Κινήσεις</div>
          </div>
          <div className="text-center">
            <div className="text-base font-medium text-[#cb8954]">{formatTime(elapsedTime)}</div>
            <div className="text-[10px] text-muted-foreground">Χρόνος</div>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={onBack} className="rounded-none h-7 text-xs px-2">
          Τέλος
        </Button>
      </div>

      {/* Preview countdown */}
      {isPreviewPhase && (
        <div className="text-center">
          <Badge className="rounded-none bg-yellow-500 text-black text-xs">
            Απομνημόνευσε! {previewCountdown}"
          </Badge>
        </div>
      )}

      {/* Card grid */}
      <div 
        className="grid gap-1 max-w-[280px] mx-auto"
        style={{ gridTemplateColumns: `repeat(${getGridCols()}, 1fr)` }}
      >
        {cards.map((card, index) => (
          <button
            key={card.id}
            className={`aspect-square rounded-none border transition-all duration-300 text-lg flex items-center justify-center ${
              card.isFlipped || card.isMatched
                ? 'bg-white border-[#00ffba]'
                : 'bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] border-gray-600 hover:border-[#00ffba]'
            } ${card.isMatched ? 'opacity-50' : ''} ${isPreviewPhase ? 'pointer-events-none' : ''}`}
            onClick={() => handleCardClick(index)}
            disabled={card.isFlipped || card.isMatched || flippedCards.length === 2 || isPreviewPhase}
          >
            {(card.isFlipped || card.isMatched) ? card.symbol : '?'}
          </button>
        ))}
      </div>
    </div>
  );
};

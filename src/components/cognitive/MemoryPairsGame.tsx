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

  // Initialize cards
  const initializeCards = useCallback(() => {
    const pairCount = getPairCount();
    const selectedSymbols = SYMBOLS.slice(0, pairCount);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];
    
    // Shuffle
    const shuffled = cardPairs
      .map((symbol, index) => ({
        id: index,
        symbol,
        isFlipped: false,
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);
    
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameOver(false);
    setGameStarted(true);
    setStartTime(Date.now());
    setReactionTimes([]);
    setLastFlipTime(Date.now());
  }, [difficulty]);

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, startTime]);

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2) return;
    if (cards[cardId].isFlipped || cards[cardId].isMatched) return;

    // Track reaction time
    if (lastFlipTime > 0) {
      const reactionTime = Date.now() - lastFlipTime;
      setReactionTimes(prev => [...prev, reactionTime]);
    }
    setLastFlipTime(Date.now());

    const newCards = [...cards];
    newCards[cardId].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      
      const [first, second] = newFlipped;
      if (cards[first].symbol === cards[second].symbol) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
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
          const unflippedCards = [...cards];
          unflippedCards[first].isFlipped = false;
          unflippedCards[second].isFlipped = false;
          setCards(unflippedCards);
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
      <div className="text-center space-y-6 py-8">
        <Trophy className="w-16 h-16 mx-auto text-[#cb8954]" />
        
        <div>
          <h2 className="text-2xl font-bold mb-2">Μπράβο! 🎉</h2>
          <p className="text-muted-foreground">Βρήκες όλα τα ζευγάρια!</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold text-[#00ffba]">{matches}</div>
            <div className="text-xs text-muted-foreground">Ζευγάρια</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold">{moves}</div>
            <div className="text-xs text-muted-foreground">Κινήσεις</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold text-[#cb8954]">{formatTime(elapsedTime)}</div>
            <div className="text-xs text-muted-foreground">Χρόνος</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold text-blue-500">
              {averageReactionTime > 0 ? `${(averageReactionTime / 1000).toFixed(2)}s` : '-'}
            </div>
            <div className="text-xs text-muted-foreground">Μ.Ο. Αντίδρ.</div>
          </div>
        </div>
        
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onBack} className="rounded-none">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Πίσω
          </Button>
          <Button onClick={onPlayAgain} className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90">
            <RotateCcw className="w-4 h-4 mr-2" />
            Ξανά
          </Button>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="text-center space-y-4 py-8">
        <h2 className="text-xl font-bold">Βρες τα Ζευγάρια</h2>
        <p className="text-muted-foreground">
          Γύρνα τις κάρτες και βρες τα ίδια σύμβολα
        </p>
        <Button
          className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90"
          onClick={initializeCards}
        >
          <Play className="w-4 h-4 mr-2" />
          Ξεκίνα
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00ffba]">{matches}</div>
            <div className="text-xs text-muted-foreground">Ζευγάρια</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium">{moves}</div>
            <div className="text-xs text-muted-foreground">Κινήσεις</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-[#cb8954]">{formatTime(elapsedTime)}</div>
            <div className="text-xs text-muted-foreground">Χρόνος</div>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={onBack} className="rounded-none">
          Τέλος
        </Button>
      </div>

      {/* Card grid */}
      <div 
        className="grid gap-2 max-w-md mx-auto"
        style={{ gridTemplateColumns: `repeat(${getGridCols()}, 1fr)` }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            className={`aspect-square rounded-none border-2 transition-all duration-300 text-2xl flex items-center justify-center ${
              card.isFlipped || card.isMatched
                ? 'bg-white border-[#00ffba]'
                : 'bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] border-gray-600 hover:border-[#00ffba]'
            } ${card.isMatched ? 'opacity-50' : ''}`}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isFlipped || card.isMatched || flippedCards.length === 2}
          >
            {(card.isFlipped || card.isMatched) ? card.symbol : '?'}
          </button>
        ))}
      </div>
    </div>
  );
};

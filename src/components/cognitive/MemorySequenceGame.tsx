import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, ArrowLeft, Play } from "lucide-react";

interface MemorySequenceGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onBack: () => void;
  onPlayAgain: () => void;
}

const GRID_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#a855f7', // purple
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
  '#8b5cf6', // violet
];

export const MemorySequenceGame: React.FC<MemorySequenceGameProps> = ({
  difficulty,
  onBack,
  onPlayAgain,
}) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [currentShowIndex, setCurrentShowIndex] = useState(-1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [sequenceStartTime, setSequenceStartTime] = useState<number>(0);
  const [lastReactionTime, setLastReactionTime] = useState<number | null>(null);

  // Grid size based on difficulty
  const gridSize = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 9;
  const gridCols = difficulty === 'easy' ? 2 : 3;
  
  // Starting sequence length
  const getStartingLength = () => {
    switch (difficulty) {
      case 'easy': return 3;
      case 'medium': return 4;
      case 'hard': return 5;
    }
  };

  // Generate a new random sequence
  const generateSequence = useCallback((length: number) => {
    const newSequence: number[] = [];
    for (let i = 0; i < length; i++) {
      newSequence.push(Math.floor(Math.random() * gridSize));
    }
    return newSequence;
  }, [gridSize]);

  // Start a new round with explicit level parameter
  const startRound = useCallback((currentLevel: number) => {
    const seqLength = getStartingLength() + currentLevel - 1;
    const newSequence = generateSequence(seqLength);
    setSequence(newSequence);
    setPlayerSequence([]);
    setIsShowingSequence(true);
    setCurrentShowIndex(-1);
    setIsPlayerTurn(false);
  }, [generateSequence]);

  // Start the game
  const startGame = useCallback(() => {
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setReactionTimes([]);
    setLastReactionTime(null);
    startRound(1); // Pass level 1 explicitly
  }, [startRound]);

  // Show sequence animation
  useEffect(() => {
    if (!isShowingSequence || sequence.length === 0) return;

    const showDelay = difficulty === 'easy' ? 800 : difficulty === 'medium' ? 600 : 400;
    
    let index = 0;
    const showNext = () => {
      if (index < sequence.length) {
        setCurrentShowIndex(sequence[index]);
        setTimeout(() => {
          setCurrentShowIndex(-1);
          index++;
          setTimeout(showNext, 200);
        }, showDelay);
      } else {
        setIsShowingSequence(false);
        setIsPlayerTurn(true);
        setSequenceStartTime(Date.now());
      }
    };

    const timer = setTimeout(showNext, 500);
    return () => clearTimeout(timer);
  }, [isShowingSequence, sequence, difficulty]);

  // Handle player click
  const handleCellClick = (index: number) => {
    if (!isPlayerTurn || isShowingSequence || gameOver) return;

    // Track reaction time
    if (playerSequence.length === 0 && sequenceStartTime > 0) {
      const reactionTime = Date.now() - sequenceStartTime;
      setLastReactionTime(reactionTime);
      setReactionTimes(prev => [...prev, reactionTime]);
    }

    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);

    // Check if correct
    const currentIndex = newPlayerSequence.length - 1;
    if (newPlayerSequence[currentIndex] !== sequence[currentIndex]) {
      // Wrong answer
      setGameOver(true);
      setIsPlayerTurn(false);
      return;
    }

    // Check if sequence complete
    if (newPlayerSequence.length === sequence.length) {
      // Level complete
      const nextLevel = level + 1;
      setScore(prev => prev + sequence.length);
      setLevel(nextLevel);
      setIsPlayerTurn(false);
      
      // Start next round after delay
      setTimeout(() => {
        startRound(nextLevel);
      }, 1000);
    }
  };

  // Calculate stats
  const averageReactionTime = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;
  
  const bestReactionTime = reactionTimes.length > 0 
    ? Math.min(...reactionTimes)
    : 0;

  if (gameOver) {
    return (
      <div className="text-center space-y-3 py-4">
        <Trophy className="w-10 h-10 mx-auto text-[#cb8954]" />
        
        <div>
          <h2 className="text-lg font-bold mb-1">Τέλος Παιχνιδιού!</h2>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-muted/50 p-2 rounded-none">
            <div className="text-xl font-bold text-[#00ffba]">{score}</div>
            <div className="text-[10px] text-muted-foreground">Σκορ</div>
          </div>
          <div className="bg-muted/50 p-2 rounded-none">
            <div className="text-xl font-bold">{level - 1}</div>
            <div className="text-[10px] text-muted-foreground">Επίπεδο</div>
          </div>
          <div className="bg-muted/50 p-2 rounded-none">
            <div className="text-xl font-bold text-blue-500">
              {averageReactionTime > 0 ? `${(averageReactionTime / 1000).toFixed(1)}s` : '-'}
            </div>
            <div className="text-[10px] text-muted-foreground">Μ.Ο.</div>
          </div>
          <div className="bg-muted/50 p-2 rounded-none">
            <div className="text-xl font-bold text-green-500">
              {bestReactionTime > 0 ? `${(bestReactionTime / 1000).toFixed(1)}s` : '-'}
            </div>
            <div className="text-[10px] text-muted-foreground">Best</div>
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

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-[#00ffba]">{score}</div>
            <div className="text-[10px] text-muted-foreground">Σκορ</div>
          </div>
          <div className="text-center">
            <div className="text-base font-medium">{level}</div>
            <div className="text-[10px] text-muted-foreground">Επίπεδο</div>
          </div>
          <div className="text-center">
            <div className="text-base font-medium">{sequence.length}</div>
            <div className="text-[10px] text-muted-foreground">Μήκος</div>
          </div>
          {lastReactionTime && (
            <div className="text-center">
              <div className="text-base font-medium text-blue-500">
                {(lastReactionTime / 1000).toFixed(2)}s
              </div>
              <div className="text-[10px] text-muted-foreground">Αντίδρ.</div>
            </div>
          )}
        </div>
        <Button variant="destructive" size="sm" onClick={() => setGameOver(true)} className="rounded-none h-7 text-xs px-2">
          Τέλος
        </Button>
      </div>

      {/* Status */}
      <div className="text-center">
        {isShowingSequence ? (
          <Badge className="rounded-none bg-yellow-500 text-black text-xs">
            Παρακολούθησε...
          </Badge>
        ) : isPlayerTurn ? (
          <Badge className="rounded-none bg-[#00ffba] text-black text-xs">
            Σειρά σου! ({playerSequence.length}/{sequence.length})
          </Badge>
        ) : (
          <Badge className="rounded-none text-xs">
            Ετοιμάσου...
          </Badge>
        )}
      </div>

      {/* Grid */}
      <div 
        className="grid gap-2 max-w-[200px] mx-auto"
        style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
      >
        {Array.from({ length: gridSize }).map((_, index) => {
          const isHighlighted = currentShowIndex === index;
          const isClicked = playerSequence.includes(index);
          
          return (
            <button
              key={index}
              className={`aspect-square rounded-none border-2 transition-all duration-200 ${
                isHighlighted 
                  ? 'scale-110 shadow-lg' 
                  : isPlayerTurn && !isClicked
                    ? 'hover:scale-105 cursor-pointer'
                    : ''
              }`}
              style={{
                backgroundColor: isHighlighted 
                  ? GRID_COLORS[index % GRID_COLORS.length]
                  : '#374151',
                borderColor: isHighlighted 
                  ? GRID_COLORS[index % GRID_COLORS.length]
                  : '#4b5563',
              }}
              onClick={() => handleCellClick(index)}
              disabled={!isPlayerTurn || isShowingSequence}
            />
          );
        })}
      </div>

      {/* Start button if not started */}
      {sequence.length === 0 && !isShowingSequence && (
        <Button
          className="w-full rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90 h-10"
          onClick={startGame}
        >
          <Play className="w-4 h-4 mr-2" />
          Ξεκίνα
        </Button>
      )}
    </div>
  );
};

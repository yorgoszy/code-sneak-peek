import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, ArrowLeft, Play } from "lucide-react";

interface LogicPatternGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onBack: () => void;
  onPlayAgain: () => void;
}

const SHAPES = ['●', '■', '▲', '◆', '★', '♥'];
const COLORS = [
  { name: 'red', hex: '#ef4444' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'orange', hex: '#f97316' },
];

interface PatternItem {
  shape: string;
  color: string;
  colorHex: string;
}

interface PatternQuestion {
  pattern: PatternItem[];
  answer: PatternItem;
  options: PatternItem[];
}

// Generate pattern question
const generatePattern = (difficulty: 'easy' | 'medium' | 'hard'): PatternQuestion => {
  const patternTypes = difficulty === 'easy' 
    ? ['shape', 'color']
    : difficulty === 'medium'
      ? ['shape', 'color', 'both', 'alternating']
      : ['both', 'alternating', 'complex', 'nested'];
  
  const type = patternTypes[Math.floor(Math.random() * patternTypes.length)];
  
  const patternLength = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 7;
  const pattern: PatternItem[] = [];
  let answer: PatternItem;
  
  if (type === 'shape') {
    // Repeating shape pattern with same color
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shapeCount = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
    const shuffledShapes = [...SHAPES].sort(() => Math.random() - 0.5);
    const selectedShapes = shuffledShapes.slice(0, shapeCount);
    
    for (let i = 0; i < patternLength; i++) {
      pattern.push({
        shape: selectedShapes[i % shapeCount],
        color: color.name,
        colorHex: color.hex,
      });
    }
    answer = {
      shape: selectedShapes[patternLength % shapeCount],
      color: color.name,
      colorHex: color.hex,
    };
  } else if (type === 'color') {
    // Same shape, repeating colors
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const colorCount = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
    const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5);
    const selectedColors = shuffledColors.slice(0, colorCount);
    
    for (let i = 0; i < patternLength; i++) {
      const color = selectedColors[i % colorCount];
      pattern.push({
        shape,
        color: color.name,
        colorHex: color.hex,
      });
    }
    const answerColor = selectedColors[patternLength % colorCount];
    answer = {
      shape,
      color: answerColor.name,
      colorHex: answerColor.hex,
    };
  } else if (type === 'alternating') {
    // Alternating pattern: AB AB AB or ABC ABC
    const shapeCount = difficulty === 'easy' ? 2 : 3;
    const colorCount = difficulty === 'easy' ? 2 : 3;
    const shuffledShapes = [...SHAPES].sort(() => Math.random() - 0.5);
    const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5);
    const selectedShapes = shuffledShapes.slice(0, shapeCount);
    const selectedColors = shuffledColors.slice(0, colorCount);
    
    for (let i = 0; i < patternLength; i++) {
      pattern.push({
        shape: selectedShapes[i % shapeCount],
        color: selectedColors[i % colorCount].name,
        colorHex: selectedColors[i % colorCount].hex,
      });
    }
    answer = {
      shape: selectedShapes[patternLength % shapeCount],
      color: selectedColors[patternLength % colorCount].name,
      colorHex: selectedColors[patternLength % colorCount].hex,
    };
  } else if (type === 'complex') {
    // Complex: shapes cycle every 2, colors cycle every 3
    const selectedShapes = [...SHAPES].sort(() => Math.random() - 0.5).slice(0, 3);
    const selectedColors = [...COLORS].sort(() => Math.random() - 0.5).slice(0, 4);
    
    for (let i = 0; i < patternLength; i++) {
      pattern.push({
        shape: selectedShapes[Math.floor(i / 2) % selectedShapes.length],
        color: selectedColors[i % selectedColors.length].name,
        colorHex: selectedColors[i % selectedColors.length].hex,
      });
    }
    answer = {
      shape: selectedShapes[Math.floor(patternLength / 2) % selectedShapes.length],
      color: selectedColors[patternLength % selectedColors.length].name,
      colorHex: selectedColors[patternLength % selectedColors.length].hex,
    };
  } else if (type === 'nested') {
    // Nested: color changes every shape cycle completion
    const shapeCount = 3;
    const selectedShapes = [...SHAPES].sort(() => Math.random() - 0.5).slice(0, shapeCount);
    const selectedColors = [...COLORS].sort(() => Math.random() - 0.5).slice(0, 3);
    
    for (let i = 0; i < patternLength; i++) {
      const colorIndex = Math.floor(i / shapeCount) % selectedColors.length;
      pattern.push({
        shape: selectedShapes[i % shapeCount],
        color: selectedColors[colorIndex].name,
        colorHex: selectedColors[colorIndex].hex,
      });
    }
    const answerColorIndex = Math.floor(patternLength / shapeCount) % selectedColors.length;
    answer = {
      shape: selectedShapes[patternLength % shapeCount],
      color: selectedColors[answerColorIndex].name,
      colorHex: selectedColors[answerColorIndex].hex,
    };
  } else {
    // Both shape and color change (default)
    const shapeCount = difficulty === 'medium' ? 3 : 4;
    const colorCount = difficulty === 'medium' ? 2 : 3;
    const shuffledShapes = [...SHAPES].sort(() => Math.random() - 0.5);
    const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5);
    const selectedShapes = shuffledShapes.slice(0, shapeCount);
    const selectedColors = shuffledColors.slice(0, colorCount);
    
    for (let i = 0; i < patternLength; i++) {
      pattern.push({
        shape: selectedShapes[i % shapeCount],
        color: selectedColors[Math.floor(i / shapeCount) % colorCount].name,
        colorHex: selectedColors[Math.floor(i / shapeCount) % colorCount].hex,
      });
    }
    answer = {
      shape: selectedShapes[patternLength % shapeCount],
      color: selectedColors[Math.floor(patternLength / shapeCount) % colorCount].name,
      colorHex: selectedColors[Math.floor(patternLength / shapeCount) % colorCount].hex,
    };
  }
  
  // Generate wrong options
  const options: PatternItem[] = [answer];
  while (options.length < 4) {
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const wrongOption = {
      shape: randomShape,
      color: randomColor.name,
      colorHex: randomColor.hex,
    };
    
    // Make sure it's different from answer and existing options
    if (!options.some(o => o.shape === wrongOption.shape && o.color === wrongOption.color)) {
      options.push(wrongOption);
    }
  }
  
  // Shuffle options
  const shuffledOptions = options.sort(() => Math.random() - 0.5);
  
  return { pattern, answer, options: shuffledOptions };
};

export const LogicPatternGame: React.FC<LogicPatternGameProps> = ({
  difficulty,
  onBack,
  onPlayAgain,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<PatternQuestion | null>(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [lastReactionTime, setLastReactionTime] = useState<number | null>(null);

  // Start game
  const startGame = useCallback(() => {
    setScore(0);
    setTotalQuestions(0);
    setStreak(0);
    setBestStreak(0);
    setGameOver(false);
    setGameStarted(true);
    setReactionTimes([]);
    setLastReactionTime(null);
    setCurrentQuestion(generatePattern(difficulty));
    setQuestionStartTime(Date.now());
  }, [difficulty]);

  // Auto-start game on mount
  useEffect(() => {
    startGame();
  }, [startGame]);

  // Handle answer
  const handleAnswer = (selectedOption: PatternItem) => {
    if (!currentQuestion || gameOver) return;

    // Track reaction time
    if (questionStartTime > 0) {
      const reactionTime = Date.now() - questionStartTime;
      setLastReactionTime(reactionTime);
      setReactionTimes(prev => [...prev, reactionTime]);
    }

    const isCorrect = selectedOption.shape === currentQuestion.answer.shape && 
                      selectedOption.color === currentQuestion.answer.color;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
    } else {
      setStreak(0);
    }
    
    setTotalQuestions(prev => prev + 1);
    
    // Next question
    setCurrentQuestion(generatePattern(difficulty));
    setQuestionStartTime(Date.now());
  };

  // End game
  const endGame = () => {
    if (totalQuestions > 0) {
      setGameOver(true);
    } else {
      onBack();
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
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    
    return (
      <div className="text-center space-y-3 py-4">
        <Trophy className="w-10 h-10 mx-auto text-[#cb8954]" />
        
        <div>
          <h2 className="text-lg font-bold mb-1">Τέλος Παιχνιδιού!</h2>
        </div>
        
        <div className="grid grid-cols-5 gap-1">
          <div className="bg-muted/50 p-1.5 rounded-none">
            <div className="text-lg font-bold text-[#00ffba]">{score}</div>
            <div className="text-[9px] text-muted-foreground">Σωστά</div>
          </div>
          <div className="bg-muted/50 p-1.5 rounded-none">
            <div className="text-lg font-bold">{percentage}%</div>
            <div className="text-[9px] text-muted-foreground">Ακρίβ.</div>
          </div>
          <div className="bg-muted/50 p-1.5 rounded-none">
            <div className="text-lg font-bold text-[#cb8954]">{bestStreak}</div>
            <div className="text-[9px] text-muted-foreground">Streak</div>
          </div>
          <div className="bg-muted/50 p-1.5 rounded-none">
            <div className="text-lg font-bold text-blue-500">
              {averageReactionTime > 0 ? `${(averageReactionTime / 1000).toFixed(1)}s` : '-'}
            </div>
            <div className="text-[9px] text-muted-foreground">Μ.Ο.</div>
          </div>
          <div className="bg-muted/50 p-1.5 rounded-none">
            <div className="text-lg font-bold text-green-500">
              {bestReactionTime > 0 ? `${(bestReactionTime / 1000).toFixed(1)}s` : '-'}
            </div>
            <div className="text-[9px] text-muted-foreground">Best</div>
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

  if (!currentQuestion) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00ffba]">{score}</div>
            <div className="text-xs text-muted-foreground">Σκορ</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium">{totalQuestions}</div>
            <div className="text-xs text-muted-foreground">Ερωτήσεις</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-[#cb8954]">
              {averageReactionTime > 0 ? `${(averageReactionTime / 1000).toFixed(2)}s` : '-'}
            </div>
            <div className="text-xs text-muted-foreground">Μ.Ο. Αντ.</div>
          </div>
          {streak > 1 && (
            <Badge className="rounded-none bg-[#cb8954] text-white">
              🔥 {streak}
            </Badge>
          )}
        </div>
        <Button variant="destructive" size="sm" onClick={endGame} className="rounded-none">
          Τέλος
        </Button>
      </div>

      {/* Pattern display */}
      <div className="p-8 rounded-none flex items-center justify-center min-h-[150px] bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44]">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          {currentQuestion.pattern.map((item, index) => (
            <span 
              key={index}
              className="text-4xl sm:text-5xl"
              style={{ color: item.colorHex }}
            >
              {item.shape}
            </span>
          ))}
          <span className="text-4xl sm:text-5xl text-[#00ffba]">?</span>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-center text-sm text-muted-foreground">
        Ποιο είναι το επόμενο στο μοτίβο;
      </p>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-3">
        {currentQuestion.options.map((option, index) => (
          <Button
            key={index}
            className="rounded-none h-20 text-4xl font-bold transition-transform hover:scale-105 bg-muted hover:bg-white/10"
            onClick={() => handleAnswer(option)}
          >
            <span style={{ color: option.colorHex }}>{option.shape}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

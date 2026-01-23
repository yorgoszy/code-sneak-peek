import React, { useState, useCallback } from 'react';
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
  const patternTypes = ['shape', 'color', 'both'];
  const type = difficulty === 'easy' 
    ? patternTypes[0] 
    : difficulty === 'medium'
      ? patternTypes[Math.floor(Math.random() * 2)]
      : patternTypes[Math.floor(Math.random() * patternTypes.length)];
  
  const patternLength = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
  const pattern: PatternItem[] = [];
  let answer: PatternItem;
  
  if (type === 'shape') {
    // Repeating shape pattern with same color
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shapeCount = difficulty === 'easy' ? 2 : 3;
    const selectedShapes = SHAPES.slice(0, shapeCount);
    
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
    const colorCount = difficulty === 'easy' ? 2 : 3;
    const selectedColors = COLORS.slice(0, colorCount);
    
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
  } else {
    // Both shape and color change
    const shapeCount = 2;
    const colorCount = 2;
    const selectedShapes = SHAPES.slice(0, shapeCount);
    const selectedColors = COLORS.slice(0, colorCount);
    
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
      <div className="text-center space-y-6 py-8">
        <Trophy className="w-16 h-16 mx-auto text-[#cb8954]" />
        
        <div>
          <h2 className="text-2xl font-bold mb-2">Τέλος Παιχνιδιού!</h2>
          <p className="text-muted-foreground">Τα αποτελέσματά σου</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold text-[#00ffba]">{score}</div>
            <div className="text-xs text-muted-foreground">Σωστά</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold">{percentage}%</div>
            <div className="text-xs text-muted-foreground">Ακρίβεια</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold text-[#cb8954]">{bestStreak}</div>
            <div className="text-xs text-muted-foreground">Καλύτερο Streak</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold text-blue-500">
              {averageReactionTime > 0 ? `${(averageReactionTime / 1000).toFixed(2)}s` : '-'}
            </div>
            <div className="text-xs text-muted-foreground">Μ.Ο. Αντίδρ.</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold text-green-500">
              {bestReactionTime > 0 ? `${(bestReactionTime / 1000).toFixed(2)}s` : '-'}
            </div>
            <div className="text-xs text-muted-foreground">Καλύτερη</div>
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
        <h2 className="text-xl font-bold">Αναγνώριση Μοτίβου</h2>
        <p className="text-muted-foreground">
          Βρες ποιο σχήμα/χρώμα ακολουθεί στο μοτίβο
        </p>
        <Button
          className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90"
          onClick={startGame}
        >
          <Play className="w-4 h-4 mr-2" />
          Ξεκίνα
        </Button>
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

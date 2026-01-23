import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, ArrowLeft, Play } from "lucide-react";

interface LogicSequenceGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onBack: () => void;
  onPlayAgain: () => void;
}

interface SequenceQuestion {
  sequence: number[];
  answer: number;
  options: number[];
  type: string;
}

// Generate number sequences based on difficulty
const generateSequence = (difficulty: 'easy' | 'medium' | 'hard'): SequenceQuestion => {
  const types = difficulty === 'easy' 
    ? ['add', 'multiply'] 
    : difficulty === 'medium'
      ? ['add', 'multiply', 'subtract', 'double']
      : ['add', 'multiply', 'subtract', 'double', 'fibonacci', 'square'];
  
  const type = types[Math.floor(Math.random() * types.length)];
  let sequence: number[] = [];
  let answer: number = 0;
  
  switch (type) {
    case 'add': {
      // Arithmetic sequence: a, a+d, a+2d, ...
      const start = Math.floor(Math.random() * 10) + 1;
      const diff = Math.floor(Math.random() * 5) + 1;
      const length = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
      for (let i = 0; i < length; i++) {
        sequence.push(start + i * diff);
      }
      answer = start + length * diff;
      break;
    }
    case 'subtract': {
      // Decreasing sequence
      const start = Math.floor(Math.random() * 30) + 20;
      const diff = Math.floor(Math.random() * 4) + 1;
      const length = difficulty === 'medium' ? 4 : 5;
      for (let i = 0; i < length; i++) {
        sequence.push(start - i * diff);
      }
      answer = start - length * diff;
      break;
    }
    case 'multiply': {
      // Geometric sequence: a, a*r, a*r^2, ...
      const start = Math.floor(Math.random() * 3) + 1;
      const ratio = Math.floor(Math.random() * 2) + 2;
      const length = difficulty === 'easy' ? 4 : 5;
      for (let i = 0; i < length; i++) {
        sequence.push(start * Math.pow(ratio, i));
      }
      answer = start * Math.pow(ratio, length);
      break;
    }
    case 'double': {
      // Each term is double the previous
      const start = Math.floor(Math.random() * 5) + 1;
      const length = 5;
      for (let i = 0; i < length; i++) {
        sequence.push(start * Math.pow(2, i));
      }
      answer = start * Math.pow(2, length);
      break;
    }
    case 'fibonacci': {
      // Fibonacci-like: each term is sum of previous two
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 3) + 1;
      sequence = [a, b];
      for (let i = 2; i < 5; i++) {
        sequence.push(sequence[i-1] + sequence[i-2]);
      }
      answer = sequence[3] + sequence[4];
      break;
    }
    case 'square': {
      // Square numbers: 1, 4, 9, 16, ...
      const offset = Math.floor(Math.random() * 3);
      for (let i = 1; i <= 5; i++) {
        sequence.push((i + offset) * (i + offset));
      }
      answer = (6 + offset) * (6 + offset);
      break;
    }
    default:
      sequence = [1, 2, 3, 4];
      answer = 5;
  }
  
  // Generate wrong options
  const wrongOptions = new Set<number>();
  while (wrongOptions.size < 3) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrongAnswer = answer + offset;
    if (wrongAnswer !== answer && wrongAnswer > 0) {
      wrongOptions.add(wrongAnswer);
    }
  }
  
  const options = [answer, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
  
  return { sequence, answer, options, type };
};

export const LogicSequenceGame: React.FC<LogicSequenceGameProps> = ({
  difficulty,
  onBack,
  onPlayAgain,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<SequenceQuestion | null>(null);
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
    setCurrentQuestion(generateSequence(difficulty));
    setQuestionStartTime(Date.now());
  }, [difficulty]);

  // Handle answer
  const handleAnswer = (selectedAnswer: number) => {
    if (!currentQuestion || gameOver) return;

    // Track reaction time
    if (questionStartTime > 0) {
      const reactionTime = Date.now() - questionStartTime;
      setLastReactionTime(reactionTime);
      setReactionTimes(prev => [...prev, reactionTime]);
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;
    
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
    setCurrentQuestion(generateSequence(difficulty));
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
        <h2 className="text-xl font-bold">Ακολουθίες Αριθμών</h2>
        <p className="text-muted-foreground">
          Βρες τον επόμενο αριθμό της ακολουθίας
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

      {/* Sequence display */}
      <div className="p-8 rounded-none flex items-center justify-center min-h-[150px] bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44]">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {currentQuestion.sequence.map((num, index) => (
            <React.Fragment key={index}>
              <span className="text-3xl sm:text-4xl font-bold text-white">
                {num}
              </span>
              {index < currentQuestion.sequence.length - 1 && (
                <span className="text-2xl text-gray-400">,</span>
              )}
            </React.Fragment>
          ))}
          <span className="text-2xl text-gray-400">,</span>
          <span className="text-3xl sm:text-4xl font-bold text-[#00ffba]">?</span>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-center text-sm text-muted-foreground">
        Ποιος είναι ο επόμενος αριθμός;
      </p>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-3">
        {currentQuestion.options.map((option, index) => (
          <Button
            key={index}
            className="rounded-none h-16 text-2xl font-bold transition-transform hover:scale-105 bg-muted hover:bg-[#00ffba] hover:text-black"
            onClick={() => handleAnswer(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};

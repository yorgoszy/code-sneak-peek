import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useEffectiveCoachId } from '@/hooks/useEffectiveCoachId';
import { 
  Brain, 
  Menu, 
  Play, 
  RotateCcw, 
  Trophy,
  Palette,
  Calculator,
  Grid3X3,
  Lightbulb,
  ChevronRight,
  ArrowLeft,
  Check,
  X,
  Timer,
  Layers,
  Puzzle
} from "lucide-react";
import { toast } from "sonner";
import { MemorySequenceGame } from "@/components/cognitive/MemorySequenceGame";
import { MemoryPairsGame } from "@/components/cognitive/MemoryPairsGame";
import { LogicSequenceGame } from "@/components/cognitive/LogicSequenceGame";
import { LogicPatternGame } from "@/components/cognitive/LogicPatternGame";

type Difficulty = 'easy' | 'medium' | 'hard';
type GameType = 'stroop' | 'math' | 'memory' | 'logic';
type SubGameType = 'memory-sequence' | 'memory-pairs' | 'logic-sequence' | 'logic-pattern' | null;

interface GameConfig {
  id: GameType;
  icon: React.ElementType;
  labelKey: string;
  descriptionKey: string;
  hasSubGames?: boolean;
}

const GAMES: GameConfig[] = [
  { id: 'stroop', icon: Palette, labelKey: 'cognitive.games.stroop.title', descriptionKey: 'cognitive.games.stroop.description' },
  { id: 'math', icon: Calculator, labelKey: 'cognitive.games.math.title', descriptionKey: 'cognitive.games.math.description' },
  { id: 'memory', icon: Grid3X3, labelKey: 'cognitive.games.memory.title', descriptionKey: 'cognitive.games.memory.description', hasSubGames: true },
  { id: 'logic', icon: Lightbulb, labelKey: 'cognitive.games.logic.title', descriptionKey: 'cognitive.games.logic.description', hasSubGames: true },
];

// Stroop Test Colors
const COLORS = [
  { name: 'red', hex: '#ef4444', greek: 'ΚΟΚΚΙΝΟ' },
  { name: 'blue', hex: '#3b82f6', greek: 'ΜΠΛΕ' },
  { name: 'green', hex: '#22c55e', greek: 'ΠΡΑΣΙΝΟ' },
  { name: 'yellow', hex: '#eab308', greek: 'ΚΙΤΡΙΝΟ' },
  { name: 'purple', hex: '#a855f7', greek: 'ΜΩΒ' },
  { name: 'orange', hex: '#f97316', greek: 'ΠΟΡΤΟΚΑΛΙ' },
  { name: 'black', hex: '#000000', greek: 'ΜΑΥΡΟ' },
  { name: 'white', hex: '#ffffff', greek: 'ΑΣΠΡΟ' },
  { name: 'pink', hex: '#ec4899', greek: 'ΡΟΖ' },
  { name: 'lightblue', hex: '#38bdf8', greek: 'ΓΑΛΑΖΙΟ' },
  { name: 'darkblue', hex: '#1e3a8a', greek: 'ΣΚΟΥΡΟ ΜΠΛΕ' },
  { name: 'brown', hex: '#92400e', greek: 'ΚΑΦΕ' },
];


interface StroopQuestion {
  text: string;
  textColor: string;
  backgroundColor: string;
  correctAnswer: string;
  options: { color: string; hex: string }[];
}

const generateStroopQuestion = (difficulty: Difficulty): StroopQuestion => {
  // Get random colors
  const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
  
  const textColor = shuffled[0]; // Color of the text (ink)
  const wordColor = shuffled[1]; // Word that is written
  const bgColor = shuffled[2];   // Background color
  
  // Number of options based on difficulty
  const optionCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  
  // Generate options - always include the correct answer (text color)
  let options = [textColor];
  const remainingColors = shuffled.filter(c => c.name !== textColor.name);
  
  for (let i = 0; i < optionCount - 1 && i < remainingColors.length; i++) {
    options.push(remainingColors[i]);
  }
  
  // Shuffle options
  options = options.sort(() => Math.random() - 0.5);
  
  return {
    text: wordColor.greek, // The word written (e.g., "ΜΠΛΕ")
    textColor: textColor.hex, // The color of the text (e.g., red)
    backgroundColor: difficulty === 'hard' ? bgColor.hex : '#1a1a2e', // Dark background for easy/medium
    correctAnswer: textColor.name,
    options: options.map(c => ({ color: c.name, hex: c.hex })),
  };
};

// Math Game Types
interface MathQuestion {
  display: string;
  correctAnswer: number;
  options: number[];
}

type MathOperation = '+' | '-' | '×' | '÷';

const generateMathQuestion = (difficulty: Difficulty): MathQuestion => {
  let num1: number, num2: number, operation: MathOperation, result: number;
  
  // Get available operations based on difficulty
  const operations: MathOperation[] = 
    difficulty === 'easy' ? ['+', '-'] :
    difficulty === 'medium' ? ['+', '-', '×'] :
    ['+', '-', '×', '÷'];
  
  operation = operations[Math.floor(Math.random() * operations.length)];
  
  // Generate numbers based on difficulty
  const maxNum = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100;
  
  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * maxNum) + 1;
      result = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * maxNum) + 10;
      num2 = Math.floor(Math.random() * Math.min(num1, maxNum)) + 1;
      result = num1 - num2;
      break;
    case '×':
      num1 = Math.floor(Math.random() * (difficulty === 'hard' ? 15 : 12)) + 1;
      num2 = Math.floor(Math.random() * (difficulty === 'hard' ? 15 : 12)) + 1;
      result = num1 * num2;
      break;
    case '÷':
      num2 = Math.floor(Math.random() * 12) + 1;
      result = Math.floor(Math.random() * 12) + 1;
      num1 = num2 * result; // Ensure clean division
      break;
    default:
      num1 = 1; num2 = 1; result = 2;
  }
  
  // Generate wrong options
  const wrongOptions = new Set<number>();
  while (wrongOptions.size < 3) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const wrongAnswer = result + offset;
    if (wrongAnswer !== result && wrongAnswer >= 0) {
      wrongOptions.add(wrongAnswer);
    }
  }
  
  // Mix correct answer with wrong options
  const options = [result, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
  
  return {
    display: `${num1} ${operation} ${num2} = ?`,
    correctAnswer: result,
    options,
  };
};

const CognitivePage: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useRoleCheck();
  const { effectiveCoachId } = useEffectiveCoachId();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Game state
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [selectedSubGame, setSelectedSubGame] = useState<SubGameType>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Stroop game state
  const [currentStroopQuestion, setCurrentStroopQuestion] = useState<StroopQuestion | null>(null);
  
  // Math game state
  const [currentMathQuestion, setCurrentMathQuestion] = useState<MathQuestion | null>(null);
  
  // Shared game state
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  
  // Reaction time tracking
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [lastReactionTime, setLastReactionTime] = useState<number | null>(null);

  // Time settings based on difficulty
  const getTimeLimit = useCallback((diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 8000; // 8 seconds for math
      case 'medium': return 6000; // 6 seconds
      case 'hard': return 4000; // 4 seconds
    }
  }, []);

  // Time settings for Stroop (faster)
  const getStroopTimeLimit = useCallback((diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 5000;
      case 'medium': return 3000;
      case 'hard': return 2000;
    }
  }, []);

  // Start Stroop game
  const startStroopGame = useCallback(() => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setTotalQuestions(0);
    setStreak(0);
    setBestStreak(0);
    setReactionTimes([]);
    setLastReactionTime(null);
    setCurrentStroopQuestion(generateStroopQuestion(difficulty));
    setCurrentMathQuestion(null);
    setTimeLeft(getStroopTimeLimit(difficulty));
    setQuestionStartTime(Date.now());
  }, [difficulty, getStroopTimeLimit]);

  // Start Math game
  const startMathGame = useCallback(() => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setTotalQuestions(0);
    setStreak(0);
    setBestStreak(0);
    setReactionTimes([]);
    setLastReactionTime(null);
    setCurrentMathQuestion(generateMathQuestion(difficulty));
    setCurrentStroopQuestion(null);
    setTimeLeft(getTimeLimit(difficulty));
    setQuestionStartTime(Date.now());
  }, [difficulty, getTimeLimit]);

  // Timer effect
  useEffect(() => {
    if (!isPlaying || gameOver || (!currentStroopQuestion && !currentMathQuestion)) return;

    const currentTimeLimit = selectedGame === 'stroop' ? getStroopTimeLimit(difficulty) : getTimeLimit(difficulty);

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          // Time's up - wrong answer
          if (selectedGame === 'stroop') {
            handleStroopAnswer('timeout');
          } else if (selectedGame === 'math') {
            handleMathAnswer(-999); // Impossible answer for timeout
          }
          return currentTimeLimit;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, gameOver, currentStroopQuestion, currentMathQuestion, selectedGame, difficulty, getTimeLimit, getStroopTimeLimit]);


  // Handle Stroop answer
  const handleStroopAnswer = useCallback((selectedColor: string) => {
    if (!currentStroopQuestion || gameOver) return;

    // Calculate reaction time (only for non-timeout answers)
    if (selectedColor !== 'timeout' && questionStartTime > 0) {
      const reactionTime = Date.now() - questionStartTime;
      setLastReactionTime(reactionTime);
      setReactionTimes(prev => [...prev, reactionTime]);
    } else {
      setLastReactionTime(null);
    }

    const isCorrect = selectedColor === currentStroopQuestion.correctAnswer;
    
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
    
    // Generate next question (unlimited mode)
    setCurrentStroopQuestion(generateStroopQuestion(difficulty));
    setTimeLeft(getStroopTimeLimit(difficulty));
    setQuestionStartTime(Date.now());
  }, [currentStroopQuestion, gameOver, difficulty, getStroopTimeLimit, bestStreak, questionStartTime]);

  // Handle Math answer
  const handleMathAnswer = useCallback((selectedAnswer: number) => {
    if (!currentMathQuestion || gameOver) return;

    // Calculate reaction time (only for non-timeout answers)
    if (selectedAnswer !== -999 && questionStartTime > 0) {
      const reactionTime = Date.now() - questionStartTime;
      setLastReactionTime(reactionTime);
      setReactionTimes(prev => [...prev, reactionTime]);
    } else {
      setLastReactionTime(null);
    }

    const isCorrect = selectedAnswer === currentMathQuestion.correctAnswer;
    
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
    
    // Generate next question
    setCurrentMathQuestion(generateMathQuestion(difficulty));
    setTimeLeft(getTimeLimit(difficulty));
    setQuestionStartTime(Date.now());
  }, [currentMathQuestion, gameOver, difficulty, getTimeLimit, bestStreak, questionStartTime]);

  // End game manually
  const endGame = useCallback(() => {
    if (totalQuestions > 0) {
      setGameOver(true);
      setIsPlaying(false);
      toast.success(t('cognitive.gameComplete'));
    } else {
      resetGame();
    }
  }, [totalQuestions, t]);

  // Reset game
  const resetGame = () => {
    setIsPlaying(false);
    setGameOver(false);
    setCurrentStroopQuestion(null);
    setCurrentMathQuestion(null);
    setScore(0);
    setTotalQuestions(0);
    setStreak(0);
    setReactionTimes([]);
    setLastReactionTime(null);
  };

  // Go back to games
  const goBackToGames = () => {
    resetGame();
    setSelectedGame(null);
    setSelectedSubGame(null);
  };

  // Go back from subgame
  const goBackFromSubGame = () => {
    resetGame();
    setSelectedSubGame(null);
  };

  // Calculate average reaction time
  const averageReactionTime = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;
  
  // Calculate best reaction time
  const bestReactionTime = reactionTimes.length > 0 
    ? Math.min(...reactionTimes)
    : 0;

  // Render game selection
  const renderGameSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">{t('cognitive.selectGame')}</h2>
        <p className="text-sm text-muted-foreground">{t('cognitive.selectGameDescription')}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GAMES.map((game) => {
          const Icon = game.icon;
          const isAvailable = true; // All games now available
          
          return (
            <Card 
              key={game.id}
              className={`rounded-none cursor-pointer transition-all ${
                isAvailable 
                  ? 'hover:border-[#00ffba] hover:shadow-md' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => isAvailable && setSelectedGame(game.id)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-none ${isAvailable ? 'bg-[#00ffba]/10' : 'bg-muted'}`}>
                  <Icon className={`w-5 h-5 ${isAvailable ? 'text-[#00ffba]' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{t(game.labelKey)}</h3>
                  <p className="text-xs text-muted-foreground">{t(game.descriptionKey)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Render sub-game selection for Memory
  const renderMemorySubGames = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={goBackToGames}
        className="rounded-none mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('cognitive.back')}
      </Button>
      
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">Μνήμη</h2>
        <p className="text-sm text-muted-foreground">Επίλεξε τύπο παιχνιδιού</p>
      </div>
      
      <div className="space-y-3">
        <Card 
          className="rounded-none cursor-pointer transition-all hover:border-[#00ffba] hover:shadow-md"
          onClick={() => setSelectedSubGame('memory-sequence')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-none bg-[#00ffba]/10">
              <Layers className="w-5 h-5 text-[#00ffba]" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">Θυμήσου τη Σειρά</h3>
              <p className="text-xs text-muted-foreground">Επανάλαβε τη σειρά που θα δεις</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
        
        <Card 
          className="rounded-none cursor-pointer transition-all hover:border-[#00ffba] hover:shadow-md"
          onClick={() => setSelectedSubGame('memory-pairs')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-none bg-[#00ffba]/10">
              <Grid3X3 className="w-5 h-5 text-[#00ffba]" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">Βρες τα Ζευγάρια</h3>
              <p className="text-xs text-muted-foreground">Βρες τις κάρτες που ταιριάζουν</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render sub-game selection for Logic
  const renderLogicSubGames = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={goBackToGames}
        className="rounded-none mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('cognitive.back')}
      </Button>
      
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">Λογική</h2>
        <p className="text-sm text-muted-foreground">Επίλεξε τύπο παιχνιδιού</p>
      </div>
      
      <div className="space-y-3">
        <Card 
          className="rounded-none cursor-pointer transition-all hover:border-[#00ffba] hover:shadow-md"
          onClick={() => setSelectedSubGame('logic-sequence')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-none bg-[#00ffba]/10">
              <Calculator className="w-5 h-5 text-[#00ffba]" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">Ακολουθίες Αριθμών</h3>
              <p className="text-xs text-muted-foreground">Βρες τον επόμενο αριθμό</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
        
        <Card 
          className="rounded-none cursor-pointer transition-all hover:border-[#00ffba] hover:shadow-md"
          onClick={() => setSelectedSubGame('logic-pattern')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-none bg-[#00ffba]/10">
              <Puzzle className="w-5 h-5 text-[#00ffba]" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">Αναγνώριση Μοτίβου</h3>
              <p className="text-xs text-muted-foreground">Βρες το επόμενο στο μοτίβο</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Get difficulty description for each game
  const getDifficultyDescription = (diff: Difficulty) => {
    if (selectedGame === 'stroop') {
      return diff === 'easy' ? '5s' : diff === 'medium' ? '3s' : '2s';
    } else if (selectedGame === 'math') {
      return diff === 'easy' ? '+/- (8s)' : diff === 'medium' ? '+/-/× (6s)' : '+/-/×/÷ (4s)';
    } else if (selectedSubGame === 'memory-sequence') {
      return diff === 'easy' ? '4 πλακίδια' : diff === 'medium' ? '6 πλακίδια' : '9 πλακίδια';
    } else if (selectedSubGame === 'memory-pairs') {
      return diff === 'easy' ? '6 ζευγάρια' : diff === 'medium' ? '8 ζευγάρια' : '12 ζευγάρια';
    } else if (selectedSubGame === 'logic-sequence') {
      return diff === 'easy' ? 'Απλές' : diff === 'medium' ? 'Μέτριες' : 'Σύνθετες';
    } else if (selectedSubGame === 'logic-pattern') {
      return diff === 'easy' ? 'Σχήμα' : diff === 'medium' ? 'Σχήμα/Χρώμα' : 'Συνδυασμός';
    }
    return '';
  };

  // Get game-specific instruction
  const getGameInstruction = () => {
    if (selectedGame === 'stroop') {
      return t('cognitive.games.stroop.instruction');
    } else if (selectedGame === 'math') {
      return 'Λύσε τις πράξεις όσο πιο γρήγορα μπορείς!';
    } else if (selectedSubGame === 'memory-sequence') {
      return 'Θυμήσου και επανάλαβε τη σειρά!';
    } else if (selectedSubGame === 'memory-pairs') {
      return 'Βρες όλα τα ζευγάρια!';
    } else if (selectedSubGame === 'logic-sequence') {
      return 'Βρες τον επόμενο αριθμό της ακολουθίας!';
    } else if (selectedSubGame === 'logic-pattern') {
      return 'Βρες το επόμενο στοιχείο του μοτίβου!';
    }
    return '';
  };

  // Start game based on type
  const startGame = () => {
    if (selectedGame === 'stroop') {
      startStroopGame();
    } else if (selectedGame === 'math') {
      startMathGame();
    } else if (selectedSubGame) {
      setIsPlaying(true);
    }
  };

  // Render difficulty selection
  const renderDifficultySelection = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (selectedSubGame) {
            setSelectedSubGame(null);
          } else {
            setSelectedGame(null);
          }
        }}
        className="rounded-none mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('cognitive.back')}
      </Button>
      
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">{t('cognitive.selectDifficulty')}</h2>
        <p className="text-sm text-muted-foreground">{getGameInstruction()}</p>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
          <Button
            key={diff}
            variant={difficulty === diff ? 'default' : 'outline'}
            className={`rounded-none h-16 flex flex-col gap-1 ${
              difficulty === diff ? 'bg-[#00ffba] text-black hover:bg-[#00ffba]/90' : ''
            }`}
            onClick={() => setDifficulty(diff)}
          >
            <span className="font-medium">{t(`cognitive.difficulty.${diff}`)}</span>
            <span className="text-xs opacity-70">
              {getDifficultyDescription(diff)}
            </span>
          </Button>
        ))}
      </div>
      
      <Button
        className="w-full rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90 mt-4"
        onClick={startGame}
      >
        <Play className="w-4 h-4 mr-2" />
        {t('cognitive.startGame')}
      </Button>
    </div>
  );

  // Render game header (shared)
  const renderGameHeader = () => {
    const currentTimeLimit = selectedGame === 'stroop' ? getStroopTimeLimit(difficulty) : getTimeLimit(difficulty);
    const progress = (timeLeft / currentTimeLimit) * 100;
    
    return (
      <>
        {/* Header with score and timer */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#00ffba]">{score}</div>
              <div className="text-xs text-muted-foreground">{t('cognitive.score')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium">{totalQuestions}</div>
              <div className="text-xs text-muted-foreground">{t('cognitive.questions')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-[#cb8954]">
                {averageReactionTime > 0 ? `${(averageReactionTime / 1000).toFixed(2)}s` : '-'}
              </div>
              <div className="text-xs text-muted-foreground">Μ.Ο. Αντ.</div>
            </div>
            {lastReactionTime && (
              <div className="text-center">
                <div className="text-lg font-medium text-blue-500">
                  {(lastReactionTime / 1000).toFixed(2)}s
                </div>
                <div className="text-xs text-muted-foreground">Τελευταία</div>
              </div>
            )}
            {streak > 1 && (
              <Badge className="rounded-none bg-[#cb8954] text-white">
                🔥 {streak}
              </Badge>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={endGame}
            className="rounded-none"
          >
            {t('cognitive.endGame')}
          </Button>
        </div>
        
        {/* Timer bar */}
        <div className="h-2 bg-muted rounded-none overflow-hidden">
          <div 
            className="h-full bg-[#00ffba] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </>
    );
  };

  // Render Stroop game
  const renderStroopGame = () => {
    if (!currentStroopQuestion) return null;
    
    return (
      <div className="space-y-4">
        {renderGameHeader()}
        
        {/* Question display */}
        <div 
          className="p-8 rounded-none flex items-center justify-center min-h-[150px]"
          style={{ backgroundColor: currentStroopQuestion.backgroundColor }}
        >
          <span 
            className="text-4xl sm:text-5xl font-bold tracking-wider"
            style={{ color: currentStroopQuestion.textColor }}
          >
            {currentStroopQuestion.text}
          </span>
        </div>
        
        {/* Instruction */}
        <p className="text-center text-sm text-muted-foreground">
          {t('cognitive.games.stroop.selectColor')}
        </p>
        
        {/* Answer options (buttons) */}
        <div className={`grid gap-2 ${
          currentStroopQuestion.options.length <= 3 ? 'grid-cols-3' : 
          currentStroopQuestion.options.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 
          currentStroopQuestion.options.length <= 6 ? 'grid-cols-3 sm:grid-cols-6' :
          'grid-cols-4 sm:grid-cols-6'
        }`}>
          {currentStroopQuestion.options.map((option) => (
            <Button
              key={option.color}
              className="rounded-none h-14 sm:h-16 border-2 transition-transform hover:scale-105"
              style={{ 
                backgroundColor: option.hex,
                borderColor: option.hex,
              }}
              onClick={() => handleStroopAnswer(option.color)}
            >
              <span className="sr-only">{option.color}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Render Math game
  const renderMathGame = () => {
    if (!currentMathQuestion) return null;
    
    return (
      <div className="space-y-3">
        {renderGameHeader()}
        
        {/* Question display */}
        <div className="p-4 sm:p-6 rounded-none flex items-center justify-center min-h-[100px] bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44]">
          <span className="text-3xl sm:text-4xl font-bold tracking-wider text-white">
            {currentMathQuestion.display}
          </span>
        </div>
        
        {/* Answer options */}
        <div className="grid grid-cols-2 gap-2">
          {currentMathQuestion.options.map((option, index) => (
            <Button
              key={index}
              className="rounded-none h-12 text-xl font-bold transition-transform hover:scale-105 bg-muted text-blue-900 hover:bg-[#00ffba] hover:text-black"
              onClick={() => handleMathAnswer(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Render game over screen
  const renderGameOver = () => {
    const percentage = Math.round((score / totalQuestions) * 100);
    
    return (
      <div className="text-center space-y-6 py-8">
        <Trophy className="w-16 h-16 mx-auto text-[#cb8954]" />
        
        <div>
          <h2 className="text-2xl font-bold mb-2">{t('cognitive.gameComplete')}</h2>
          <p className="text-muted-foreground">{t('cognitive.yourResults')}</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold text-[#00ffba]">{score}</div>
            <div className="text-xs text-muted-foreground">{t('cognitive.correct')}</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold">{percentage}%</div>
            <div className="text-xs text-muted-foreground">{t('cognitive.accuracy')}</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-none">
            <div className="text-3xl font-bold text-[#cb8954]">{bestStreak}</div>
            <div className="text-xs text-muted-foreground">{t('cognitive.bestStreak')}</div>
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
          <Button
            variant="outline"
            onClick={() => {
              resetGame();
              setSelectedGame(null);
            }}
            className="rounded-none"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('cognitive.backToGames')}
          </Button>
          <Button
            onClick={startGame}
            className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('cognitive.playAgain')}
          </Button>
        </div>
      </div>
    );
  };

  // Render current game
  const renderCurrentGame = () => {
    if (selectedGame === 'stroop') {
      return renderStroopGame();
    } else if (selectedGame === 'math') {
      return renderMathGame();
    } else if (selectedSubGame === 'memory-sequence') {
      return (
        <MemorySequenceGame
          difficulty={difficulty}
          onBack={goBackFromSubGame}
          onPlayAgain={() => setIsPlaying(true)}
        />
      );
    } else if (selectedSubGame === 'memory-pairs') {
      return (
        <MemoryPairsGame
          difficulty={difficulty}
          onBack={goBackFromSubGame}
          onPlayAgain={() => setIsPlaying(true)}
        />
      );
    } else if (selectedSubGame === 'logic-sequence') {
      return (
        <LogicSequenceGame
          difficulty={difficulty}
          onBack={goBackFromSubGame}
          onPlayAgain={() => setIsPlaying(true)}
        />
      );
    } else if (selectedSubGame === 'logic-pattern') {
      return (
        <LogicPatternGame
          difficulty={difficulty}
          onBack={goBackFromSubGame}
          onPlayAgain={() => setIsPlaying(true)}
        />
      );
    }
    return null;
  };

  // Check if we should show sub-game selection
  const shouldShowSubGameSelection = selectedGame && (selectedGame === 'memory' || selectedGame === 'logic') && !selectedSubGame;
  
  // Check if we should show difficulty selection
  const shouldShowDifficulty = 
    (selectedGame === 'stroop' || selectedGame === 'math') || 
    (selectedSubGame !== null);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        {/* Mobile sidebar overlay */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50 
          transform transition-transform duration-200 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {isAdmin() ? (
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          ) : (
            <CoachSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} contextCoachId={effectiveCoachId} />
          )}
        </div>
        
        <div className="flex-1 overflow-auto">
          {/* Mobile header with menu button */}
          <div className="lg:hidden sticky top-0 z-30 bg-background border-b p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(true)}
              className="rounded-none"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="p-2 sm:p-4 md:p-6">
            <div className="max-w-lg mx-auto">
              <Card className="rounded-none">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-[#00ffba]" />
                    {t('cognitive.title')}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                  {!selectedGame && renderGameSelection()}
                  {shouldShowSubGameSelection && selectedGame === 'memory' && renderMemorySubGames()}
                  {shouldShowSubGameSelection && selectedGame === 'logic' && renderLogicSubGames()}
                  {shouldShowDifficulty && !isPlaying && !gameOver && renderDifficultySelection()}
                  {isPlaying && !gameOver && renderCurrentGame()}
                  {gameOver && (selectedGame === 'stroop' || selectedGame === 'math') && renderGameOver()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CognitivePage;

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
  Timer
} from "lucide-react";
import { toast } from "sonner";

type Difficulty = 'easy' | 'medium' | 'hard';
type GameType = 'stroop' | 'math' | 'memory' | 'logic';

interface GameConfig {
  id: GameType;
  icon: React.ElementType;
  labelKey: string;
  descriptionKey: string;
}

const GAMES: GameConfig[] = [
  { id: 'stroop', icon: Palette, labelKey: 'cognitive.games.stroop.title', descriptionKey: 'cognitive.games.stroop.description' },
  { id: 'math', icon: Calculator, labelKey: 'cognitive.games.math.title', descriptionKey: 'cognitive.games.math.description' },
  { id: 'memory', icon: Grid3X3, labelKey: 'cognitive.games.memory.title', descriptionKey: 'cognitive.games.memory.description' },
  { id: 'logic', icon: Lightbulb, labelKey: 'cognitive.games.logic.title', descriptionKey: 'cognitive.games.logic.description' },
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

const CognitivePage: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useRoleCheck();
  const { effectiveCoachId } = useEffectiveCoachId();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Game state
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Stroop game state
  const [currentQuestion, setCurrentQuestion] = useState<StroopQuestion | null>(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Time settings based on difficulty
  const getTimeLimit = useCallback((diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 5000; // 5 seconds
      case 'medium': return 3000; // 3 seconds
      case 'hard': return 2000; // 2 seconds
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
    setCurrentQuestion(generateStroopQuestion(difficulty));
    setTimeLeft(getTimeLimit(difficulty));
  }, [difficulty, getTimeLimit]);

  // Timer effect
  useEffect(() => {
    if (!isPlaying || gameOver || !currentQuestion) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          // Time's up - wrong answer
          handleStroopAnswer('timeout');
          return getTimeLimit(difficulty);
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, gameOver, currentQuestion, difficulty, getTimeLimit]);


  // Handle answer
  const handleStroopAnswer = useCallback((selectedColor: string) => {
    if (!currentQuestion || gameOver) return;

    const isCorrect = selectedColor === currentQuestion.correctAnswer;
    
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
    setCurrentQuestion(generateStroopQuestion(difficulty));
    setTimeLeft(getTimeLimit(difficulty));
  }, [currentQuestion, gameOver, difficulty, getTimeLimit, bestStreak]);

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
    setCurrentQuestion(null);
    setScore(0);
    setTotalQuestions(0);
    setStreak(0);
  };

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
          const isAvailable = game.id === 'stroop'; // Only stroop is available for now
          
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
                {isAvailable ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Badge variant="outline" className="rounded-none text-xs">
                    {t('cognitive.comingSoon')}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Render difficulty selection
  const renderDifficultySelection = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSelectedGame(null)}
        className="rounded-none mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('cognitive.back')}
      </Button>
      
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">{t('cognitive.selectDifficulty')}</h2>
        <p className="text-sm text-muted-foreground">{t('cognitive.games.stroop.instruction')}</p>
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
              {diff === 'easy' ? '5s' : diff === 'medium' ? '3s' : '2s'}
            </span>
          </Button>
        ))}
      </div>
      
      <Button
        className="w-full rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90 mt-4"
        onClick={startStroopGame}
      >
        <Play className="w-4 h-4 mr-2" />
        {t('cognitive.startGame')}
      </Button>
    </div>
  );

  // Render Stroop game
  const renderStroopGame = () => {
    if (!currentQuestion) return null;
    
    const progress = (timeLeft / getTimeLimit(difficulty)) * 100;
    
    return (
      <div className="space-y-4">
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
        
        {/* Question display */}
        <div 
          className="p-8 rounded-none flex items-center justify-center min-h-[150px]"
          style={{ backgroundColor: currentQuestion.backgroundColor }}
        >
          <span 
            className="text-4xl sm:text-5xl font-bold tracking-wider"
            style={{ color: currentQuestion.textColor }}
          >
            {currentQuestion.text}
          </span>
        </div>
        
        {/* Instruction */}
        <p className="text-center text-sm text-muted-foreground">
          {t('cognitive.games.stroop.selectColor')}
        </p>
        
        {/* Answer options (buttons) */}
        <div className={`grid gap-2 ${
          currentQuestion.options.length <= 3 ? 'grid-cols-3' : 
          currentQuestion.options.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 
          currentQuestion.options.length <= 6 ? 'grid-cols-3 sm:grid-cols-6' :
          'grid-cols-4 sm:grid-cols-6'
        }`}>
          {currentQuestion.options.map((option) => (
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
        
        <div className="grid grid-cols-3 gap-4">
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
            onClick={startStroopGame}
            className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('cognitive.playAgain')}
          </Button>
        </div>
      </div>
    );
  };

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
                  {selectedGame && !isPlaying && !gameOver && renderDifficultySelection()}
                  {isPlaying && !gameOver && renderStroopGame()}
                  {gameOver && renderGameOver()}
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

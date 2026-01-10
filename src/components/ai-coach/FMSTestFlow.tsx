import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw,
  Play,
  Square,
  ArrowRight,
  Circle
} from "lucide-react";
import { FMSTestType } from '@/services/exerciseAnalyzer';
import { cn } from '@/lib/utils';

const FMS_TEST_ORDER: FMSTestType[] = [
  'shoulder-mobility',
  'active-straight-leg-raise',
  'deep-squat',
  'hurdle-step',
  'inline-lunge',
  'trunk-stability-pushup',
  'rotary-stability'
];

const TEST_LABELS: Record<FMSTestType, string> = {
  'shoulder-mobility': 'Shoulder',
  'active-straight-leg-raise': 'ASLR',
  'deep-squat': 'Deep Squ',
  'hurdle-step': 'Hurdle S',
  'inline-lunge': 'Inline L',
  'trunk-stability-pushup': 'Trunk Pu',
  'rotary-stability': 'Rotary S'
};

const CRITICAL_TESTS: FMSTestType[] = ['shoulder-mobility', 'active-straight-leg-raise'];

interface TestAttempt {
  attempt: number;
  score: 0 | 1 | 2 | 3;
}

interface TestResult {
  test: FMSTestType;
  bestScore: 0 | 1 | 2 | 3;
  attempts: TestAttempt[];
  skipped?: boolean;
}

interface FMSTestFlowProps {
  currentTest: FMSTestType;
  currentScore: 0 | 1 | 2 | 3 | null;
  isSessionActive: boolean;
  onTestChange: (test: FMSTestType) => void;
  onRecordAttempt: () => void;
  onComplete: (results: TestResult[], isNonFunctional: boolean, failedTests: FMSTestType[]) => void;
}

export const FMSTestFlow: React.FC<FMSTestFlowProps> = ({
  currentTest,
  currentScore,
  isSessionActive,
  onTestChange,
  onRecordAttempt,
  onComplete
}) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [flowStarted, setFlowStarted] = useState(false);
  const [flowComplete, setFlowComplete] = useState(false);
  const [isNonFunctional, setIsNonFunctional] = useState(false);
  const [failedCriticalTests, setFailedCriticalTests] = useState<FMSTestType[]>([]);
  const [attemptInProgress, setAttemptInProgress] = useState(false);
  const [bestScoreInAttempt, setBestScoreInAttempt] = useState<0 | 1 | 2 | 3>(0);
  const [attemptRecorded, setAttemptRecorded] = useState(false);

  const currentTestIndex = FMS_TEST_ORDER.indexOf(currentTest);

  useEffect(() => {
    if (attemptInProgress && currentScore !== null) {
      if (currentScore > bestScoreInAttempt) {
        setBestScoreInAttempt(currentScore);
      }
    }
  }, [currentScore, attemptInProgress, bestScoreInAttempt]);

  const progress = useMemo(() => {
    if (isNonFunctional) {
      const criticalIndex = Math.max(...failedCriticalTests.map(t => FMS_TEST_ORDER.indexOf(t))) + 1;
      return (criticalIndex / FMS_TEST_ORDER.length) * 100;
    }
    return (results.length / FMS_TEST_ORDER.length) * 100;
  }, [results, isNonFunctional, failedCriticalTests]);

  const startAttempt = useCallback(() => {
    setAttemptInProgress(true);
    setBestScoreInAttempt(0);
    setAttemptRecorded(false);
  }, []);

  const endAttempt = useCallback(() => {
    if (!attemptInProgress) return;
    setAttemptInProgress(false);
    setAttemptRecorded(true);
    const scoreToRecord = bestScoreInAttempt;
    
    setResults(prevResults => {
      const existingResult = prevResults.find(r => r.test === currentTest);
      if (existingResult) {
        return prevResults.map(r => {
          if (r.test === currentTest) {
            return {
              ...r,
              bestScore: Math.max(r.bestScore, scoreToRecord) as 0 | 1 | 2 | 3,
              attempts: [...r.attempts, { attempt: currentAttempt, score: scoreToRecord }]
            };
          }
          return r;
        });
      }
      return [...prevResults, {
        test: currentTest,
        bestScore: scoreToRecord,
        attempts: [{ attempt: currentAttempt, score: scoreToRecord }]
      }];
    });
    onRecordAttempt();
  }, [attemptInProgress, bestScoreInAttempt, currentTest, currentAttempt, onRecordAttempt]);

  const proceedNext = useCallback(() => {
    if (!attemptRecorded) return;
    const currentResult = results.find(r => r.test === currentTest);
    const bestOverall = currentResult?.bestScore ?? bestScoreInAttempt;
    const shouldMoveNext = bestOverall === 3 || currentAttempt >= 3;

    if (shouldMoveNext) {
      if (CRITICAL_TESTS.includes(currentTest) && bestOverall === 1) {
        const newFailedTests = [...failedCriticalTests, currentTest];
        setFailedCriticalTests(newFailedTests);
        if (currentTest === 'active-straight-leg-raise') {
          setIsNonFunctional(true);
          setFlowComplete(true);
          const remainingTests = FMS_TEST_ORDER.slice(currentTestIndex + 1);
          const skippedResults = remainingTests.map(test => ({ test, bestScore: 0 as const, attempts: [], skipped: true }));
          onComplete([...results, ...skippedResults], true, newFailedTests);
          return;
        }
      }
      const nextIndex = currentTestIndex + 1;
      if (nextIndex >= FMS_TEST_ORDER.length) {
        setFlowComplete(true);
        onComplete(results, false, []);
        return;
      }
      setCurrentAttempt(1);
      setAttemptRecorded(false);
      setBestScoreInAttempt(0);
      onTestChange(FMS_TEST_ORDER[nextIndex]);
    } else {
      setCurrentAttempt(prev => prev + 1);
      setAttemptRecorded(false);
      setBestScoreInAttempt(0);
    }
  }, [attemptRecorded, results, currentTest, currentAttempt, failedCriticalTests, currentTestIndex, onTestChange, onComplete, bestScoreInAttempt]);

  const startFlow = useCallback(() => {
    setFlowStarted(true);
    setResults([]);
    setCurrentAttempt(1);
    setFlowComplete(false);
    setIsNonFunctional(false);
    setFailedCriticalTests([]);
    setAttemptInProgress(false);
    setBestScoreInAttempt(0);
    setAttemptRecorded(false);
    onTestChange(FMS_TEST_ORDER[0]);
  }, [onTestChange]);

  const resetFlow = useCallback(() => {
    setFlowStarted(false);
    setResults([]);
    setCurrentAttempt(1);
    setFlowComplete(false);
    setIsNonFunctional(false);
    setFailedCriticalTests([]);
    setAttemptInProgress(false);
    setBestScoreInAttempt(0);
    setAttemptRecorded(false);
  }, []);

  const currentTestResult = results.find(r => r.test === currentTest);
  const currentTestBestScore = currentTestResult?.bestScore ?? bestScoreInAttempt;

  // Start screen
  if (!flowStarted) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">FMS Battery</span>
          <span className="text-xs text-muted-foreground">7 τεστ • 3 προσπάθειες/τεστ</span>
        </div>
        <Button onClick={startFlow} className="w-full h-8 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none text-sm">
          <Play className="w-3 h-3 mr-1" />
          Έναρξη FMS
        </Button>
      </div>
    );
  }

  // Complete screen
  if (flowComplete) {
    const totalScore = results.filter(r => !r.skipped).reduce((sum, r) => sum + r.bestScore, 0);
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Αποτελέσματα</span>
          <span className="font-bold">{totalScore}/21</span>
        </div>
        {isNonFunctional && (
          <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 p-1 border border-red-200">
            <AlertTriangle className="w-3 h-3" />
            Μη λειτουργικός - Χρειάζεται διορθωτικό
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {results.filter(r => !r.skipped).map(r => (
            <Badge key={r.test} className={cn("rounded-none text-xs", r.bestScore === 3 ? "bg-green-500" : r.bestScore === 2 ? "bg-yellow-500" : "bg-red-500")}>
              {TEST_LABELS[r.test]}:{r.bestScore}
            </Badge>
          ))}
        </div>
        <Button onClick={resetFlow} variant="outline" size="sm" className="w-full h-7 rounded-none text-xs">
          <RotateCcw className="w-3 h-3 mr-1" />Νέο
        </Button>
      </div>
    );
  }

  // Active flow - COMPACT
  return (
    <div className="space-y-2">
      {/* Progress Row */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Πρόοδος</span>
        <Progress value={progress} className="h-1.5 flex-1 rounded-none" />
        <span className="text-xs font-medium">{currentTestIndex + 1}/7</span>
      </div>

      {/* Current Test + Score Row */}
      <div className="flex items-center justify-between p-2 bg-[#00ffba]/10 border border-[#00ffba]/30">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{TEST_LABELS[currentTest]}</span>
          <Badge variant="outline" className="rounded-none text-xs h-5">{currentAttempt}/3</Badge>
          {CRITICAL_TESTS.includes(currentTest) && <AlertTriangle className="w-3 h-3 text-orange-500" />}
        </div>
        <Badge className={cn(
          "rounded-none text-white px-3",
          attemptInProgress ? (
            bestScoreInAttempt === 3 ? "bg-green-500" : bestScoreInAttempt === 2 ? "bg-yellow-500" : "bg-red-500"
          ) : attemptRecorded ? (
            currentTestBestScore === 3 ? "bg-green-500" : currentTestBestScore === 2 ? "bg-yellow-500" : "bg-red-500"
          ) : "bg-gray-400"
        )}>
          {attemptInProgress ? (
            <><Circle className="w-2 h-2 mr-1 fill-current animate-pulse" />{bestScoreInAttempt}/3</>
          ) : (
            <>{currentTestBestScore}/3</>
          )}
        </Badge>
      </div>

      {/* Action Button */}
      {!attemptInProgress && !attemptRecorded && (
        <Button onClick={startAttempt} disabled={!isSessionActive} className="w-full h-8 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none text-sm">
          <Play className="w-3 h-3 mr-1" />Έναρξη Προσπάθειας
        </Button>
      )}
      {attemptInProgress && (
        <Button onClick={endAttempt} className="w-full h-8 bg-red-500 hover:bg-red-600 text-white rounded-none text-sm">
          <Square className="w-3 h-3 mr-1" />Τέλος (Best: {bestScoreInAttempt})
        </Button>
      )}
      {attemptRecorded && (
        <Button onClick={proceedNext} className="w-full h-8 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none text-sm">
          {currentTestBestScore === 3 || currentAttempt >= 3 ? (
            <><ArrowRight className="w-3 h-3 mr-1" />Επόμενο Τεστ</>
          ) : (
            <><CheckCircle className="w-3 h-3 mr-1" />Καταχώρηση & Επόμενη</>
          )}
        </Button>
      )}

      {/* Test Queue - inline */}
      <div className="flex flex-wrap gap-1">
        {FMS_TEST_ORDER.map((test, idx) => {
          const result = results.find(r => r.test === test);
          const isCurrent = test === currentTest;
          return (
            <Badge key={test} variant={isCurrent ? "default" : "outline"} className={cn(
              "rounded-none text-xs h-5 px-1",
              isCurrent && "bg-[#00ffba] text-black",
              !isCurrent && result && (
                result.bestScore === 3 ? "bg-green-100 text-green-700" :
                result.bestScore === 2 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              )
            )}>
              {TEST_LABELS[test]}{result ? `(${result.bestScore})` : ''}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

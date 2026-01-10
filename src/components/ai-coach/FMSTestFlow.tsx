import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw,
  Play,
  Square,
  ArrowRight
} from "lucide-react";
import { FMSTestType } from '@/services/exerciseAnalyzer';
import { cn } from '@/lib/utils';

// Σειρά εκτέλεσης τεστ FMS
const FMS_TEST_ORDER: FMSTestType[] = [
  'shoulder-mobility',
  'active-straight-leg-raise',
  'deep-squat',
  'hurdle-step',
  'inline-lunge',
  'trunk-stability-pushup',
  'rotary-stability'
];

const TEST_LABELS: Record<FMSTestType, { name: string; description: string }> = {
  'shoulder-mobility': { name: 'Shoulder Mobility', description: 'Κινητικότητα ώμων' },
  'active-straight-leg-raise': { name: 'ASLR', description: 'Ενεργή ανύψωση ποδιού' },
  'deep-squat': { name: 'Deep Squat', description: 'Βαθύ κάθισμα' },
  'hurdle-step': { name: 'Hurdle Step', description: 'Βήμα πάνω από εμπόδιο' },
  'inline-lunge': { name: 'Inline Lunge', description: 'Προβολή σε ευθεία' },
  'trunk-stability-pushup': { name: 'Trunk Push-Up', description: 'Σταθερότητα κορμού' },
  'rotary-stability': { name: 'Rotary Stability', description: 'Στροφική σταθερότητα' }
};

// Τεστ που αν score=1 σημαίνει non-functional
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

  // Βρες το τρέχον index του τεστ
  const currentTestIndex = FMS_TEST_ORDER.indexOf(currentTest);

  // Υπολόγισε τα completed tests
  const completedTests = useMemo(() => {
    return results.map(r => r.test);
  }, [results]);

  // Υπολόγισε την πρόοδο
  const progress = useMemo(() => {
    if (isNonFunctional) {
      // Αν είναι non-functional, έχουμε τελειώσει με τα critical tests
      const criticalIndex = Math.max(
        ...failedCriticalTests.map(t => FMS_TEST_ORDER.indexOf(t))
      ) + 1;
      return (criticalIndex / FMS_TEST_ORDER.length) * 100;
    }
    return (results.length / FMS_TEST_ORDER.length) * 100;
  }, [results, isNonFunctional, failedCriticalTests]);

  // Καταχώρησε προσπάθεια
  const recordAttempt = useCallback(() => {
    if (currentScore === null) return;

    const existingResult = results.find(r => r.test === currentTest);
    
    if (existingResult) {
      // Ενημέρωσε υπάρχον αποτέλεσμα
      const updatedResults = results.map(r => {
        if (r.test === currentTest) {
          const newAttempts = [...r.attempts, { attempt: currentAttempt, score: currentScore }];
          return {
            ...r,
            bestScore: Math.max(r.bestScore, currentScore) as 0 | 1 | 2 | 3,
            attempts: newAttempts
          };
        }
        return r;
      });
      setResults(updatedResults);
    } else {
      // Νέο αποτέλεσμα
      const newResult: TestResult = {
        test: currentTest,
        bestScore: currentScore,
        attempts: [{ attempt: 1, score: currentScore }]
      };
      setResults([...results, newResult]);
    }

    // Έλεγχος αν score=3 ή τελείωσαν οι 3 προσπάθειες
    const shouldMoveNext = currentScore === 3 || currentAttempt >= 3;
    
    if (shouldMoveNext) {
      // Έλεγχος αν είναι critical test με score=1
      if (CRITICAL_TESTS.includes(currentTest) && currentScore === 1) {
        const newFailedTests = [...failedCriticalTests, currentTest];
        setFailedCriticalTests(newFailedTests);

        // Αν και τα δύο critical tests έχουν αποτύχει ή είμαστε στο ASLR
        if (currentTest === 'active-straight-leg-raise' && newFailedTests.includes('shoulder-mobility')) {
          setIsNonFunctional(true);
          setFlowComplete(true);
          
          // Σημείωσε τα υπόλοιπα tests ως skipped
          const remainingTests = FMS_TEST_ORDER.slice(currentTestIndex + 1);
          const skippedResults: TestResult[] = remainingTests.map(test => ({
            test,
            bestScore: 0,
            attempts: [],
            skipped: true
          }));
          
          const finalResults = [...results, {
            test: currentTest,
            bestScore: currentScore,
            attempts: [{ attempt: currentAttempt, score: currentScore }]
          }, ...skippedResults];
          
          onComplete(finalResults, true, newFailedTests);
          return;
        }
      }

      // Πήγαινε στο επόμενο τεστ
      moveToNextTest();
    } else {
      // Επόμενη προσπάθεια
      setCurrentAttempt(prev => prev + 1);
    }

    onRecordAttempt();
  }, [currentScore, currentTest, currentAttempt, results, failedCriticalTests, currentTestIndex, onRecordAttempt, onComplete]);

  // Μετάβαση στο επόμενο τεστ
  const moveToNextTest = useCallback(() => {
    const nextIndex = currentTestIndex + 1;
    
    if (nextIndex >= FMS_TEST_ORDER.length) {
      // Τελείωσαν όλα τα τεστ
      setFlowComplete(true);
      onComplete(results, isNonFunctional, failedCriticalTests);
      return;
    }

    const nextTest = FMS_TEST_ORDER[nextIndex];
    setCurrentAttempt(1);
    onTestChange(nextTest);
  }, [currentTestIndex, results, isNonFunctional, failedCriticalTests, onTestChange, onComplete]);

  // Ξεκίνα τη ροή
  const startFlow = useCallback(() => {
    setFlowStarted(true);
    setResults([]);
    setCurrentAttempt(1);
    setFlowComplete(false);
    setIsNonFunctional(false);
    setFailedCriticalTests([]);
    onTestChange(FMS_TEST_ORDER[0]);
  }, [onTestChange]);

  // Reset flow
  const resetFlow = useCallback(() => {
    setFlowStarted(false);
    setResults([]);
    setCurrentAttempt(1);
    setFlowComplete(false);
    setIsNonFunctional(false);
    setFailedCriticalTests([]);
  }, []);

  // Αν δεν έχει ξεκινήσει η ροή
  if (!flowStarted) {
    return (
      <Card className="p-4 rounded-none border-[#00ffba]/30">
        <div className="text-center space-y-4">
          <h3 className="font-semibold text-lg">FMS Test Battery</h3>
          <p className="text-sm text-muted-foreground">
            Αυτοματοποιημένη ροή FMS τεστ με 7 ασκήσεις. 
            Κάθε άσκηση επιτρέπει έως 3 προσπάθειες.
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Αν πάρεις <Badge className="bg-green-500 text-white rounded-none text-xs">3</Badge> στην πρώτη προσπάθεια → επόμενο τεστ</p>
            <p>• Αν πάρεις <Badge className="bg-red-500 text-white rounded-none text-xs">1</Badge> σε Shoulder Mobility ή ASLR → μη λειτουργικός</p>
          </div>
          <Button 
            onClick={startFlow} 
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Έναρξη FMS Battery
          </Button>
        </div>
      </Card>
    );
  }

  // Αν έχει τελειώσει
  if (flowComplete) {
    return (
      <Card className="p-4 rounded-none border-[#00ffba]/30">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Αποτελέσματα FMS</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetFlow}
              className="rounded-none"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Νέο Test
            </Button>
          </div>

          {isNonFunctional && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-none">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">Μη Λειτουργικός Χρήστης</p>
                  <p className="text-sm text-red-600">
                    Score 1 σε: {failedCriticalTests.map(t => TEST_LABELS[t].name).join(' & ')}
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Απαιτείται διορθωτικό πρόγραμμα πριν συνεχίσει με τα υπόλοιπα τεστ.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {results.filter(r => !r.skipped).map(result => (
              <div 
                key={result.test} 
                className="flex items-center justify-between p-2 bg-gray-50 border"
              >
                <div>
                  <p className="font-medium text-sm">{TEST_LABELS[result.test].name}</p>
                  <p className="text-xs text-muted-foreground">
                    {result.attempts.length} προσπάθει{result.attempts.length > 1 ? 'ες' : 'α'}
                  </p>
                </div>
                <Badge 
                  className={cn(
                    "rounded-none text-white",
                    result.bestScore === 3 ? "bg-green-500" :
                    result.bestScore === 2 ? "bg-yellow-500" :
                    "bg-red-500"
                  )}
                >
                  {result.bestScore}/3
                </Badge>
              </div>
            ))}
          </div>

          {/* Total Score */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Συνολικό Score:</span>
              <span className="text-xl font-bold">
                {results.filter(r => !r.skipped).reduce((sum, r) => sum + r.bestScore, 0)} / 21
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Ενεργή ροή
  return (
    <Card className="p-4 rounded-none border-[#00ffba]/30">
      <div className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Πρόοδος</span>
            <span>{currentTestIndex + 1} / {FMS_TEST_ORDER.length}</span>
          </div>
          <Progress value={progress} className="h-2 rounded-none" />
        </div>

        {/* Current Test */}
        <div className="bg-[#00ffba]/10 p-3 border border-[#00ffba]/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold">{TEST_LABELS[currentTest].name}</h4>
              <p className="text-xs text-muted-foreground">{TEST_LABELS[currentTest].description}</p>
            </div>
            <Badge variant="outline" className="rounded-none">
              Προσπάθεια {currentAttempt}/3
            </Badge>
          </div>

          {CRITICAL_TESTS.includes(currentTest) && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Κρίσιμο τεστ - Score 1 σημαίνει μη λειτουργικός
            </p>
          )}
        </div>

        {/* Current Score Display */}
        {currentScore !== null && (
          <div className="flex items-center justify-between p-3 bg-gray-50 border">
            <span className="font-medium">Τρέχον Score:</span>
            <Badge 
              className={cn(
                "rounded-none text-white text-lg px-4 py-1",
                currentScore === 3 ? "bg-green-500" :
                currentScore === 2 ? "bg-yellow-500" :
                "bg-red-500"
              )}
            >
              {currentScore}/3
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!isSessionActive ? (
            <Button 
              onClick={recordAttempt}
              disabled={currentScore === null}
              className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              {currentScore === 3 || currentAttempt >= 3 ? (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Επόμενο Τεστ
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Καταχώρηση & Επόμενη Προσπάθεια
                </>
              )}
            </Button>
          ) : (
            <div className="flex-1 text-center text-sm text-muted-foreground py-2">
              Σταμάτησε την εγγραφή για να καταχωρήσεις
            </div>
          )}
        </div>

        {/* Test Queue */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Σειρά τεστ:</p>
          <div className="flex flex-wrap gap-1">
            {FMS_TEST_ORDER.map((test, idx) => {
              const result = results.find(r => r.test === test);
              const isCurrent = test === currentTest;
              const isPast = idx < currentTestIndex;
              
              return (
                <Badge 
                  key={test}
                  variant={isCurrent ? "default" : "outline"}
                  className={cn(
                    "rounded-none text-xs",
                    isCurrent && "bg-[#00ffba] text-black",
                    isPast && result && (
                      result.bestScore === 3 ? "bg-green-100 text-green-700 border-green-300" :
                      result.bestScore === 2 ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                      "bg-red-100 text-red-700 border-red-300"
                    )
                  )}
                >
                  {TEST_LABELS[test].name.slice(0, 8)}
                  {result && ` (${result.bestScore})`}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

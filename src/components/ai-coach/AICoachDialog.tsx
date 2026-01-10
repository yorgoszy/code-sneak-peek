import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Square, Play, RotateCcw, Dumbbell, ClipboardCheck, AlertCircle, Loader2 } from "lucide-react";
import Webcam from 'react-webcam';
import { usePoseDetection, PoseResult } from '@/hooks/usePoseDetection';
import { 
  analyzeSquat, 
  analyzePushUp, 
  analyzeLunge, 
  getFMSTestScorer,
  ExerciseAnalysis,
  FMSTestType
} from '@/services/exerciseAnalyzer';
import { FeedbackPanel } from './FeedbackPanel';

interface AICoachDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExerciseType = 'squat' | 'pushup' | 'lunge';

const EXERCISES: Record<ExerciseType, { name: string; description: string }> = {
  squat: { name: 'Squat', description: 'Ανάλυση βαθέος καθίσματος' },
  pushup: { name: 'Push-Up', description: 'Ανάλυση κάμψεων' },
  lunge: { name: 'Lunge', description: 'Ανάλυση προβολών' },
};

const TESTS: Record<FMSTestType, { name: string; description: string }> = {
  'deep-squat': { name: 'Deep Squat', description: 'Βαθύ κάθισμα (0-3)' },
  'hurdle-step': { name: 'Hurdle Step', description: 'Βήμα πάνω από εμπόδιο (0-3)' },
  'inline-lunge': { name: 'Inline Lunge', description: 'Προβολή σε ευθεία (0-3)' },
  'shoulder-mobility': { name: 'Shoulder Mobility', description: 'Κινητικότητα ώμων (0-3)' },
  'active-straight-leg-raise': { name: 'ASLR', description: 'Ενεργή ανύψωση ποδιού (0-3)' },
  'trunk-stability-pushup': { name: 'Trunk Push-Up', description: 'Σταθερότητα κορμού (0-3)' },
  'rotary-stability': { name: 'Rotary Stability', description: 'Στροφική σταθερότητα (0-3)' },
};

export const AICoachDialog: React.FC<AICoachDialogProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'exercise' | 'test'>('exercise');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squat');
  const [selectedTest, setSelectedTest] = useState<FMSTestType>('deep-squat');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [analysis, setAnalysis] = useState<ExerciseAnalysis | null>(null);
  const [fmsScore, setFmsScore] = useState<{ score: 0 | 1 | 2 | 3; feedback: string[] } | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [lastPhase, setLastPhase] = useState<string>('unknown');
  
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { 
    initialize, 
    start, 
    stop, 
    isLoading, 
    isRunning, 
    error, 
    currentPose 
  } = usePoseDetection({
    onResults: handlePoseResults,
  });

  // Initialize pose detection when dialog opens
  useEffect(() => {
    if (isOpen) {
      initialize();
    }
  }, [isOpen, initialize]);

  // Handle pose results
  function handlePoseResults(result: PoseResult | null) {
    if (!result || !isSessionActive) return;

    if (mode === 'exercise') {
      let analysisResult: ExerciseAnalysis | null = null;
      
      switch (selectedExercise) {
        case 'squat':
          analysisResult = analyzeSquat(result.landmarks);
          break;
        case 'pushup':
          analysisResult = analyzePushUp(result.landmarks);
          break;
        case 'lunge':
          analysisResult = analyzeLunge(result.landmarks);
          break;
      }

      if (analysisResult) {
        setAnalysis(analysisResult);

        // Count reps (up -> down -> up = 1 rep)
        if (analysisResult.phase === 'up' && lastPhase === 'down') {
          setRepCount(prev => prev + 1);
        }
        setLastPhase(analysisResult.phase || 'unknown');
      }
    } else if (mode === 'test') {
      const scorer = getFMSTestScorer(selectedTest);
      const fmsResult = scorer(result.landmarks);
      setFmsScore(fmsResult);
    }
  }

  // Start camera and detection
  const handleStart = useCallback(() => {
    if (webcamRef.current?.video && canvasRef.current) {
      start(webcamRef.current.video, canvasRef.current);
      setIsSessionActive(true);
      setRepCount(0);
      setAnalysis(null);
      setFmsScore(null);
    }
  }, [start]);

  // Stop detection
  const handleStop = useCallback(() => {
    stop();
    setIsSessionActive(false);
  }, [stop]);

  // Reset session
  const handleReset = useCallback(() => {
    setRepCount(0);
    setAnalysis(null);
    setFmsScore(null);
    setLastPhase('unknown');
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-none p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#00ffba]" />
            AI Coach - Ανάλυση Κίνησης
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'exercise' | 'test')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none">
              <TabsTrigger value="exercise" className="rounded-none flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Άσκηση
              </TabsTrigger>
              <TabsTrigger value="test" className="rounded-none flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Τεστ FMS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="exercise" className="mt-4">
              <div className="flex gap-2 mb-4">
                {(Object.keys(EXERCISES) as ExerciseType[]).map((ex) => (
                  <Button
                    key={ex}
                    variant={selectedExercise === ex ? "default" : "outline"}
                    onClick={() => setSelectedExercise(ex)}
                    className="rounded-none"
                    disabled={isSessionActive}
                  >
                    {EXERCISES[ex].name}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="test" className="mt-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {(Object.keys(TESTS) as FMSTestType[]).map((test) => (
                  <Button
                    key={test}
                    variant={selectedTest === test ? "default" : "outline"}
                    onClick={() => setSelectedTest(test)}
                    className="rounded-none"
                    disabled={isSessionActive}
                  >
                    {TESTS[test].name}
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-none mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#00ffba]" />
              <span>Φόρτωση AI μοντέλου...</span>
            </div>
          )}

          {/* Camera and Canvas */}
          {!isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Video/Canvas area */}
              <div className="lg:col-span-2 relative">
                <div className="relative aspect-video bg-black rounded-none overflow-hidden">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored={true}
                    className="absolute inset-0 w-full h-full object-cover"
                    videoConstraints={{
                      facingMode: "user",
                      width: 1280,
                      height: 720,
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  
                  {/* Overlay badges */}
                  {isSessionActive && (
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <Badge className="bg-red-500 text-white rounded-none animate-pulse">
                        ● REC
                      </Badge>
                      {mode === 'exercise' && (
                        <Badge className="bg-[#00ffba] text-black rounded-none text-lg px-3 py-1">
                          Reps: {repCount}
                        </Badge>
                      )}
                      {mode === 'test' && fmsScore !== null && (
                        <Badge 
                          className={`text-lg px-3 py-1 rounded-none ${
                            fmsScore.score === 3 ? 'bg-green-500' :
                            fmsScore.score === 2 ? 'bg-yellow-500' :
                            'bg-red-500'
                          } text-white`}
                        >
                          Score: {fmsScore.score}/3
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Score overlay */}
                  {isSessionActive && analysis && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div 
                        className={`p-3 rounded-none ${
                          analysis.isCorrect 
                            ? 'bg-green-500/80' 
                            : 'bg-red-500/80'
                        } text-white`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {analysis.isCorrect ? '✓ Σωστή φόρμα' : '⚠ Διόρθωσε'}
                          </span>
                          <span className="text-lg font-bold">{analysis.score}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex gap-2 mt-4">
                  {!isSessionActive ? (
                    <Button 
                      onClick={handleStart} 
                      className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                      disabled={isLoading}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Έναρξη
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleStop} 
                        variant="destructive"
                        className="flex-1 rounded-none"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Διακοπή
                      </Button>
                      <Button 
                        onClick={handleReset} 
                        variant="outline"
                        className="rounded-none"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Feedback Panel */}
              <div className="lg:col-span-1">
                <FeedbackPanel
                  mode={mode}
                  exercise={mode === 'exercise' ? EXERCISES[selectedExercise] : undefined}
                  test={mode === 'test' ? TESTS[selectedTest] : undefined}
                  analysis={analysis}
                  fmsScore={fmsScore}
                  repCount={repCount}
                  isActive={isSessionActive}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

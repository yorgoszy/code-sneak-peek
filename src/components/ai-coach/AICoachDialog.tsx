import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Camera, Square, Play, RotateCcw, Dumbbell, ClipboardCheck, AlertCircle, 
  Loader2, Save, BarChart3, Volume2, VolumeX, Video, Download, Trash2 
} from "lucide-react";
import Webcam from 'react-webcam';
import { usePoseDetection, PoseResult } from '@/hooks/usePoseDetection';
import { useAICoachResults } from '@/hooks/useAICoachResults';
import { useAudioFeedback } from '@/hooks/useAudioFeedback';
import { useVideoRecording } from '@/hooks/useVideoRecording';
import { 
  analyzeSquat, 
  analyzePushUp, 
  analyzeLunge, 
  getFMSTestScorer,
  ExerciseAnalysis,
  FMSTestType
} from '@/services/exerciseAnalyzer';
import { FeedbackPanel } from './FeedbackPanel';
import { FMSProgressChart } from './FMSProgressChart';
import { AICoachUserSelector } from './AICoachUserSelector';
import { FMSTestFlow } from './FMSTestFlow';
import { toast } from 'sonner';

interface AICoachDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

type ExerciseType = 'squat' | 'pushup' | 'lunge';

const EXERCISES: Record<ExerciseType, { name: string; description: string }> = {
  squat: { name: 'Squat', description: 'Ανάλυση βαθέος καθίσματος' },
  pushup: { name: 'Push-Up', description: 'Ανάλυση κάμψεων' },
  lunge: { name: 'Lunge', description: 'Ανάλυση προβολών' },
};

const TESTS: Record<FMSTestType, { name: string; description: string }> = {
  'shoulder-mobility': { name: 'Shoulder Mobility', description: 'Κινητικότητα ώμων (0-3)' },
  'active-straight-leg-raise': { name: 'ASLR', description: 'Ενεργή ανύψωση ποδιού (0-3)' },
  'trunk-stability-pushup': { name: 'Trunk Push-Up', description: 'Σταθερότητα κορμού (0-3)' },
  'rotary-stability': { name: 'Rotary Stability', description: 'Στροφική σταθερότητα (0-3)' },
  'inline-lunge': { name: 'Inline Lunge', description: 'Προβολή σε ευθεία (0-3)' },
  'hurdle-step': { name: 'Hurdle Step', description: 'Βήμα πάνω από εμπόδιο (0-3)' },
  'deep-squat': { name: 'Deep Squat', description: 'Βαθύ κάθισμα (0-3)' },
};

export const AICoachDialog: React.FC<AICoachDialogProps> = ({ isOpen, onClose, userId: initialUserId }) => {
  const [mode, setMode] = useState<'exercise' | 'test' | 'progress'>('exercise');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squat');
  const [selectedTest, setSelectedTest] = useState<FMSTestType>('shoulder-mobility');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [analysis, setAnalysis] = useState<ExerciseAnalysis | null>(null);
  const [fmsScore, setFmsScore] = useState<{ score: 0 | 1 | 2 | 3; feedback: string[] } | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [lastPhase, setLastPhase] = useState<string>('unknown');
  const [canSave, setCanSave] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoRecordingEnabled, setVideoRecordingEnabled] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId || null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFeedbackRef = useRef<string>('');

  const { saveTestResult, saving } = useAICoachResults();

  // Audio feedback hook
  const audio = useAudioFeedback({ enabled: audioEnabled });

  // Video recording hook
  const videoRecording = useVideoRecording();

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
          audio.playRepCompleteSound();
        }
        setLastPhase(analysisResult.phase || 'unknown');

        // Audio feedback for form corrections
        if (analysisResult.feedback.length > 0) {
          const mainFeedback = analysisResult.feedback[0];
          if (mainFeedback !== lastFeedbackRef.current) {
            lastFeedbackRef.current = mainFeedback;
            
            // Only speak correction feedback
            if (!mainFeedback.includes('✓') && !mainFeedback.includes('💪') && !mainFeedback.includes('Τέλεια')) {
              audio.speakFeedback([mainFeedback], analysisResult.score);
            }
          }
        }
      }
    } else if (mode === 'test') {
      const scorer = getFMSTestScorer(selectedTest);
      const fmsResult = scorer(result.landmarks);
      
      // Announce score changes
      if (fmsScore === null || fmsResult.score !== fmsScore.score) {
        audio.announceFMSScore(fmsResult.score);
      }
      
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
      lastFeedbackRef.current = '';
      audio.playStartSound();

      // Start video recording if enabled
      if (videoRecordingEnabled && canvasRef.current) {
        videoRecording.startRecording(canvasRef.current);
      }
    }
  }, [start, audio, videoRecordingEnabled, videoRecording]);

  // Stop detection
  const handleStop = useCallback(() => {
    stop();
    setIsSessionActive(false);
    audio.playStopSound();
    audio.stop();

    // Stop video recording
    if (videoRecording.isRecording) {
      videoRecording.stopRecording();
    }

    // Enable save button after session ends if we have a score and user ID
    if (mode === 'test' && fmsScore !== null && selectedUserId) {
      setCanSave(true);
    }
  }, [stop, mode, fmsScore, selectedUserId, audio, videoRecording]);

  // Reset session
  const handleReset = useCallback(() => {
    setRepCount(0);
    setAnalysis(null);
    setFmsScore(null);
    setLastPhase('unknown');
    setCanSave(false);
    lastFeedbackRef.current = '';
    videoRecording.clearRecording();
  }, [videoRecording]);

  // Save FMS test result
  const handleSaveResult = useCallback(async () => {
    if (!selectedUserId || !fmsScore) {
      toast.error('Δεν υπάρχει χρήστης ή αποτέλεσμα για αποθήκευση');
      return;
    }

    const success = await saveTestResult({
      userId: selectedUserId,
      testType: selectedTest,
      score: fmsScore.score,
      feedback: fmsScore.feedback.join('; ')
    });

    if (success) {
      setCanSave(false);
      audio.playSuccessSound();
    }
  }, [selectedUserId, fmsScore, selectedTest, saveTestResult, audio]);

  // Handle user selection
  const handleUserSelect = useCallback((userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden rounded-none p-0">
        {/* Compact Header */}
        <DialogHeader className="p-2 border-b">
          <DialogTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#00ffba]" />
              <span>AI Coach</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Switch id="audio-toggle" checked={audioEnabled} onCheckedChange={setAudioEnabled} disabled={isSessionActive} className="scale-75" />
                {audioEnabled ? <Volume2 className="w-3 h-3 text-[#00ffba]" /> : <VolumeX className="w-3 h-3 text-gray-400" />}
              </div>
              <div className="flex items-center gap-1">
                <Switch id="recording-toggle" checked={videoRecordingEnabled} onCheckedChange={setVideoRecordingEnabled} disabled={isSessionActive} className="scale-75" />
                <Video className={`w-3 h-3 ${videoRecordingEnabled ? 'text-red-500' : 'text-gray-400'}`} />
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-2 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 50px)' }}>
          {/* User Selector - compact */}
          <AICoachUserSelector selectedUserId={selectedUserId} onUserSelect={handleUserSelect} />

          {/* Tabs - compact */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'exercise' | 'test' | 'progress')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none h-8">
              <TabsTrigger value="exercise" className="rounded-none text-xs h-7 gap-1">
                <Dumbbell className="w-3 h-3" />Άσκηση
              </TabsTrigger>
              <TabsTrigger value="test" className="rounded-none text-xs h-7 gap-1">
                <ClipboardCheck className="w-3 h-3" />Τεστ FMS
              </TabsTrigger>
              <TabsTrigger value="progress" className="rounded-none text-xs h-7 gap-1" disabled={!selectedUserId}>
                <BarChart3 className="w-3 h-3" />Πρόοδος
              </TabsTrigger>
            </TabsList>

            <TabsContent value="exercise" className="mt-2">
              <div className="flex gap-1 mb-2">
                {(Object.keys(EXERCISES) as ExerciseType[]).map((ex) => (
                  <Button key={ex} variant={selectedExercise === ex ? "default" : "outline"} onClick={() => setSelectedExercise(ex)} className="rounded-none h-7 text-xs px-2" disabled={isSessionActive}>
                    {EXERCISES[ex].name}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="test" className="mt-2">
              <FMSTestFlow
                currentTest={selectedTest}
                currentScore={fmsScore?.score ?? null}
                isSessionActive={isSessionActive}
                onTestChange={setSelectedTest}
                onRecordAttempt={() => {}}
                onComplete={async (results, isNonFunctional, failedTests) => {
                  if (selectedUserId) {
                    for (const result of results) {
                      if (!result.skipped && result.attempts.length > 0) {
                        await saveTestResult({
                          userId: selectedUserId,
                          testType: result.test,
                          score: result.bestScore,
                          feedback: isNonFunctional && failedTests.includes(result.test)
                            ? `Μη λειτουργικός - Score ${result.bestScore}`
                            : `Best: ${result.bestScore}/3`
                        });
                      }
                    }
                    if (isNonFunctional) {
                      toast.warning(`Μη λειτουργικός - Score 1 σε ${failedTests.map(t => TESTS[t].name).join(' & ')}`, { duration: 5000 });
                    } else {
                      toast.success('FMS tests αποθηκεύτηκαν!');
                    }
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="progress" className="mt-2">
              {selectedUserId ? (
                <FMSProgressChart userId={selectedUserId} />
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">Επιλέξτε χρήστη</div>
              )}
            </TabsContent>
          </Tabs>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded-none text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{error}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-4 gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#00ffba]" />Φόρτωση AI...
            </div>
          )}

          {/* Camera and Canvas */}
          {!isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
              {/* Video/Canvas area */}
              <div className="lg:col-span-2 relative">
                <div className="relative aspect-video bg-black rounded-none overflow-hidden">
                  <Webcam ref={webcamRef} audio={false} mirrored={true} className="absolute inset-0 w-full h-full object-cover" videoConstraints={{ facingMode: "user", width: 1280, height: 720 }} />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                  
                  {/* Overlay badges */}
                  {isSessionActive && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <Badge className="bg-red-500 text-white rounded-none text-xs animate-pulse">● REC</Badge>
                      {videoRecording.isRecording && (
                        <Badge className="bg-red-600 text-white rounded-none text-xs">🎥 {videoRecording.formatDuration(videoRecording.recordingDuration)}</Badge>
                      )}
                      {mode === 'exercise' && (
                        <Badge className="bg-[#00ffba] text-black rounded-none px-2">Reps: {repCount}</Badge>
                      )}
                      {mode === 'test' && fmsScore !== null && (
                        <Badge className={`px-2 rounded-none ${fmsScore.score === 3 ? 'bg-green-500' : fmsScore.score === 2 ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
                          {fmsScore.score}/3
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Score overlay */}
                  {isSessionActive && analysis && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className={`p-2 rounded-none text-sm ${analysis.isCorrect ? 'bg-green-500/80' : 'bg-red-500/80'} text-white flex items-center justify-between`}>
                        <span>{analysis.isCorrect ? '✓' : '⚠'}</span>
                        <span className="font-bold">{analysis.score}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex gap-1 mt-2">
                  {!isSessionActive ? (
                    <>
                      <Button onClick={handleStart} className="flex-1 h-8 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none text-sm" disabled={isLoading}>
                        <Play className="w-3 h-3 mr-1" />Έναρξη
                      </Button>
                      {mode === 'test' && canSave && selectedUserId && (
                        <Button onClick={handleSaveResult} className="h-8 bg-[#cb8954] hover:bg-[#cb8954]/90 text-white rounded-none text-sm" disabled={saving}>
                          <Save className="w-3 h-3 mr-1" />{saving ? '...' : 'Save'}
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button onClick={handleStop} variant="destructive" className="flex-1 h-8 rounded-none text-sm">
                        <Square className="w-3 h-3 mr-1" />Stop
                      </Button>
                      <Button onClick={handleReset} variant="outline" className="h-8 rounded-none">
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Video Recording Controls */}
                {videoRecording.previewUrl && !isSessionActive && (
                  <div className="mt-4 p-3 bg-gray-50 border rounded-none">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Εγγραφή: {videoRecording.formatDuration(videoRecording.recordingDuration)} | {videoRecording.getRecordingSize()} MB
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => videoRecording.downloadRecording(`${mode}-${selectedTest || selectedExercise}`)}
                          className="rounded-none"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Λήψη
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={videoRecording.clearRecording}
                          className="rounded-none text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <video 
                      src={videoRecording.previewUrl} 
                      controls 
                      className="w-full max-h-40 rounded-none bg-black"
                    />
                  </div>
                )}
              </div>

              {/* Feedback Panel */}
              <div className="lg:col-span-1">
                <FeedbackPanel
                  mode={mode === 'progress' ? 'test' : mode}
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

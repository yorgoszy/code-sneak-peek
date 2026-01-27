import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, Camera, RotateCcw, Play, Square, Menu, Zap, TrendingUp, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Sidebar';
import { CoachSidebar } from '@/components/CoachSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useEffectiveCoachId } from '@/hooks/useEffectiveCoachId';
import { usePoseDetection, POSE_LANDMARKS } from '@/hooks/usePoseDetection';
import { initializeCamera, stopCamera } from '@/utils/motionDetection';
import { CameraZoomControl } from '@/components/CameraZoomControl';

// Σταθερά επιτάχυνσης βαρύτητας
const GRAVITY = 9.81; // m/s²

interface JumpResult {
  id: string;
  flightTime: number; // ms
  jumpHeight: number; // cm
  timestamp: Date;
}

// Υπολογισμός ύψους άλματος από flight time
// h = (g × t²) / 8 (για CMJ - counter movement jump)
const calculateJumpHeight = (flightTimeMs: number): number => {
  const flightTimeSeconds = flightTimeMs / 1000;
  const height = (GRAVITY * Math.pow(flightTimeSeconds, 2)) / 8;
  return height * 100; // Convert to cm
};

const JumpPage = () => {
  const { toast } = useToast();
  const { isAdmin } = useRoleCheck();
  const { effectiveCoachId } = useEffectiveCoachId();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Jump detection state
  const [isDetecting, setIsDetecting] = useState(false);
  const [jumpPhase, setJumpPhase] = useState<'idle' | 'ready' | 'airborne' | 'landed'>('idle');
  const [flightStartTime, setFlightStartTime] = useState<number | null>(null);
  const [currentFlightTime, setCurrentFlightTime] = useState<number>(0);
  const [groundLevel, setGroundLevel] = useState<number | null>(null);
  const jumpThreshold = 0.05; // 5% of video height for takeoff detection
  
  // Results
  const [results, setResults] = useState<JumpResult[]>([]);
  const [bestJump, setBestJump] = useState<number>(0);
  
  // Refs for detection logic
  const groundLevelRef = useRef<number | null>(null);
  const jumpPhaseRef = useRef<'idle' | 'ready' | 'airborne' | 'landed'>('idle');
  const flightStartRef = useRef<number | null>(null);
  const consecutiveAirFrames = useRef(0);
  const consecutiveGroundFrames = useRef(0);
  const isDetectingRef = useRef(false);
  const FRAMES_TO_CONFIRM = 3;

  // Keep ref in sync
  useEffect(() => {
    isDetectingRef.current = isDetecting;
  }, [isDetecting]);

  // Handle pose results callback
  const handlePoseResults = useCallback((result: any) => {
    if (!result || !isDetectingRef.current) return;

    const landmarks = result.landmarks;
    if (!landmarks || landmarks.length === 0) return;

    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
    
    if (!leftAnkle || !rightAnkle) return;

    const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;

    // Calibration
    if (jumpPhaseRef.current === 'ready' && !groundLevelRef.current) {
      groundLevelRef.current = avgAnkleY;
      setGroundLevel(avgAnkleY);
      console.log('📍 Ground level calibrated:', avgAnkleY);
      return;
    }

    if (!groundLevelRef.current) return;

    const distanceFromGround = groundLevelRef.current - avgAnkleY;
    const jumpThresholdPixels = jumpThreshold;

    // Takeoff detection
    if (jumpPhaseRef.current === 'ready' && distanceFromGround > jumpThresholdPixels) {
      consecutiveAirFrames.current++;
      
      if (consecutiveAirFrames.current >= FRAMES_TO_CONFIRM) {
        console.log('🚀 TAKEOFF detected!', distanceFromGround);
        jumpPhaseRef.current = 'airborne';
        setJumpPhase('airborne');
        flightStartRef.current = performance.now();
        setFlightStartTime(performance.now());
        consecutiveAirFrames.current = 0;
        consecutiveGroundFrames.current = 0;
      }
    } else if (jumpPhaseRef.current === 'ready') {
      consecutiveAirFrames.current = 0;
    }

    // Landing detection
    if (jumpPhaseRef.current === 'airborne') {
      if (flightStartRef.current) {
        setCurrentFlightTime(performance.now() - flightStartRef.current);
      }

      if (distanceFromGround <= jumpThresholdPixels * 0.5) {
        consecutiveGroundFrames.current++;
        
        if (consecutiveGroundFrames.current >= FRAMES_TO_CONFIRM) {
          const flightTime = performance.now() - (flightStartRef.current || 0);
          console.log('🛬 LANDING detected! Flight time:', flightTime, 'ms');
          
          const jumpHeight = calculateJumpHeight(flightTime);
          
          const newResult: JumpResult = {
            id: Date.now().toString(),
            flightTime,
            jumpHeight,
            timestamp: new Date()
          };
          
          setResults(prev => [newResult, ...prev]);
          setBestJump(prev => Math.max(prev, jumpHeight));
          
          toast({
            title: `🏆 ${jumpHeight.toFixed(1)} cm`,
            description: `Flight time: ${flightTime.toFixed(0)} ms`,
          });
          
          // Reset for next jump
          jumpPhaseRef.current = 'ready';
          setJumpPhase('ready');
          flightStartRef.current = null;
          setFlightStartTime(null);
          setCurrentFlightTime(0);
          consecutiveAirFrames.current = 0;
          consecutiveGroundFrames.current = 0;
          groundLevelRef.current = avgAnkleY;
          setGroundLevel(avgAnkleY);
        }
      } else {
        consecutiveGroundFrames.current = 0;
      }
    }
  }, [toast]);

  // Pose detection hook
  const { 
    initialize: initializePose, 
    start: startPoseDetection, 
    stop: stopPoseDetection,
    isLoading: isPoseLoading,
    isRunning: isPoseRunning,
    error: poseError
  } = usePoseDetection({
    onResults: handlePoseResults
  });

  // Start camera
  const handleStartCamera = async () => {
    try {
      if (!videoRef.current) {
        console.error('Video element not found');
        return;
      }

      console.log('🎥 Starting camera...');
      const mediaStream = await initializeCamera(videoRef.current, 'environment');
      setStream(mediaStream);

      const waitForVideo = () => {
        if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          console.log('📹 Video ready');
          setCameraReady(true);
          
          toast({
            title: "Κάμερα ενεργοποιήθηκε",
            description: "Αρχικοποίηση pose detection...",
          });
          
          initializePose();
        } else {
          setTimeout(waitForVideo, 100);
        }
      };
      
      waitForVideo();
    } catch (error) {
      console.error('❌ Camera error:', error);
      toast({
        title: "Σφάλμα κάμερας",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  // Start detection
  const handleStartDetection = () => {
    if (!cameraReady || isPoseLoading) {
      toast({
        title: "Περιμένετε",
        description: "Η κάμερα ή το pose detection δεν είναι έτοιμο",
        variant: "destructive",
      });
      return;
    }

    if (videoRef.current && canvasRef.current) {
      startPoseDetection(videoRef.current, canvasRef.current);
      setIsDetecting(true);
      jumpPhaseRef.current = 'ready';
      setJumpPhase('ready');
      groundLevelRef.current = null;
      setGroundLevel(null);
      
      toast({
        title: "Έναρξη ανίχνευσης",
        description: "Σταθείτε ακίνητοι για calibration...",
      });
    }
  };

  // Stop detection
  const handleStopDetection = () => {
    stopPoseDetection();
    setIsDetecting(false);
    jumpPhaseRef.current = 'idle';
    setJumpPhase('idle');
    groundLevelRef.current = null;
    setGroundLevel(null);
    consecutiveAirFrames.current = 0;
    consecutiveGroundFrames.current = 0;
  };

  // Reset
  const handleReset = () => {
    handleStopDetection();
    setResults([]);
    setBestJump(0);
    setCurrentFlightTime(0);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (stream) stopCamera(stream);
      stopPoseDetection();
    };
  }, [stream, stopPoseDetection]);

  // Render sidebar based on role
  const renderSidebar = () => {
    if (isAdmin) {
      return (
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
      );
    }
    return (
      <CoachSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          {renderSidebar()}
        </div>
        
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden rounded-none"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile sidebar overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full">
              {renderSidebar()}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                  <ArrowUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  Jump
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Μέτρηση ύψους άλματος με AI Pose Detection
                </p>
              </div>
              
              {bestJump > 0 && (
                <Card className="rounded-none bg-primary/10 border-primary/30">
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Καλύτερο</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">{bestJump.toFixed(1)} cm</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Camera View */}
              <div className="lg:col-span-2">
                <Card className="rounded-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                      <span className="flex items-center gap-2">
                        <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                        Κάμερα
                      </span>
                      {cameraReady && (
                        <CameraZoomControl
                          zoom={zoom}
                          onZoomChange={setZoom}
                        />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4">
                    <div className="relative aspect-video bg-black rounded-none overflow-hidden">
                      <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        playsInline
                        muted
                        style={{ transform: `scale(${zoom})` }}
                      />
                      
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{ transform: `scale(${zoom})` }}
                      />

                      {!cameraReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                          <Button
                            onClick={handleStartCamera}
                            className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
                            size="lg"
                          >
                            <Camera className="mr-2 h-5 w-5" />
                            Ενεργοποίηση Κάμερας
                          </Button>
                        </div>
                      )}

                      {isDetecting && (
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                          <Badge 
                            className={`rounded-none text-sm px-3 py-1 ${
                              jumpPhase === 'ready' ? 'bg-yellow-500' :
                              jumpPhase === 'airborne' ? 'bg-primary animate-pulse' :
                              'bg-muted'
                            }`}
                          >
                            {jumpPhase === 'idle' && 'Αναμονή'}
                            {jumpPhase === 'ready' && (groundLevel ? 'ΠΗΔΑ!' : 'Calibration...')}
                            {jumpPhase === 'airborne' && `🚀 ${currentFlightTime.toFixed(0)} ms`}
                            {jumpPhase === 'landed' && 'Προσγείωση'}
                          </Badge>
                          
                          {isPoseRunning && (
                            <Badge className="rounded-none bg-green-500">
                              AI Active
                            </Badge>
                          )}
                        </div>
                      )}

                      {jumpPhase === 'airborne' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/70 px-6 py-4 rounded-none">
                            <p className="text-4xl sm:text-6xl font-bold text-primary font-mono">
                              {currentFlightTime.toFixed(0)} ms
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {cameraReady && !isDetecting && (
                        <Button
                          onClick={handleStartDetection}
                          className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
                          disabled={isPoseLoading}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {isPoseLoading ? 'Φόρτωση AI...' : 'Έναρξη'}
                        </Button>
                      )}
                      
                      {isDetecting && (
                        <Button
                          onClick={handleStopDetection}
                          variant="destructive"
                          className="rounded-none flex-1"
                        >
                          <Square className="mr-2 h-4 w-4" />
                          Διακοπή
                        </Button>
                      )}
                      
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="rounded-none"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    </div>

                    {!isDetecting && cameraReady && (
                      <div className="mt-4 p-3 bg-muted rounded-none">
                        <p className="text-sm text-muted-foreground">
                          <strong>Οδηγίες:</strong> Τοποθετήστε την κάμερα να βλέπει ολόκληρο το σώμα. 
                          Πατήστε "Έναρξη" και μείνετε ακίνητοι για calibration. 
                          Μετά πηδήξτε!
                        </p>
                      </div>
                    )}

                    {poseError && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-none">
                        <p className="text-sm text-destructive">{poseError}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-1 space-y-4">
                {/* Current Attempt - Always Visible */}
                <Card className={`rounded-none border-2 transition-all duration-300 ${
                  jumpPhase === 'airborne' 
                    ? 'border-primary bg-primary/5 animate-pulse' 
                    : results.length > 0 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-muted'
                }`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Τρέχουσα Προσπάθεια
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      {jumpPhase === 'airborne' ? (
                        <>
                          <p className="text-6xl font-bold text-primary font-mono animate-pulse">
                            {currentFlightTime.toFixed(0)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">milliseconds</p>
                          <p className="text-2xl font-semibold mt-2">
                            ≈ {calculateJumpHeight(currentFlightTime).toFixed(1)} cm
                          </p>
                        </>
                      ) : results.length > 0 ? (
                        <>
                          <p className="text-6xl font-bold text-primary">
                            {results[0].jumpHeight.toFixed(1)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">εκατοστά (cm)</p>
                          <p className="text-lg text-muted-foreground mt-1">
                            Flight time: {results[0].flightTime.toFixed(0)} ms
                          </p>
                          <Badge className={`mt-2 rounded-none ${
                            results[0].jumpHeight === bestJump && results.length > 1
                              ? 'bg-amber-500'
                              : 'bg-primary'
                          }`}>
                            {results[0].jumpHeight === bestJump && results.length > 1 ? '🏆 Νέο Ρεκόρ!' : `Άλμα #${results.length}`}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <p className="text-6xl font-bold text-muted-foreground">--</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {isDetecting ? 'Αναμονή για άλμα...' : 'Πατήστε Έναρξη'}
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Card */}
                <Card className="rounded-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Στατιστικά
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted p-3 rounded-none text-center">
                        <p className="text-xs text-muted-foreground">Άλματα</p>
                        <p className="text-xl font-bold">{results.length}</p>
                      </div>
                      <div className="bg-muted p-3 rounded-none text-center">
                        <p className="text-xs text-muted-foreground">Μ.Ο.</p>
                        <p className="text-xl font-bold">
                          {results.length > 0 
                            ? (results.reduce((sum, r) => sum + r.jumpHeight, 0) / results.length).toFixed(1)
                            : '-'
                          }
                        </p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-none text-center">
                        <p className="text-xs text-muted-foreground">Best</p>
                        <p className="text-xl font-bold text-amber-600">{bestJump > 0 ? bestJump.toFixed(1) : '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Results List */}
                <Card className="rounded-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Αποτελέσματα</span>
                      {results.length > 0 && (
                        <Button variant="ghost" size="sm" className="rounded-none h-8">
                          <Save className="h-3 w-3 mr-1" />
                          Αποθήκευση
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Δεν υπάρχουν αποτελέσματα ακόμα
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {results.map((result, index) => (
                          <div
                            key={result.id}
                            className={`flex items-center justify-between p-2 rounded-none ${
                              result.jumpHeight === bestJump 
                                ? 'bg-primary/10 border border-primary/30' 
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">#{results.length - index}</span>
                              {result.jumpHeight === bestJump && (
                                <Badge className="rounded-none bg-amber-500 text-xs">Best</Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{result.jumpHeight.toFixed(1)} cm</p>
                              <p className="text-xs text-muted-foreground">{result.flightTime.toFixed(0)} ms</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Formula Info */}
                <Card className="rounded-none bg-muted/50">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Φόρμουλα:</strong> h = (g × t²) / 8
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Όπου g = 9.81 m/s² και t = flight time (sec)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default JumpPage;

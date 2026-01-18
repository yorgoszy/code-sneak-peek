import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Timer, Play, Square, Camera, RotateCcw, Smartphone, Monitor, AlertCircle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { QRCodeSVG } from 'qrcode.react';

type DeviceMode = 'idle' | 'timer' | 'start' | 'stop';
type SetupMode = 'select' | 'single' | 'dual';
type DualDeviceRole = 'timer+start' | 'stop' | 'timer+stop' | 'start';

interface SprintSession {
  id: string;
  session_code: string;
  status: string;
}

const SprintTimerPage = () => {
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Setup state
  const [setupMode, setSetupMode] = useState<SetupMode>('select');
  const [session, setSession] = useState<SprintSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dual device state
  const [dualDeviceRole, setDualDeviceRole] = useState<DualDeviceRole | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  
  // Single device state - κύκλος: timer → start → stop → timer
  const [singleDeviceMode, setSingleDeviceMode] = useState<DeviceMode>('timer');
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sprintDistance, setSprintDistance] = useState<number>(30);
  
  // Camera/Motion detection state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isMotionActive, setIsMotionActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const motionDetectorRef = useRef<MotionDetector | null>(null);

  // Sync ref
  useEffect(() => { motionDetectorRef.current = motionDetector; }, [motionDetector]);

  // Δημιουργία session
  const createSession = async () => {
    setIsLoading(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('sprint_timing_sessions')
        .insert({
          session_code: code,
          distances: [sprintDistance],
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      setSession(data as SprintSession);
      return data as SprintSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Αποτυχία δημιουργίας session',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Εκκίνηση κάμερας
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
          const detector = new MotionDetector(videoRef.current, 40, 3000);
          setMotionDetector(detector);
          setCameraReady(true);
          
          toast({
            title: "Κάμερα ενεργοποιήθηκε",
            description: "Έτοιμο για ανίχνευση κίνησης",
          });
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

  // Μορφοποίηση χρόνου
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}.${centiseconds.toString().padStart(2, '0')}`;
  };

  // Υπολογισμός ταχύτητας
  const calculateSpeed = (distanceMeters: number, timeMs: number): number => {
    if (timeMs <= 0) return 0;
    const timeSeconds = timeMs / 1000;
    const speedMps = distanceMeters / timeSeconds;
    return speedMps * 3.6;
  };

  // === SINGLE DEVICE FLOW ===
  // Ξεκινάει από Timer, πατάς "Έναρξη" → μετατρέπεται σε Start (ανίχνευση έναρξης)
  // Μόλις ανιχνεύσει κίνηση → ξεκινάει χρόνος + μετατρέπεται σε Stop (ανίχνευση τερματισμού)
  // Μόλις ανιχνεύσει κίνηση → σταματάει χρόνος + γυρνάει σε Timer (δείχνει αποτέλεσμα)
  
  const handleSingleDeviceStart = async () => {
    if (!cameraReady || !motionDetector) {
      toast({
        title: "Κάμερα δεν είναι έτοιμη",
        description: "Παρακαλώ περιμένετε...",
        variant: "destructive",
      });
      return;
    }

    // Μετάβαση σε START mode - περιμένει κίνηση για να ξεκινήσει ο χρόνος
    setSingleDeviceMode('start');
    setIsMotionActive(true);
    
    motionDetector.start(() => {
      console.log('🏁 Motion detected - START');
      motionDetector.stop();
      
      // Ξεκίνα το χρόνο
      const now = Date.now();
      setStartTime(now);
      setIsRunning(true);
      setElapsedTime(0);
      
      // Μετάβαση σε STOP mode - περιμένει κίνηση για να σταματήσει ο χρόνος
      setSingleDeviceMode('stop');
      
      // Μικρή καθυστέρηση πριν ξεκινήσει να ανιχνεύει ξανά
      setTimeout(() => {
        motionDetector.start(() => {
          console.log('🏁 Motion detected - STOP');
          motionDetector.stop();
          setIsMotionActive(false);
          
          // Σταμάτα το χρόνο
          setIsRunning(false);
          
          // Γύρνα σε TIMER mode για εμφάνιση αποτελέσματος
          setSingleDeviceMode('timer');
        });
      }, 1000); // 1 δευτερόλεπτο καθυστέρηση
    });
  };

  const handleSingleDeviceReset = () => {
    if (motionDetector) {
      motionDetector.stop();
    }
    setIsMotionActive(false);
    setSingleDeviceMode('timer');
    setIsRunning(false);
    setStartTime(null);
    setElapsedTime(0);
  };

  // Timer interval
  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 10);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Cleanup κάμερας
  useEffect(() => {
    return () => {
      if (stream) stopCamera(stream);
      if (motionDetector) motionDetector.stop();
    };
  }, [stream, motionDetector]);

  // === DUAL DEVICE - θα στέλνει/λαμβάνει broadcasts ===
  const handleDualDeviceSetup = async (role: DualDeviceRole) => {
    setDualDeviceRole(role);
    
    // Δημιουργία session αν είμαστε η κύρια συσκευή (timer+start ή timer+stop)
    if (role === 'timer+start' || role === 'timer+stop') {
      await createSession();
      setShowQRCode(true);
    }
  };

  // === UI COMPONENTS ===

  // Επιλογή λειτουργίας (1 ή 2 συσκευές)
  const renderSetupSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Sprint Timer</h2>
        <p className="text-muted-foreground text-sm">Επιλέξτε πώς θέλετε να χρησιμοποιήσετε το χρονόμετρο</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={async () => {
            setSetupMode('single');
            await handleStartCamera();
          }}
          className="h-32 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black flex flex-col items-center justify-center gap-2"
        >
          <Smartphone className="w-10 h-10" />
          <div className="text-center">
            <div className="font-bold text-lg">Μία Συσκευή</div>
            <div className="text-xs opacity-80">Ολοκληρωμένη λειτουργία</div>
          </div>
        </Button>

        <Button
          onClick={() => setSetupMode('dual')}
          className="h-32 rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white flex flex-col items-center justify-center gap-2"
        >
          <Monitor className="w-10 h-10" />
          <div className="text-center">
            <div className="font-bold text-lg">Δύο Συσκευές</div>
            <div className="text-xs opacity-80">Επιλέξτε ρόλους</div>
          </div>
        </Button>
      </div>
    </div>
  );

  // Επιλογή ρόλων για 2 συσκευές
  const renderDualDeviceSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Ρύθμιση 2 Συσκευών</h2>
        <p className="text-muted-foreground text-sm">Επιλέξτε τι θα κάνει αυτή η συσκευή</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Button
          onClick={() => handleDualDeviceSetup('timer+start')}
          className="h-24 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        >
          <div className="flex items-center gap-4">
            <Timer className="w-8 h-8" />
            <Play className="w-6 h-6" />
            <div className="text-left">
              <div className="font-bold">TIMER + START</div>
              <div className="text-xs opacity-80">Χρονόμετρο & Ανίχνευση έναρξης</div>
            </div>
          </div>
        </Button>

        <Button
          onClick={() => handleDualDeviceSetup('timer+stop')}
          className="h-24 rounded-none bg-red-500 hover:bg-red-600 text-white"
        >
          <div className="flex items-center gap-4">
            <Timer className="w-8 h-8" />
            <Square className="w-6 h-6" />
            <div className="text-left">
              <div className="font-bold">TIMER + STOP</div>
              <div className="text-xs opacity-80">Χρονόμετρο & Ανίχνευση τερματισμού</div>
            </div>
          </div>
        </Button>

        <div className="text-center text-muted-foreground text-sm py-2">
          --- ή αν η 2η συσκευή είναι αυτή ---
        </div>

        <Button
          onClick={() => handleDualDeviceSetup('start')}
          className="h-20 rounded-none border-2 border-[#00ffba] text-[#00ffba] bg-transparent hover:bg-[#00ffba]/10"
        >
          <Play className="w-6 h-6 mr-2" />
          <div className="text-left">
            <div className="font-bold">Μόνο START</div>
            <div className="text-xs opacity-80">Ανίχνευση έναρξης</div>
          </div>
        </Button>

        <Button
          onClick={() => handleDualDeviceSetup('stop')}
          className="h-20 rounded-none border-2 border-red-500 text-red-500 bg-transparent hover:bg-red-500/10"
        >
          <Square className="w-6 h-6 mr-2" />
          <div className="text-left">
            <div className="font-bold">Μόνο STOP</div>
            <div className="text-xs opacity-80">Ανίχνευση τερματισμού</div>
          </div>
        </Button>
      </div>

      <Button
        onClick={() => setSetupMode('select')}
        variant="outline"
        className="w-full rounded-none"
      >
        Πίσω
      </Button>
    </div>
  );

  // Single device - ολοκληρωμένο interface
  const renderSingleDevice = () => (
    <div className="space-y-4">
      {/* Distance Input */}
      <div className="bg-[#cb8954]/10 border border-[#cb8954]/30 p-4 rounded-none">
        <div className="flex items-center gap-3">
          <Label className="text-sm text-[#cb8954] whitespace-nowrap">Απόσταση:</Label>
          <Input
            type="number"
            value={sprintDistance}
            onChange={(e) => setSprintDistance(parseInt(e.target.value) || 0)}
            className="rounded-none h-10 text-lg font-bold text-center w-24 bg-white"
            min={1}
            disabled={singleDeviceMode !== 'timer' || isRunning}
          />
          <span className="text-[#cb8954] font-semibold">μέτρα</span>
        </div>
      </div>

      {/* Camera Feed */}
      <div className="relative bg-black rounded-none overflow-hidden">
        <video
          ref={videoRef}
          className="w-full"
          style={{ display: stream ? 'block' : 'none', minHeight: stream ? 200 : 0 }}
          autoPlay
          playsInline
          muted
        />
        {isMotionActive && stream && (
          <div className="absolute inset-0 border-4 border-[#00ffba] pointer-events-none animate-pulse" />
        )}
        {!stream && (
          <div className="p-8 text-center text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-2" />
            <p>Φόρτωση κάμερας...</p>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="text-center">
        <Badge 
          className={`rounded-none text-lg px-4 py-2 ${
            singleDeviceMode === 'start' ? 'bg-[#00ffba] text-black' :
            singleDeviceMode === 'stop' ? 'bg-red-500 text-white' :
            'bg-gray-500'
          }`}
        >
          {singleDeviceMode === 'timer' && (isRunning ? 'Running' : (elapsedTime > 0 ? 'Ολοκληρώθηκε' : 'Αναμονή'))}
          {singleDeviceMode === 'start' && 'Αναμονή έναρξης...'}
          {singleDeviceMode === 'stop' && 'Αναμονή τερματισμού...'}
        </Badge>
      </div>

      {/* Timer Display */}
      <div className="bg-black/90 p-8 rounded-none">
        <div className="text-center">
          <div className={`font-mono text-7xl font-bold ${
            isRunning ? 'text-[#00ffba]' : 
            elapsedTime > 0 ? 'text-blue-500' : 'text-gray-500'
          }`}>
            {formatTime(elapsedTime)}
          </div>
          {elapsedTime > 0 && !isRunning && sprintDistance > 0 && (
            <div className="text-[#cb8954] text-3xl font-bold mt-4">
              {calculateSpeed(sprintDistance, elapsedTime).toFixed(2)} km/h
            </div>
          )}
        </div>
      </div>

      {/* Motion Status Alert */}
      {isMotionActive && (
        <Alert className={`rounded-none ${
          singleDeviceMode === 'start' ? 'bg-[#00ffba]/10 border-[#00ffba]' :
          'bg-red-500/10 border-red-500'
        }`}>
          <AlertCircle className={`h-4 w-4 ${
            singleDeviceMode === 'start' ? 'text-[#00ffba]' : 'text-red-500'
          }`} />
          <AlertDescription className={
            singleDeviceMode === 'start' ? 'text-[#00ffba]' : 'text-red-500'
          }>
            {singleDeviceMode === 'start' 
              ? 'Περάστε μπροστά από την κάμερα για ΕΝΑΡΞΗ!' 
              : 'Περάστε μπροστά από την κάμερα για ΤΕΡΜΑΤΙΣΜΟ!'}
          </AlertDescription>
        </Alert>
      )}

      {/* Control Buttons */}
      <div className="flex gap-4">
        {singleDeviceMode === 'timer' && !isRunning && (
          <Button
            onClick={handleSingleDeviceStart}
            disabled={!cameraReady}
            className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-16 text-lg"
          >
            <Play className="w-6 h-6 mr-2" />
            {elapsedTime > 0 ? 'Νέα Μέτρηση' : 'Έναρξη'}
          </Button>
        )}
        
        {(isMotionActive || elapsedTime > 0) && (
          <Button
            onClick={handleSingleDeviceReset}
            className="flex-1 rounded-none bg-gray-500 hover:bg-gray-600 text-white h-16 text-lg"
          >
            <RotateCcw className="w-6 h-6 mr-2" />
            Reset
          </Button>
        )}
      </div>

      <Button
        onClick={() => {
          handleSingleDeviceReset();
          if (stream) stopCamera(stream);
          setStream(null);
          setCameraReady(false);
          setSetupMode('select');
        }}
        variant="outline"
        className="w-full rounded-none"
      >
        Πίσω
      </Button>
    </div>
  );

  // Dual device με QR Code
  const renderDualDeviceWithQR = () => (
    <div className="space-y-4">
      <div className="text-center">
        <Badge className="rounded-none bg-[#00ffba] text-black mb-2">
          {dualDeviceRole === 'timer+start' ? 'TIMER + START' : 'TIMER + STOP'}
        </Badge>
        <h3 className="font-bold">Session: {session?.session_code}</h3>
      </div>

      {showQRCode && session && (
        <div className="bg-white p-4 rounded-none flex justify-center">
          <QRCodeSVG 
            value={`${window.location.origin}/sprint-timing/join/${session.session_code}`}
            size={200}
          />
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Σκανάρετε με τη 2η συσκευή για να συνδεθεί ως {dualDeviceRole === 'timer+start' ? 'STOP' : 'START'}
      </p>

      {/* TODO: Implement dual device timer/motion detection */}
      <div className="bg-muted p-4 rounded-none text-center">
        <p className="text-sm">Λειτουργία 2 συσκευών - σύντομα διαθέσιμη</p>
      </div>

      <Button
        onClick={() => {
          setSetupMode('dual');
          setDualDeviceRole(null);
          setShowQRCode(false);
          setSession(null);
        }}
        variant="outline"
        className="w-full rounded-none"
      >
        Πίσω
      </Button>
    </div>
  );

  // Render main content
  const renderContent = () => {
    if (setupMode === 'select') {
      return renderSetupSelection();
    }
    
    if (setupMode === 'dual') {
      if (dualDeviceRole && showQRCode) {
        return renderDualDeviceWithQR();
      }
      return renderDualDeviceSetup();
    }
    
    if (setupMode === 'single') {
      return renderSingleDevice();
    }

    return null;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        
        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-[#00ffba]" />
                  Sprint Timer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SprintTimerPage;

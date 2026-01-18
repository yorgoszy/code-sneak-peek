import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Timer, Play, Square, Camera, RotateCcw, Smartphone, Monitor, AlertCircle, Check, QrCode, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { QRCodeSVG } from 'qrcode.react';

type DeviceMode = 'idle' | 'timer' | 'start' | 'stop';
type SetupMode = 'select' | 'single' | 'dual' | 'join';
type DualDeviceRole = 'timer+start' | 'stop' | 'timer+stop' | 'start';

interface SprintSession {
  id: string;
  session_code: string;
  status: string;
}

const SprintTimerPage = () => {
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Setup state
  const [setupMode, setSetupMode] = useState<SetupMode>('select');
  const [session, setSession] = useState<SprintSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  
  // Dual device state
  const [dualDeviceRole, setDualDeviceRole] = useState<DualDeviceRole | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [isSecondDeviceReady, setIsSecondDeviceReady] = useState(false);
  
  // Single device state - κύκλος: timer → start → stop → timer
  const [singleDeviceMode, setSingleDeviceMode] = useState<DeviceMode>('timer');
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sprintDistance, setSprintDistance] = useState<number>(30);
  const [lastResult, setLastResult] = useState<number | null>(null);
  
  // Camera/Motion detection state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isMotionActive, setIsMotionActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const motionDetectorRef = useRef<MotionDetector | null>(null);

  // Broadcast channel refs
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  // Join σε υπάρχον session
  const joinSession = async (code: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sprint_timing_sessions')
        .select('*')
        .eq('session_code', code.toUpperCase())
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: 'Error',
          description: 'Το session δεν βρέθηκε',
          variant: 'destructive',
        });
        return null;
      }

      setSession(data as SprintSession);
      return data as SprintSession;
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: 'Error',
        description: 'Αποτυχία σύνδεσης στο session',
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
  const handleSingleDeviceStart = async () => {
    if (!cameraReady || !motionDetector) {
      toast({
        title: "Κάμερα δεν είναι έτοιμη",
        description: "Παρακαλώ περιμένετε...",
        variant: "destructive",
      });
      return;
    }

    // Reset previous result
    setLastResult(null);
    setElapsedTime(0);
    
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
      
      // Μετάβαση σε STOP mode
      setSingleDeviceMode('stop');
      
      // Καθυστέρηση πριν ενεργοποιήσει την ανίχνευση για stop
      setTimeout(() => {
        if (motionDetectorRef.current) {
          motionDetectorRef.current.start(() => {
            console.log('🏁 Motion detected - STOP');
            if (motionDetectorRef.current) {
              motionDetectorRef.current.stop();
            }
            setIsMotionActive(false);
            setIsRunning(false);
            setSingleDeviceMode('timer');
          });
        }
      }, 1000);
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
    setLastResult(null);
  };

  // Timer interval
  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);
      
      // Αν σταμάτησε το isRunning, αποθήκευσε το αποτέλεσμα
      if (!isRunning) {
        setLastResult(elapsed);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Store result when timer stops
  useEffect(() => {
    if (!isRunning && elapsedTime > 0 && singleDeviceMode === 'timer') {
      setLastResult(elapsedTime);
    }
  }, [isRunning, elapsedTime, singleDeviceMode]);

  // === DUAL DEVICE FLOW ===
  
  // Setup broadcast channel για 2 συσκευές
  const setupDualDeviceBroadcast = useCallback(async (sessionCode: string, role: DualDeviceRole) => {
    console.log(`📡 Setting up dual device broadcast for role: ${role}`);
    
    const channel = supabase.channel(`sprint-dual-${sessionCode}`, {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'device_ready' }, (payload) => {
        console.log('📱 Device ready event:', payload);
        const deviceRole = payload.payload?.role;
        if (deviceRole && !connectedDevices.includes(deviceRole)) {
          setConnectedDevices(prev => [...prev, deviceRole]);
        }
        setIsSecondDeviceReady(true);
      })
      .on('broadcast', { event: 'timer_start' }, (payload) => {
        console.log('▶️ Timer start event received');
        if (role === 'stop' || role === 'timer+stop') {
          // Αυτή η συσκευή θα περιμένει για κίνηση για να σταματήσει
          setStartTime(payload.payload?.startTime);
          setIsRunning(true);
          setElapsedTime(0);
          
          // Ενεργοποίηση motion detection για stop
          if (motionDetectorRef.current && cameraReady) {
            setIsMotionActive(true);
            motionDetectorRef.current.start(() => {
              console.log('🏁 STOP device detected motion');
              if (motionDetectorRef.current) {
                motionDetectorRef.current.stop();
              }
              setIsMotionActive(false);
              setIsRunning(false);
              
              // Broadcast timer stop
              channel.send({
                type: 'broadcast',
                event: 'timer_stop',
                payload: { endTime: Date.now() }
              });
            });
          }
        }
      })
      .on('broadcast', { event: 'timer_stop' }, (payload) => {
        console.log('⏹️ Timer stop event received');
        setIsRunning(false);
        setIsMotionActive(false);
        if (motionDetectorRef.current) {
          motionDetectorRef.current.stop();
        }
      })
      .on('broadcast', { event: 'reset' }, () => {
        console.log('🔄 Reset event received');
        handleDualDeviceReset();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Broadcast channel subscribed');
          // Announce this device
          await channel.send({
            type: 'broadcast',
            event: 'device_ready',
            payload: { role, timestamp: Date.now() }
          });
        }
      });

    broadcastChannelRef.current = channel;
  }, [cameraReady, connectedDevices]);

  const handleDualDeviceSetup = async (role: DualDeviceRole) => {
    setDualDeviceRole(role);
    
    // Δημιουργία session αν είμαστε η κύρια συσκευή
    if (role === 'timer+start' || role === 'timer+stop') {
      const newSession = await createSession();
      if (newSession) {
        await handleStartCamera();
        await setupDualDeviceBroadcast(newSession.session_code, role);
      }
    }
  };

  const handleJoinDualDevice = async (role: DualDeviceRole) => {
    const sessionData = await joinSession(joinCode);
    if (sessionData) {
      setDualDeviceRole(role);
      await handleStartCamera();
      await setupDualDeviceBroadcast(sessionData.session_code, role);
    }
  };

  const handleDualDeviceStart = async () => {
    if (!cameraReady || !motionDetector || !broadcastChannelRef.current) {
      toast({
        title: "Δεν είναι έτοιμο",
        description: "Περιμένετε να συνδεθούν όλες οι συσκευές",
        variant: "destructive",
      });
      return;
    }

    setElapsedTime(0);
    setIsMotionActive(true);
    
    // Αν είμαστε timer+start, περιμένουμε κίνηση για να ξεκινήσει
    if (dualDeviceRole === 'timer+start') {
      motionDetector.start(() => {
        console.log('🏁 START device detected motion');
        motionDetector.stop();
        setIsMotionActive(false);
        
        const now = Date.now();
        setStartTime(now);
        setIsRunning(true);
        
        // Broadcast timer start στη 2η συσκευή
        broadcastChannelRef.current?.send({
          type: 'broadcast',
          event: 'timer_start',
          payload: { startTime: now }
        });
      });
    }
    // Αν είμαστε timer+stop, περιμένουμε χειροκίνητη έναρξη ή broadcast
    else if (dualDeviceRole === 'timer+stop') {
      const now = Date.now();
      setStartTime(now);
      setIsRunning(true);
      
      // Broadcast timer start στη 2η συσκευή (start device)
      broadcastChannelRef.current?.send({
        type: 'broadcast',
        event: 'timer_start',
        payload: { startTime: now }
      });
      
      // Ενεργοποίηση motion detection για stop
      motionDetector.start(() => {
        console.log('🏁 STOP device detected motion');
        motionDetector.stop();
        setIsMotionActive(false);
        setIsRunning(false);
        
        broadcastChannelRef.current?.send({
          type: 'broadcast',
          event: 'timer_stop',
          payload: { endTime: Date.now() }
        });
      });
    }
  };

  const handleDualDeviceReset = () => {
    if (motionDetector) {
      motionDetector.stop();
    }
    setIsMotionActive(false);
    setIsRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    setLastResult(null);
    
    // Broadcast reset
    broadcastChannelRef.current?.send({
      type: 'broadcast',
      event: 'reset',
      payload: {}
    });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (stream) stopCamera(stream);
      if (motionDetector) motionDetector.stop();
      if (broadcastChannelRef.current) {
        supabase.removeChannel(broadcastChannelRef.current);
      }
    };
  }, [stream, motionDetector]);

  // === UI COMPONENTS ===

  // Επιλογή λειτουργίας (1 ή 2 συσκευές)
  const renderSetupSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Sprint Timer</h2>
        <p className="text-muted-foreground text-sm">Επιλέξτε πώς θέλετε να χρησιμοποιήσετε το χρονόμετρο</p>
      </div>

      <div className="space-y-3">
        {/* Απόσταση */}
        <div className="bg-[#cb8954]/10 border border-[#cb8954]/30 p-4 rounded-none">
          <div className="flex items-center gap-3">
            <Label className="text-sm text-[#cb8954] whitespace-nowrap">Απόσταση:</Label>
            <Input
              type="number"
              value={sprintDistance}
              onChange={(e) => setSprintDistance(parseInt(e.target.value) || 0)}
              className="rounded-none h-10 text-lg font-bold text-center w-24 bg-white"
              min={1}
            />
            <span className="text-[#cb8954] font-semibold">μέτρα</span>
          </div>
        </div>

        {/* Μία Συσκευή */}
        <Button
          onClick={async () => {
            setSetupMode('single');
            await handleStartCamera();
          }}
          className="w-full h-24 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black flex items-center justify-center gap-4"
        >
          <Smartphone className="w-10 h-10" />
          <div className="text-left">
            <div className="font-bold text-lg">Μία Συσκευή</div>
            <div className="text-xs opacity-80">Timer + Start + Stop σε μία οθόνη</div>
          </div>
        </Button>

        {/* Δύο Συσκευές */}
        <Button
          onClick={() => setSetupMode('dual')}
          className="w-full h-24 rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white flex items-center justify-center gap-4"
        >
          <Monitor className="w-10 h-10" />
          <div className="text-left">
            <div className="font-bold text-lg">Δύο Συσκευές</div>
            <div className="text-xs opacity-80">Ξεχωριστές συσκευές για Start/Stop</div>
          </div>
        </Button>

        {/* Σύνδεση σε session */}
        <Button
          onClick={() => setSetupMode('join')}
          variant="outline"
          className="w-full h-16 rounded-none flex items-center justify-center gap-4"
        >
          <Wifi className="w-6 h-6" />
          <div className="text-left">
            <div className="font-bold">Σύνδεση σε Session</div>
            <div className="text-xs opacity-80">Εισάγετε κωδικό ή σκανάρετε QR</div>
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
        <p className="text-muted-foreground text-sm">Τι ρόλο θα έχει αυτή η συσκευή;</p>
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
              <div className="text-xs opacity-60">Η 2η συσκευή θα είναι STOP</div>
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
              <div className="text-xs opacity-60">Η 2η συσκευή θα είναι START</div>
            </div>
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

  // Join session screen
  const renderJoinSession = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Σύνδεση σε Session</h2>
        <p className="text-muted-foreground text-sm">Εισάγετε τον κωδικό του session</p>
      </div>

      <div className="space-y-4">
        <Input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="ΚΩΔΙΚΟΣ"
          className="rounded-none h-14 text-2xl text-center font-bold tracking-widest"
          maxLength={6}
        />

        <div className="text-center text-sm text-muted-foreground">
          Τι ρόλο θα έχει αυτή η συσκευή;
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleJoinDualDevice('start')}
            disabled={joinCode.length < 4 || isLoading}
            className="h-20 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black flex flex-col"
          >
            <Play className="w-6 h-6 mb-1" />
            <span className="font-bold">START</span>
          </Button>

          <Button
            onClick={() => handleJoinDualDevice('stop')}
            disabled={joinCode.length < 4 || isLoading}
            className="h-20 rounded-none bg-red-500 hover:bg-red-600 text-white flex flex-col"
          >
            <Square className="w-6 h-6 mb-1" />
            <span className="font-bold">STOP</span>
          </Button>
        </div>
      </div>

      <Button
        onClick={() => {
          setSetupMode('select');
          setJoinCode('');
        }}
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
      {/* Distance Display */}
      <div className="bg-[#cb8954]/10 border border-[#cb8954]/30 p-3 rounded-none">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#cb8954]">Απόσταση:</span>
          <span className="text-[#cb8954] font-bold text-lg">{sprintDistance} μέτρα</span>
        </div>
      </div>

      {/* Camera Feed */}
      <div className="relative bg-black rounded-none overflow-hidden aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ display: stream ? 'block' : 'none' }}
          autoPlay
          playsInline
          muted
        />
        {isMotionActive && stream && (
          <div className={`absolute inset-0 border-4 pointer-events-none animate-pulse ${
            singleDeviceMode === 'start' ? 'border-[#00ffba]' : 'border-red-500'
          }`} />
        )}
        {!stream && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto mb-2" />
              <p>Φόρτωση κάμερας...</p>
            </div>
          </div>
        )}
        
        {/* Status Badge on video */}
        <div className="absolute top-2 right-2">
          <Badge 
            className={`rounded-none text-sm px-3 py-1 ${
              singleDeviceMode === 'start' ? 'bg-[#00ffba] text-black' :
              singleDeviceMode === 'stop' ? 'bg-red-500 text-white' :
              isRunning ? 'bg-blue-500 text-white' :
              elapsedTime > 0 ? 'bg-green-500 text-white' : 'bg-gray-500'
            }`}
          >
            {singleDeviceMode === 'timer' && (isRunning ? 'Running' : (elapsedTime > 0 ? '✓ Ολοκληρώθηκε' : 'Αναμονή'))}
            {singleDeviceMode === 'start' && '👋 Περάστε για ΕΝΑΡΞΗ'}
            {singleDeviceMode === 'stop' && '👋 Περάστε για ΤΕΡΜΑΤΙΣΜΟ'}
          </Badge>
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-black/90 p-6 rounded-none">
        <div className="text-center">
          <div className={`font-mono text-6xl font-bold ${
            isRunning ? 'text-[#00ffba] animate-pulse' : 
            elapsedTime > 0 ? 'text-blue-400' : 'text-gray-500'
          }`}>
            {formatTime(elapsedTime)}
          </div>
          {elapsedTime > 0 && !isRunning && sprintDistance > 0 && (
            <div className="text-[#cb8954] text-2xl font-bold mt-3">
              {calculateSpeed(sprintDistance, elapsedTime).toFixed(2)} km/h
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        {singleDeviceMode === 'timer' && !isRunning && (
          <Button
            onClick={handleSingleDeviceStart}
            disabled={!cameraReady}
            className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-14 text-lg font-bold"
          >
            <Play className="w-6 h-6 mr-2" />
            {elapsedTime > 0 ? 'Νέα Μέτρηση' : 'Έναρξη'}
          </Button>
        )}
        
        {(isMotionActive || elapsedTime > 0) && (
          <Button
            onClick={handleSingleDeviceReset}
            className="flex-1 rounded-none bg-gray-500 hover:bg-gray-600 text-white h-14 text-lg font-bold"
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

  // Dual device active interface
  const renderDualDeviceActive = () => (
    <div className="space-y-4">
      {/* Session Info */}
      <div className="text-center bg-muted p-4 rounded-none">
        <Badge className="rounded-none bg-[#00ffba] text-black mb-2">
          {dualDeviceRole === 'timer+start' ? 'TIMER + START' : 
           dualDeviceRole === 'timer+stop' ? 'TIMER + STOP' :
           dualDeviceRole === 'start' ? 'START' : 'STOP'}
        </Badge>
        <div className="text-2xl font-bold font-mono">{session?.session_code}</div>
        
        {/* QR Code for primary devices */}
        {(dualDeviceRole === 'timer+start' || dualDeviceRole === 'timer+stop') && session && (
          <div className="mt-4 bg-white p-4 inline-block">
            <QRCodeSVG 
              value={`${window.location.origin}/dashboard/sprint-timer?join=${session.session_code}`}
              size={120}
            />
          </div>
        )}
      </div>

      {/* Connected Devices */}
      <div className="flex items-center justify-center gap-2">
        <Wifi className={`w-5 h-5 ${isSecondDeviceReady ? 'text-[#00ffba]' : 'text-gray-400'}`} />
        <span className={isSecondDeviceReady ? 'text-[#00ffba]' : 'text-gray-400'}>
          {isSecondDeviceReady ? '2η συσκευή συνδεδεμένη' : 'Αναμονή 2ης συσκευής...'}
        </span>
      </div>

      {/* Camera Feed */}
      <div className="relative bg-black rounded-none overflow-hidden aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ display: stream ? 'block' : 'none' }}
          autoPlay
          playsInline
          muted
        />
        {isMotionActive && stream && (
          <div className={`absolute inset-0 border-4 pointer-events-none animate-pulse ${
            dualDeviceRole?.includes('start') ? 'border-[#00ffba]' : 'border-red-500'
          }`} />
        )}
        {!stream && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <Camera className="w-12 h-12" />
          </div>
        )}
      </div>

      {/* Timer Display */}
      <div className="bg-black/90 p-6 rounded-none">
        <div className="text-center">
          <div className={`font-mono text-6xl font-bold ${
            isRunning ? 'text-[#00ffba] animate-pulse' : 
            elapsedTime > 0 ? 'text-blue-400' : 'text-gray-500'
          }`}>
            {formatTime(elapsedTime)}
          </div>
          {elapsedTime > 0 && !isRunning && sprintDistance > 0 && (
            <div className="text-[#cb8954] text-2xl font-bold mt-3">
              {calculateSpeed(sprintDistance, elapsedTime).toFixed(2)} km/h
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        {(dualDeviceRole === 'timer+start' || dualDeviceRole === 'timer+stop') && !isRunning && !isMotionActive && (
          <Button
            onClick={handleDualDeviceStart}
            disabled={!cameraReady}
            className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-14 text-lg font-bold"
          >
            <Play className="w-6 h-6 mr-2" />
            {elapsedTime > 0 ? 'Νέα Μέτρηση' : 'Έναρξη'}
          </Button>
        )}
        
        {(isMotionActive || elapsedTime > 0) && (
          <Button
            onClick={handleDualDeviceReset}
            className="flex-1 rounded-none bg-gray-500 hover:bg-gray-600 text-white h-14 text-lg font-bold"
          >
            <RotateCcw className="w-6 h-6 mr-2" />
            Reset
          </Button>
        )}
      </div>

      <Button
        onClick={() => {
          handleDualDeviceReset();
          if (stream) stopCamera(stream);
          if (broadcastChannelRef.current) {
            supabase.removeChannel(broadcastChannelRef.current);
          }
          setStream(null);
          setCameraReady(false);
          setSetupMode('select');
          setSession(null);
          setDualDeviceRole(null);
          setIsSecondDeviceReady(false);
        }}
        variant="outline"
        className="w-full rounded-none"
      >
        Τερματισμός Session
      </Button>
    </div>
  );

  // Render main content
  const renderContent = () => {
    if (setupMode === 'select') {
      return renderSetupSelection();
    }
    
    if (setupMode === 'join') {
      return renderJoinSession();
    }
    
    if (setupMode === 'dual') {
      if (dualDeviceRole && session) {
        return renderDualDeviceActive();
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
          <div className="max-w-lg mx-auto">
            <Card className="rounded-none">
              <CardHeader className="pb-3">
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

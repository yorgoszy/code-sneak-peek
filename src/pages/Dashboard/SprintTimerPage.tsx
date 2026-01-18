import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timer, Play, Square, Camera, RotateCcw, Smartphone, Monitor, Wifi, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { QRCodeSVG } from 'qrcode.react';

type DeviceMode = 'idle' | 'timer' | 'start' | 'stop';
type SetupStep = 'devices' | 'roles' | 'active' | 'join';
type DeviceCount = 1 | 2;
type DeviceRole = 'timer+start+stop' | 'timer+start' | 'timer+stop' | 'start' | 'stop';

interface SprintSession {
  id: string;
  session_code: string;
  status: string;
}

const SprintTimerPage = () => {
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Setup state - νέα δομή με βήματα
  const [setupStep, setSetupStep] = useState<SetupStep>('devices');
  const [deviceCount, setDeviceCount] = useState<DeviceCount | null>(null);
  const [session, setSession] = useState<SprintSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  
  // Device role state
  const [deviceRole, setDeviceRole] = useState<DeviceRole | null>(null);
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

    setLastResult(null);
    setElapsedTime(0);
    
    setSingleDeviceMode('start');
    setIsMotionActive(true);
    
    motionDetector.start(() => {
      console.log('🏁 Motion detected - START');
      motionDetector.stop();
      
      const now = Date.now();
      setStartTime(now);
      setIsRunning(true);
      setElapsedTime(0);
      
      setSingleDeviceMode('stop');
      
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
  const setupDualDeviceBroadcast = useCallback(async (sessionCode: string, role: DeviceRole) => {
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
          setStartTime(payload.payload?.startTime);
          setIsRunning(true);
          setElapsedTime(0);
          
          if (motionDetectorRef.current && cameraReady) {
            setIsMotionActive(true);
            motionDetectorRef.current.start(() => {
              console.log('🏁 STOP device detected motion');
              if (motionDetectorRef.current) {
                motionDetectorRef.current.stop();
              }
              setIsMotionActive(false);
              setIsRunning(false);
              
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
          await channel.send({
            type: 'broadcast',
            event: 'device_ready',
            payload: { role, timestamp: Date.now() }
          });
        }
      });

    broadcastChannelRef.current = channel;
  }, [cameraReady, connectedDevices]);

  const handleDualDeviceSetup = async (role: DeviceRole) => {
    setDeviceRole(role);
    
    if (role === 'timer+start' || role === 'timer+stop') {
      const newSession = await createSession();
      if (newSession) {
        await handleStartCamera();
        await setupDualDeviceBroadcast(newSession.session_code, role);
        setSetupStep('active');
      }
    }
  };

  const handleJoinDualDevice = async (role: DeviceRole) => {
    const sessionData = await joinSession(joinCode);
    if (sessionData) {
      setDeviceRole(role);
      await handleStartCamera();
      await setupDualDeviceBroadcast(sessionData.session_code, role);
      setSetupStep('active');
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
    
    if (deviceRole === 'timer+start') {
      motionDetector.start(() => {
        console.log('🏁 START device detected motion');
        motionDetector.stop();
        setIsMotionActive(false);
        
        const now = Date.now();
        setStartTime(now);
        setIsRunning(true);
        
        broadcastChannelRef.current?.send({
          type: 'broadcast',
          event: 'timer_start',
          payload: { startTime: now }
        });
      });
    }
    else if (deviceRole === 'timer+stop') {
      const now = Date.now();
      setStartTime(now);
      setIsRunning(true);
      
      broadcastChannelRef.current?.send({
        type: 'broadcast',
        event: 'timer_start',
        payload: { startTime: now }
      });
      
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

  // ΒΗΜΑ 1: Επιλογή αριθμού συσκευών
  const renderDeviceSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Badge className="rounded-none bg-[#00ffba] text-black mb-3">ΒΗΜΑ 1</Badge>
        <h2 className="text-xl font-bold mb-2">Πόσες συσκευές θα χρησιμοποιήσεις;</h2>
        <p className="text-muted-foreground text-sm">Επιλέξτε τον αριθμό συσκευών για το sprint timing</p>
      </div>

      {/* Απόσταση */}
      <div className="bg-[#cb8954]/10 border border-[#cb8954]/30 p-4 rounded-none">
        <div className="flex items-center gap-3">
          <Label className="text-sm text-[#cb8954] whitespace-nowrap">Απόσταση Sprint:</Label>
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

      <div className="space-y-3">
        {/* 1 Συσκευή */}
        <Button
          onClick={async () => {
            setDeviceCount(1);
            setDeviceRole('timer+start+stop');
            await handleStartCamera();
            setSetupStep('active');
          }}
          className="w-full h-28 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-4">
            <div className="bg-black/20 p-3 rounded-none">
              <Smartphone className="w-10 h-10" />
            </div>
            <div className="text-left">
              <div className="font-bold text-xl">1 Συσκευή</div>
              <div className="text-sm opacity-80">Timer + Start + Stop</div>
              <div className="text-xs opacity-60">Όλα σε μία οθόνη</div>
            </div>
          </div>
          <ArrowRight className="w-6 h-6" />
        </Button>

        {/* 2 Συσκευές */}
        <Button
          onClick={() => {
            setDeviceCount(2);
            setSetupStep('roles');
          }}
          className="w-full h-28 rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-4">
            <div className="bg-black/20 p-3 rounded-none flex gap-1">
              <Monitor className="w-8 h-8" />
              <Monitor className="w-8 h-8" />
            </div>
            <div className="text-left">
              <div className="font-bold text-xl">2 Συσκευές</div>
              <div className="text-sm opacity-80">Ξεχωριστές για Start & Stop</div>
              <div className="text-xs opacity-60">Μεγαλύτερη ακρίβεια</div>
            </div>
          </div>
          <ArrowRight className="w-6 h-6" />
        </Button>

        {/* Σύνδεση σε session */}
        <Button
          onClick={() => setSetupStep('join')}
          variant="outline"
          className="w-full h-16 rounded-none flex items-center justify-center gap-4"
        >
          <Wifi className="w-6 h-6" />
          <div className="text-left">
            <div className="font-bold">Σύνδεση σε Session</div>
            <div className="text-xs opacity-80">Έχω κωδικό από άλλη συσκευή</div>
          </div>
        </Button>
      </div>
    </div>
  );

  // ΒΗΜΑ 2: Επιλογή ρόλων (για 2 συσκευές)
  const renderRoleSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Badge className="rounded-none bg-[#cb8954] text-white mb-3">ΒΗΜΑ 2</Badge>
        <h2 className="text-xl font-bold mb-2">Ποιον ρόλο θα έχει αυτή η συσκευή;</h2>
        <p className="text-muted-foreground text-sm">Η δεύτερη συσκευή θα πάρει τον συμπληρωματικό ρόλο</p>
      </div>

      <div className="space-y-4">
        {/* TIMER + START */}
        <Button
          onClick={() => handleDualDeviceSetup('timer+start')}
          disabled={isLoading}
          className="w-full h-24 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        >
          <div className="flex items-center gap-4 w-full px-4">
            <div className="flex items-center gap-2">
              <Timer className="w-8 h-8" />
              <span className="text-2xl">+</span>
              <Play className="w-8 h-8" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg">TIMER + START</div>
              <div className="text-sm opacity-80">Χρονόμετρο & Ανίχνευση έναρξης</div>
            </div>
          </div>
        </Button>

        {/* TIMER + STOP */}
        <Button
          onClick={() => handleDualDeviceSetup('timer+stop')}
          disabled={isLoading}
          className="w-full h-24 rounded-none bg-red-500 hover:bg-red-600 text-white"
        >
          <div className="flex items-center gap-4 w-full px-4">
            <div className="flex items-center gap-2">
              <Timer className="w-8 h-8" />
              <span className="text-2xl">+</span>
              <Square className="w-8 h-8" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg">TIMER + STOP</div>
              <div className="text-sm opacity-80">Χρονόμετρο & Ανίχνευση τερματισμού</div>
            </div>
          </div>
        </Button>

        <div className="bg-muted p-3 rounded-none text-center text-sm">
          <strong>Σημείωση:</strong> Η 2η συσκευή θα λάβει κωδικό για να συνδεθεί
        </div>
      </div>

      <Button
        onClick={() => {
          setSetupStep('devices');
          setDeviceCount(null);
        }}
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
        <Badge className="rounded-none bg-blue-500 text-white mb-3">ΣΥΝΔΕΣΗ</Badge>
        <h2 className="text-xl font-bold mb-2">Σύνδεση σε Session</h2>
        <p className="text-muted-foreground text-sm">Εισάγετε τον κωδικό από την άλλη συσκευή</p>
      </div>

      <div className="space-y-4">
        <Input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="ΚΩΔΙΚΟΣ"
          className="rounded-none h-16 text-3xl text-center font-bold tracking-widest"
          maxLength={6}
        />

        <div className="text-center text-sm text-muted-foreground font-medium">
          Τι ρόλο θα έχει αυτή η συσκευή;
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleJoinDualDevice('start')}
            disabled={joinCode.length < 4 || isLoading}
            className="h-20 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black flex flex-col"
          >
            <Play className="w-8 h-8 mb-1" />
            <span className="font-bold text-lg">START</span>
          </Button>

          <Button
            onClick={() => handleJoinDualDevice('stop')}
            disabled={joinCode.length < 4 || isLoading}
            className="h-20 rounded-none bg-red-500 hover:bg-red-600 text-white flex flex-col"
          >
            <Square className="w-8 h-8 mb-1" />
            <span className="font-bold text-lg">STOP</span>
          </Button>
        </div>
      </div>

      <Button
        onClick={() => {
          setSetupStep('devices');
          setJoinCode('');
        }}
        variant="outline"
        className="w-full rounded-none"
      >
        Πίσω
      </Button>
    </div>
  );

  // Active interface (single or dual)
  const renderActiveInterface = () => {
    const isSingleDevice = deviceCount === 1;
    
    return (
      <div className="space-y-4">
        {/* Role & Session Info */}
        <div className="flex items-center justify-between bg-muted p-3 rounded-none">
          <div className="flex items-center gap-2">
            <Badge className={`rounded-none ${
              deviceRole === 'timer+start+stop' ? 'bg-[#00ffba] text-black' :
              deviceRole === 'timer+start' ? 'bg-[#00ffba] text-black' :
              deviceRole === 'timer+stop' ? 'bg-red-500 text-white' :
              deviceRole === 'start' ? 'bg-[#00ffba] text-black' :
              'bg-red-500 text-white'
            }`}>
              {deviceRole === 'timer+start+stop' ? '1 ΣΥΣΚΕΥΗ' :
               deviceRole === 'timer+start' ? 'TIMER+START' :
               deviceRole === 'timer+stop' ? 'TIMER+STOP' :
               deviceRole === 'start' ? 'START' : 'STOP'}
            </Badge>
            <span className="text-sm text-muted-foreground">{sprintDistance}m</span>
          </div>
          
          {session && !isSingleDevice && (
            <div className="text-right">
              <div className="font-mono font-bold">{session.session_code}</div>
              {isSecondDeviceReady ? (
                <span className="text-xs text-[#00ffba]">2η συνδεδεμένη</span>
              ) : (
                <span className="text-xs text-yellow-500">Αναμονή...</span>
              )}
            </div>
          )}
        </div>

        {/* QR Code for primary devices in dual mode */}
        {!isSingleDevice && session && (deviceRole === 'timer+start' || deviceRole === 'timer+stop') && !isSecondDeviceReady && (
          <div className="text-center bg-white p-4 border rounded-none">
            <p className="text-sm mb-3 text-gray-600">Σκανάρετε με τη 2η συσκευή:</p>
            <QRCodeSVG 
              value={`${window.location.origin}/dashboard/sprint-timer?join=${session.session_code}`}
              size={150}
              className="mx-auto"
            />
            <p className="mt-3 font-mono text-xl font-bold">{session.session_code}</p>
          </div>
        )}

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
              singleDeviceMode === 'start' || deviceRole?.includes('start') ? 'border-[#00ffba]' : 'border-red-500'
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
              onClick={isSingleDevice ? handleSingleDeviceStart : handleDualDeviceStart}
              disabled={!cameraReady}
              className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-14 text-lg font-bold"
            >
              <Play className="w-6 h-6 mr-2" />
              {elapsedTime > 0 ? 'Νέα Μέτρηση' : 'Έναρξη'}
            </Button>
          )}
          
          {(isMotionActive || elapsedTime > 0) && (
            <Button
              onClick={isSingleDevice ? handleSingleDeviceReset : handleDualDeviceReset}
              className="flex-1 rounded-none bg-gray-500 hover:bg-gray-600 text-white h-14 text-lg font-bold"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Reset
            </Button>
          )}
        </div>

        <Button
          onClick={() => {
            if (isSingleDevice) {
              handleSingleDeviceReset();
            } else {
              handleDualDeviceReset();
            }
            if (stream) stopCamera(stream);
            if (broadcastChannelRef.current) {
              supabase.removeChannel(broadcastChannelRef.current);
            }
            setStream(null);
            setCameraReady(false);
            setSetupStep('devices');
            setSession(null);
            setDeviceRole(null);
            setDeviceCount(null);
            setIsSecondDeviceReady(false);
          }}
          variant="outline"
          className="w-full rounded-none"
        >
          {isSingleDevice ? 'Πίσω' : 'Τερματισμός Session'}
        </Button>
      </div>
    );
  };

  // Render main content
  const renderContent = () => {
    switch (setupStep) {
      case 'devices':
        return renderDeviceSelection();
      case 'roles':
        return renderRoleSelection();
      case 'join':
        return renderJoinSession();
      case 'active':
        return renderActiveInterface();
      default:
        return renderDeviceSelection();
    }
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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Camera, RotateCcw, Smartphone, Wifi, Menu, Compass, Maximize, SwitchCamera, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Sidebar';
import { CoachSidebar } from '@/components/CoachSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useEffectiveCoachId } from '@/hooks/useEffectiveCoachId';

type SetupStep = 'menu' | 'sensor' | 'display' | 'join';

interface DirectionSession {
  id: string;
  session_code: string;
  status: string;
}

const ChangeDirectionPage = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useRoleCheck();
  const { effectiveCoachId } = useEffectiveCoachId();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Setup state
  const [setupStep, setSetupStep] = useState<SetupStep>('menu');
  const [session, setSession] = useState<DirectionSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  
  // Direction state
  const [currentDirection, setCurrentDirection] = useState<'left' | 'right' | 'center' | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [directionCount, setDirectionCount] = useState(0);
  
  // Camera/Motion detection state
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isMotionActive, setIsMotionActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraZoom, setCameraZoom] = useState(1);
  const motionDetectorRef = useRef<MotionDetector | null>(null);

  // Fullscreen UI controls (show exit button for a few seconds on touch)
  const [showFullscreenControls, setShowFullscreenControls] = useState(false);
  const fullscreenControlsTimeoutRef = useRef<number | null>(null);

  // Broadcast channel refs
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Sync ref
  useEffect(() => { motionDetectorRef.current = motionDetector; }, [motionDetector]);

  // Auto-join from URL query parameter (QR code)
  useEffect(() => {
    const joinCodeFromUrl = searchParams.get('join');
    if (joinCodeFromUrl && setupStep === 'menu') {
      console.log('🔗 Auto-joining from URL:', joinCodeFromUrl);
      setJoinCode(joinCodeFromUrl.toUpperCase());
      // Auto-trigger join
      const autoJoin = async () => {
        const sessionData = await joinSession(joinCodeFromUrl);
        if (sessionData) {
          await setupBroadcast(sessionData.session_code, 'display');
          setSetupStep('display');
          setIsWaiting(true);
          // Clear the URL parameter
          setSearchParams({});
        }
      };
      autoJoin();
    }
  }, [searchParams, setupStep]);

  // Auto-start camera for sensor device
  useEffect(() => {
    if (setupStep === 'sensor' && !stream && !cameraReady) {
      console.log('📷 Auto-starting camera for sensor device');
      const timer = setTimeout(() => {
        handleStartCamera();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [setupStep, stream, cameraReady]);

  // Create session
  const createSession = async () => {
    setIsLoading(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('sprint_timing_sessions')
        .insert({
          session_code: code,
          distances: [],
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      setSession(data as DirectionSession);
      return data as DirectionSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: t('changeDirection.sessionCreateError'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Join existing session
  const joinSession = async (code: string) => {
    setIsLoading(true);
    try {
      console.log('🔍 Searching for session with code:', code.toUpperCase());
      
      const { data, error } = await supabase
        .from('sprint_timing_sessions')
        .select('*')
        .eq('session_code', code.toUpperCase())
        .maybeSingle();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      if (!data) {
        console.log('❌ Session not found for code:', code);
        toast({
          title: 'Σφάλμα',
          description: 'Δεν βρέθηκε session με αυτόν τον κωδικό',
          variant: 'destructive',
        });
        return null;
      }

      console.log('✅ Session found:', data);
      setSession(data as DirectionSession);
      toast({
        title: 'Επιτυχής σύνδεση!',
        description: `Συνδεθήκατε στο session ${data.session_code}`,
      });
      return data as DirectionSession;
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία σύνδεσης στο session',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Start camera
  const handleStartCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      if (!videoRef.current) {
        console.error('Video element not found');
        return;
      }

      // Stop existing stream if switching cameras
      if (stream) {
        stopCamera(stream);
        setStream(null);
        setMotionDetector(null);
        setCameraReady(false);
      }

      console.log('🎥 Starting camera with mode:', mode);
      const mediaStream = await initializeCamera(videoRef.current, mode);
      setStream(mediaStream);

      const waitForVideo = () => {
        if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          console.log('📹 Video ready');
          const detector = new MotionDetector(videoRef.current, 40, 3000);
          setMotionDetector(detector);
          setCameraReady(true);
          
          toast({
            title: t('changeDirection.cameraActivated'),
            description: t('changeDirection.readyForMotion'),
          });
        } else {
          setTimeout(waitForVideo, 100);
        }
      };
      
      waitForVideo();
    } catch (error) {
      console.error('❌ Camera error:', error);
      toast({
        title: t('changeDirection.cameraError'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  // Switch camera facing mode
  const handleSwitchCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    handleStartCamera(newMode);
  };

  // Setup broadcast channel
  const setupBroadcast = useCallback(async (sessionCode: string, role: 'sensor' | 'display') => {
    console.log(`📡 Setting up broadcast for role: ${role}`);
    
    const channel = supabase.channel(`direction-${sessionCode}`, {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'device_ready' }, (payload) => {
        console.log('📱 Device ready event:', payload);
        toast({
          title: t('changeDirection.deviceConnected'),
          description: role === 'sensor' ? t('changeDirection.displayConnected') : t('changeDirection.sensorConnected'),
        });
      })
      .on('broadcast', { event: 'show_direction' }, (payload) => {
        console.log('➡️ Direction event received:', payload);
        if (role === 'display') {
          const direction = payload.payload?.direction as 'left' | 'right' | 'center';
          setCurrentDirection(direction);
          setIsWaiting(false);
          
          // Auto-hide after 2 seconds
          setTimeout(() => {
            setCurrentDirection(null);
            setIsWaiting(true);
          }, 2000);
        }
      })
      .on('broadcast', { event: 'reset' }, () => {
        console.log('🔄 Reset event received');
        handleReset();
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
  }, [toast, t]);

  // Handle sensor device setup
  const handleSensorSetup = async () => {
    const newSession = await createSession();
    if (newSession) {
      await setupBroadcast(newSession.session_code, 'sensor');
      setSetupStep('sensor');
    }
  };

  // Handle display device join
  const handleDisplayJoin = async () => {
    const sessionData = await joinSession(joinCode);
    if (sessionData) {
      await setupBroadcast(sessionData.session_code, 'display');
      setSetupStep('display');
      setIsWaiting(true);
    }
  };

  // Ref to track if we're still in active mode (for closures)
  const isMotionActiveRef = useRef(false);

  // Start motion detection (persistent mode with 5s cooldown)
  const handleStartMotion = () => {
    if (!cameraReady || !motionDetector) {
      toast({
        title: t('changeDirection.cameraNotReady'),
        description: t('changeDirection.pleaseWait'),
        variant: "destructive",
      });
      return;
    }

    // Guard against double-starts (prevents multiple RAF loops)
    if (isMotionActive) return;

    // Make detection LESS sensitive - require more significant motion
    motionDetector.setThreshold(80); // Higher = less sensitive (was 40)
    motionDetector.setMinMotionPixels(10000); // More pixels required (was 3000)

    setIsMotionActive(true);
    isMotionActiveRef.current = true;

    const startDetection = () => {
      if (!motionDetectorRef.current || !isMotionActiveRef.current) return;
      
      console.log('🎯 Motion detection armed and waiting...');
      
      motionDetectorRef.current.start(() => {
        console.log('🏁 Motion detected!');
        
        // Stop detection during cooldown
        motionDetectorRef.current?.stop();
        
        // Generate random direction (left, right, or center)
        const directions: ('left' | 'right' | 'center')[] = ['left', 'right', 'center'];
        const direction = directions[Math.floor(Math.random() * 3)];
        setCurrentDirection(direction);
        setDirectionCount(prev => prev + 1);
        
        // Broadcast direction to display device
        broadcastChannelRef.current?.send({
          type: 'broadcast',
          event: 'show_direction',
          payload: { direction, timestamp: Date.now() }
        });
        
        // Auto-reset direction display after 2 seconds
        setTimeout(() => {
          setCurrentDirection(null);
        }, 2000);
        
        // Re-arm detection after 5 seconds cooldown - ONLY if still active
        setTimeout(() => {
          if (isMotionActiveRef.current && motionDetectorRef.current) {
            console.log('🔄 Re-arming motion detection after 5s cooldown');
            startDetection();
          }
        }, 5000);
      });
    };

    startDetection();
  };

  // Stop motion detection
  const handleStopMotion = () => {
    if (motionDetector) {
      motionDetector.stop();
    }
    setIsMotionActive(false);
    isMotionActiveRef.current = false; // Critical: stop re-arming
  };

  const showFsControlsTemporarily = () => {
    if (!document.fullscreenElement) return;
    setShowFullscreenControls(true);
    if (fullscreenControlsTimeoutRef.current) {
      window.clearTimeout(fullscreenControlsTimeoutRef.current);
    }
    fullscreenControlsTimeoutRef.current = window.setTimeout(() => {
      setShowFullscreenControls(false);
      fullscreenControlsTimeoutRef.current = null;
    }, 3500);
  };

  // Reset
  const handleReset = () => {
    handleStopMotion();
    setCurrentDirection(null);
    setDirectionCount(0);
    setIsWaiting(false);
    
    broadcastChannelRef.current?.send({
      type: 'broadcast',
      event: 'reset',
      payload: {}
    });
  };

  // Back to menu
  const handleBackToMenu = () => {
    handleReset();
    if (stream) stopCamera(stream);
    if (broadcastChannelRef.current) {
      supabase.removeChannel(broadcastChannelRef.current);
    }
    setSetupStep('menu');
    setSession(null);
    setCameraReady(false);
    setStream(null);
    setMotionDetector(null);
    setJoinCode('');
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

  // Main menu
  const renderMenu = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{t('changeDirection.selectRole')}</h2>
        <p className="text-muted-foreground text-xs sm:text-sm">{t('changeDirection.roleDescription')}</p>
      </div>

      <div className="grid gap-3">
        <Button
          onClick={handleSensorSetup}
          className="h-16 sm:h-20 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          disabled={isLoading}
        >
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 sm:w-8 sm:h-8" />
            <div className="text-left">
              <div className="font-bold text-sm sm:text-base">{t('changeDirection.sensorDevice')}</div>
              <div className="text-xs opacity-80">{t('changeDirection.sensorDescription')}</div>
            </div>
          </div>
        </Button>

        <Button
          onClick={() => setSetupStep('join')}
          variant="outline"
          className="h-16 sm:h-20 rounded-none"
        >
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 sm:w-8 sm:h-8" />
            <div className="text-left">
              <div className="font-bold text-sm sm:text-base">{t('changeDirection.displayDevice')}</div>
              <div className="text-xs opacity-80">{t('changeDirection.displayDescription')}</div>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );

  // Join screen for display device
  const renderJoinScreen = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{t('changeDirection.joinSession')}</h2>
        <p className="text-muted-foreground text-xs sm:text-sm">{t('changeDirection.enterCode')}</p>
      </div>

      <div className="space-y-3">
        <Input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder={t('changeDirection.codePlaceholder')}
          className="rounded-none text-center text-xl font-mono tracking-widest h-12"
          maxLength={6}
        />
        
        <Button
          onClick={handleDisplayJoin}
          className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          disabled={joinCode.length !== 6 || isLoading}
        >
          <Wifi className="w-4 h-4 mr-2" />
          {t('changeDirection.connect')}
        </Button>

        <Button
          onClick={() => setSetupStep('menu')}
          variant="outline"
          className="w-full rounded-none"
        >
          {t('changeDirection.back')}
        </Button>
      </div>
    </div>
  );

  // Sensor device view
  const renderSensorView = () => (
    <div className="space-y-4">
      {/* Session code & QR */}
      {session && (
        <div className="bg-[#cb8954]/10 border border-[#cb8954]/30 p-3 sm:p-4 rounded-none text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('changeDirection.sessionCode')}</p>
          <p className="text-2xl font-mono font-bold tracking-widest text-[#cb8954]">
            {session.session_code}
          </p>
          <div className="mt-3 flex justify-center">
            <div className="bg-white p-2 rounded-none">
              <QRCodeSVG 
                value={`${window.location.origin}/dashboard/change-direction?join=${session.session_code}`}
                size={80}
              />
            </div>
          </div>
        </div>
      )}

      {/* Camera view */}
      <div className="relative bg-black aspect-video rounded-none overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: `scale(${cameraZoom})` }}
        />
        
        {isMotionActive && (
          <div className="absolute inset-0 border-4 border-[#00ffba] animate-pulse" />
        )}
        
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <Camera className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p className="text-sm">{t('changeDirection.initCamera')}</p>
            </div>
          </div>
        )}
        
        {/* Zoom control overlay */}
        {cameraReady && (
          <div className="absolute bottom-2 left-2 right-2 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-2 bg-black/60 rounded-none">
              <ZoomOut className="w-4 h-4 text-white" />
              <Slider
                value={[cameraZoom]}
                onValueChange={(values) => setCameraZoom(values[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-24 sm:w-32"
              />
              <ZoomIn className="w-4 h-4 text-white" />
              <span className="text-xs text-white min-w-[2rem]">{cameraZoom.toFixed(1)}x</span>
            </div>
          </div>
        )}
      </div>

      {/* Direction display */}
      {currentDirection && (
        <div className="flex justify-center py-4">
          {currentDirection === 'left' ? (
            <svg viewBox="0 0 100 60" className="w-32 h-20">
              <polygon 
                points="0,30 50,0 50,20 100,20 100,40 50,40 50,60" 
                fill="#3B82F6"
              />
            </svg>
          ) : currentDirection === 'right' ? (
            <svg viewBox="0 0 100 60" className="w-32 h-20">
              <polygon 
                points="100,30 50,0 50,20 0,20 0,40 50,40 50,60" 
                fill="#FACC15"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 60 60" className="w-20 h-20">
              <rect x="5" y="5" width="50" height="50" fill="#EF4444" />
            </svg>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="text-center">
        <Badge className="rounded-none bg-[#cb8954] text-white">
          {t('changeDirection.directionCount')}: {directionCount}
        </Badge>
      </div>

      {/* Camera switch button */}
      <Button
        onClick={handleSwitchCamera}
        variant="outline"
        className="w-full rounded-none"
        disabled={!cameraReady}
      >
        <SwitchCamera className="w-4 h-4 mr-2" />
        {facingMode === 'environment' ? 'Μπροστινή Κάμερα' : 'Πίσω Κάμερα'}
      </Button>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          onClick={isMotionActive ? handleStopMotion : handleStartMotion}
          className={`flex-1 rounded-none ${isMotionActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black'}`}
          disabled={!cameraReady}
        >
          <Camera className="w-4 h-4 mr-2" />
          {isMotionActive ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
        </Button>
        
        <Button
          onClick={handleReset}
          variant="outline"
          className="rounded-none"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <Button
        onClick={handleBackToMenu}
        variant="outline"
        className="w-full rounded-none"
      >
        {t('changeDirection.back')}
      </Button>
    </div>
  );

  // Fullscreen toggle for display
  const handleFullscreen = () => {
    if (displayRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        displayRef.current.requestFullscreen();
      }
    }
  };

  // Keep fullscreen controls state in sync (e.g. user exits with system gesture)
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setShowFullscreenControls(false);
        if (fullscreenControlsTimeoutRef.current) {
          window.clearTimeout(fullscreenControlsTimeoutRef.current);
          fullscreenControlsTimeoutRef.current = null;
        }
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Display device view
  const renderDisplayView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge className="rounded-none bg-[#00ffba] text-black">
          {t('changeDirection.displayMode')}
        </Badge>
        <Button
          onClick={handleFullscreen}
          variant="outline"
          size="sm"
          className="rounded-none"
        >
          <Maximize className="w-4 h-4 mr-1" />
          Fullscreen
        </Button>
      </div>

      {/* Direction arrow display */}
      <div 
        ref={displayRef}
        className="relative bg-black aspect-square rounded-none flex items-center justify-center min-h-[300px]"
        onTouchStart={showFsControlsTemporarily}
        onMouseDown={showFsControlsTemporarily}
      >
        {document.fullscreenElement && showFullscreenControls && (
          <div className="absolute top-3 right-3 z-10">
            <Button
              onClick={handleFullscreen}
              variant="outline"
              size="sm"
              className="rounded-none"
            >
              <Minimize2 className="w-4 h-4 mr-1" />
              Έξοδος
            </Button>
          </div>
        )}

        {currentDirection ? (
          currentDirection === 'left' ? (
            <svg viewBox="0 0 100 60" className="w-80 h-48">
              <polygon 
                points="0,30 50,0 50,20 100,20 100,40 50,40 50,60" 
                fill="#3B82F6"
              />
            </svg>
          ) : currentDirection === 'right' ? (
            <svg viewBox="0 0 100 60" className="w-80 h-48">
              <polygon 
                points="100,30 50,0 50,20 0,20 0,40 50,40 50,60" 
                fill="#FACC15"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 80 80" className="w-64 h-64">
              <rect x="10" y="10" width="60" height="60" fill="#EF4444" />
            </svg>
          )
        ) : isWaiting ? (
          <div className="w-full h-full" />
        ) : (
          <div className="text-center text-white">
            <Wifi className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <p className="text-lg">{t('changeDirection.connecting')}</p>
          </div>
        )}
      </div>

      <Button
        onClick={handleBackToMenu}
        variant="outline"
        className="w-full rounded-none"
      >
        {t('changeDirection.back')}
      </Button>
    </div>
  );

  // Render content based on step
  const renderContent = () => {
    switch (setupStep) {
      case 'menu':
        return renderMenu();
      case 'join':
        return renderJoinScreen();
      case 'sensor':
        return renderSensorView();
      case 'display':
        return renderDisplayView();
      default:
        return renderMenu();
    }
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
                    <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-[#00ffba]" />
                    {t('changeDirection.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                  {renderContent()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ChangeDirectionPage;

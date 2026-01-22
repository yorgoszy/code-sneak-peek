import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { Play, Camera, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const SprintTimingStart = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldDetectRef = useRef<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraZoom, setCameraZoom] = useState(1);
  const { session, joinSession, startTiming, broadcastActivateNext } = useSprintTiming(sessionCode);
  const { toast } = useToast();

  // ΜΟΝΙΜΟ CHANNEL για να στέλνουμε broadcasts στο Timer
  const timerChannelRef = useRef<RealtimeChannel | null>(null);

  // Refs για να έχουμε πρόσβαση στις τρέχουσες τιμές μέσα στο broadcast callback
  const motionDetectorRef = useRef<MotionDetector | null>(null);
  const isReadyRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(false);
  const sessionRef = useRef<any>(null);

  // Sync refs with state
  useEffect(() => { motionDetectorRef.current = motionDetector; }, [motionDetector]);
  useEffect(() => { isReadyRef.current = isReady; }, [isReady]);
  useEffect(() => { streamRef.current = stream; }, [stream]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // ΔΗΜΙΟΥΡΓΙΑ ΜΟΝΙΜΟΥ CHANNEL για επικοινωνία με το Timer
  useEffect(() => {
    if (!sessionCode) return;

    console.log('🔌 [START] Creating PERSISTENT timer channel:', `sprint-timer-control-${sessionCode}`);
    
    const channel = supabase.channel(`sprint-timer-control-${sessionCode}`, {
      config: { broadcast: { self: true } }
    });
    
    channel.subscribe((status) => {
      console.log('🔌 [START] Timer channel status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ [START] Timer channel READY to send broadcasts!');
        timerChannelRef.current = channel;
      }
    });

    return () => {
      console.log('🧹 [START] Cleaning up timer channel');
      supabase.removeChannel(channel);
      timerChannelRef.current = null;
    };
  }, [sessionCode]);

  // Listen for ACTIVATE MOTION DETECTION broadcast - RESET and ACTIVATE
  useEffect(() => {
    if (!sessionCode) {
      console.log('❌ [START] No sessionCode, cannot setup listener');
      return;
    }

    console.log('🎧 🎧 🎧 [START] Setting up ACTIVATE MOTION listener for channel:', `sprint-broadcast-${sessionCode}`);
    
    const channel = supabase
      .channel(`sprint-broadcast-${sessionCode}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on('broadcast', { event: 'activate_motion_detection' }, (payload: any) => {
        console.log('🔄 🔄 🔄 [START] Received ACTIVATE MOTION broadcast! 🔄 🔄 🔄', payload);
        
        // Χρησιμοποιούμε refs για να έχουμε τις τρέχουσες τιμές
        const currentMotionDetector = motionDetectorRef.current;
        const currentIsReady = isReadyRef.current;
        const currentStream = streamRef.current;
        const currentIsActive = isActiveRef.current;
        const currentSession = sessionRef.current;
        
        console.log('📊 [START] Camera status (from refs):', { 
          isReady: currentIsReady, 
          hasStream: !!currentStream, 
          hasDetector: !!currentMotionDetector,
          hasVideoRef: !!videoRef.current,
          isActive: currentIsActive 
        });
        
        shouldDetectRef.current = false; // Reset detection flag
        
        // Σταματάμε το motion detection αν είναι ήδη ενεργό
        if (currentIsActive && currentMotionDetector) {
          console.log('🛑 [START] Stopping previous motion detection');
          currentMotionDetector.stop();
        }
        
        // Έλεγχος αν η κάμερα είναι έτοιμη
        if (!currentIsReady || !currentStream || !currentMotionDetector || !videoRef.current) {
          console.error('❌ ❌ ❌ [START] Camera NOT READY - Cannot activate motion detection! ❌ ❌ ❌');
          return;
        }
        
        // ΕΝΕΡΓΟΠΟΙΗΣΗ motion detection ΑΜΕΣΩΣ
        console.log('✅ ✅ ✅ [START] ACTIVATING motion detection NOW! ✅ ✅ ✅');
        shouldDetectRef.current = true; // Ενεργοποιούμε την ανίχνευση
        setIsActive(true);
        
        currentMotionDetector.start(async () => {
          console.log('🏁 [START] MOTION DETECTED!');
          
          if (!shouldDetectRef.current) {
            console.log('❌ [START] Detection cancelled - device was reset');
            return;
          }
          
          currentMotionDetector.stop();
          setIsActive(false);
          shouldDetectRef.current = false;
          
          // ΣΤΕΛΝΟΥΜΕ BROADCAST μέσω του ΜΟΝΙΜΟΥ channel
          console.log('📡📡📡 [START] MOTION DETECTED - Preparing to send START_TIMER...');
          console.log('📡 [START] timerChannelRef.current:', timerChannelRef.current);
          
          if (timerChannelRef.current) {
            console.log('📡 [START] Channel exists, sending broadcast NOW!');
            const result = await timerChannelRef.current.send({
              type: 'broadcast',
              event: 'start_timer',
              payload: { timestamp: Date.now(), source: 'start_device' }
            });
            console.log('✅✅✅ [START] START_TIMER broadcast result:', result);
          } else {
            console.error('❌❌❌ [START] Timer channel NOT READY! Cannot send broadcast!');
            // Fallback: δημιουργούμε νέο channel και στέλνουμε
            console.log('🔄 [START] Creating emergency channel...');
            const emergencyChannel = supabase.channel(`sprint-timer-control-${sessionCode}`);
            emergencyChannel.subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                const result = await emergencyChannel.send({
                  type: 'broadcast',
                  event: 'start_timer',
                  payload: { timestamp: Date.now(), source: 'start_device_emergency' }
                });
                console.log('✅ [START] Emergency broadcast result:', result);
              }
            });
          }
        });
      })
      .on('broadcast', { event: 'reset_all_devices' }, (payload: any) => {
        console.log('🔄 🔄 🔄 [START] Received RESET broadcast! 🔄 🔄 🔄', payload);
        
        // ΠΡΩΤΑ απενεργοποιούμε το detection flag
        shouldDetectRef.current = false;
        
        // Σταματάμε το motion detection αν είναι ενεργό
        const currentMotionDetector = motionDetectorRef.current;
        if (currentMotionDetector) {
          console.log('🛑 [START] Stopping motion detection');
          currentMotionDetector.stop();
        }
        
        // Μηδενίζουμε όλα τα states
        console.log('🧹 [START] Resetting all states');
        setIsActive(false);
        
        console.log('✅ [START] Reset complete!');
      })
      .subscribe((status) => {
        console.log('🎧 🎧 🎧 [START] Broadcast listener subscription status:', status, '🎧 🎧 🎧');
        if (status === 'SUBSCRIBED') {
          console.log('✅ ✅ ✅ [START] Successfully SUBSCRIBED to broadcast channel! ✅ ✅ ✅');
        }
      });

    return () => {
      console.log('🧹 [START] Cleaning up broadcast listener');
      supabase.removeChannel(channel);
    };
  }, [sessionCode]); // Μόνο το sessionCode στο dependency array

  // Listen for START ALL broadcast
  useEffect(() => {
    if (!sessionCode) return;

    console.log('🎧 [START] Setting up START ALL listener for session:', sessionCode);
    
    const channelName = `sprint-start-all-${sessionCode}`;
    console.log('🎧 [START] Listening on channel:', channelName);
    
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { ack: false }
        }
      })
      .on('broadcast', { event: 'start_all_devices' }, async (payload: any) => {
        console.log('📡 [START] Received START ALL broadcast!', payload);
        
        // Χρησιμοποιούμε refs για να έχουμε τις τρέχουσες τιμές
        const currentMotionDetector = motionDetectorRef.current;
        const currentIsReady = isReadyRef.current;
        const currentStream = streamRef.current;
        const currentIsActive = isActiveRef.current;
        const currentSession = sessionRef.current;
        
        console.log('📡 [START] Current state (from refs):', { 
          isReady: currentIsReady, 
          hasStream: !!currentStream, 
          hasDetector: !!currentMotionDetector, 
          isActive: currentIsActive 
        });
        
        if (!currentIsReady || !currentStream || !currentMotionDetector || !videoRef.current) {
          console.log('⚠️ [START] Camera not ready - ignoring broadcast');
          return;
        }
        
        if (currentIsActive) {
          console.log('⚠️ [START] Already active - ignoring broadcast');
          return;
        }
        
        // ΑΥΤΟΜΑΤΗ ΕΝΕΡΓΟΠΟΙΗΣΗ motion detection
        console.log('✅ [START] AUTO-ACTIVATING motion detection!');
        setIsActive(true);
        
        currentMotionDetector.start(async () => {
          console.log('🏁 [START] MOTION DETECTED!');
          currentMotionDetector.stop();
          setIsActive(false);
          
          // ΣΤΕΛΝΟΥΜΕ BROADCAST μέσω του ΜΟΝΙΜΟΥ channel
          console.log('📡📡📡 [START] START_ALL MOTION DETECTED - Preparing to send START_TIMER...');
          
          if (timerChannelRef.current) {
            console.log('📡 [START] Channel exists, sending broadcast NOW!');
            const result = await timerChannelRef.current.send({
              type: 'broadcast',
              event: 'start_timer',
              payload: { timestamp: Date.now(), source: 'start_device_start_all' }
            });
            console.log('✅✅✅ [START] START_TIMER broadcast result:', result);
          } else {
            console.error('❌❌❌ [START] Timer channel NOT READY!');
          }
        });
      })
      .subscribe((status) => {
        console.log('🎧 [START] Listener subscription status:', status);
      });

    return () => {
      console.log('🧹 [START] Cleaning up listener channel');
      supabase.removeChannel(channel);
    };
  }, [sessionCode, startTiming, broadcastActivateNext]);

  useEffect(() => {
    if (sessionCode) {
      joinSession(sessionCode);
    }
  }, [sessionCode, joinSession]);

  // Track presence as Start device
  useEffect(() => {
    if (!sessionCode) return;
    
    console.log('🔌 Start: Setting up presence channel for:', sessionCode);
    const channel = supabase.channel(`presence-${sessionCode}`);
    
    channel.subscribe(async (status) => {
      console.log('📡 Start: Channel status:', status);
      if (status === 'SUBSCRIBED') {
        const trackStatus = await channel.track({
          device: 'start',
          timestamp: new Date().toISOString()
        });
        console.log('✅ Start: Track status:', trackStatus);
      }
    });
    
    return () => {
      console.log('🔌 Start: Cleaning up presence channel');
      supabase.removeChannel(channel);
    };
  }, [sessionCode]);

  const handleStartCamera = async () => {
    try {
      setError(null);
      
      if (!videoRef.current) {
        console.error('Video element not found');
        setError('Video element not found');
        return;
      }

      console.log('🎥 Starting camera...');
      const mediaStream = await initializeCamera(videoRef.current, 'environment');
      console.log('✅ Camera stream obtained:', mediaStream);
      setStream(mediaStream);

      // Περιμένουμε το video να έχει διαστάσεις πριν δημιουργήσουμε το detector
      const waitForVideo = () => {
        if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          console.log('📹 Video ready, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          const detector = new MotionDetector(
            videoRef.current,
            40,
            3000
          );
          setMotionDetector(detector);
          setIsReady(true);
          
          toast({
            title: "Κάμερα ενεργοποιήθηκε",
            description: "Περιμένετε το σήμα έναρξης από το TIMER",
          });
        } else {
          setTimeout(waitForVideo, 100);
        }
      };
      
      waitForVideo();
    } catch (error) {
      console.error('❌ Camera error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      
      toast({
        title: "Σφάλμα κάμερας",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stopCamera(stream);
      }
      if (motionDetector) {
        motionDetector.stop();
      }
    };
  }, [stream, motionDetector]);

  if (!session) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="rounded-none">
          <CardContent className="p-6">
            <p>Loading session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-2xl mx-auto rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-[#00ffba]" />
            START Device - {session.session_code}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="rounded-none bg-destructive/10 border-destructive">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Video element πάντα στο DOM για το ref */}
          <div className="relative bg-black rounded-none overflow-hidden" style={{ minHeight: stream ? 'auto' : '0' }}>
            <video
              ref={videoRef}
              className="w-full"
              style={{ display: stream ? 'block' : 'none', transform: `scale(${cameraZoom})` }}
              autoPlay
              playsInline
              muted
            />
            {isActive && stream && (
              <div className="absolute inset-0 border-4 border-[#00ffba] pointer-events-none animate-pulse" />
            )}
            
            {/* Zoom control overlay */}
            {isReady && stream && (
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

          {/* Εμφάνιση session info */}
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded-none">
            <p><strong>START Device Session:</strong> {session?.session_code || 'Loading...'}</p>
            <p><strong>Session ID:</strong> {session?.id || 'N/A'}</p>
            <p><strong>Status:</strong> {isActive ? 'Ενεργό - Αναμονή κίνησης' : 'Περιμένει σήμα από TIMER'}</p>
          </div>

          {!stream ? (
            <Button
              onClick={handleStartCamera}
              className="w-full rounded-none bg-gray-500 hover:bg-gray-600 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Έναρξη Κάμερας
            </Button>
          ) : (
            <>
              {isActive && (
                <Alert className="rounded-none bg-[#00ffba]/10 border-[#00ffba]">
                  <AlertCircle className="h-4 w-4 text-[#00ffba]" />
                  <AlertDescription className="text-[#00ffba]">
                    Αναμονή για κίνηση... Περάστε μπροστά από την κάμερα για έναρξη!
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

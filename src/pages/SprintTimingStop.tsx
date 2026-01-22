import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { Square, Camera, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const SprintTimingStop = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const localResultRef = useRef<any>(null);
  const shouldDetectRef = useRef<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1);
  const { session, joinSession, stopTiming } = useSprintTiming(sessionCode);
  const [localResult, setLocalResult] = useState<any>(null);

  // ΜΟΝΙΜΟ CHANNEL για να στέλνουμε broadcasts στο Timer
  const timerChannelRef = useRef<RealtimeChannel | null>(null);

  // Refs για να έχουμε πρόσβαση στις τρέχουσες τιμές μέσα στο broadcast callback
  const motionDetectorRef = useRef<MotionDetector | null>(null);
  const isReadyRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(false);

  // Sync refs with state
  useEffect(() => { motionDetectorRef.current = motionDetector; }, [motionDetector]);
  useEffect(() => { isReadyRef.current = isReady; }, [isReady]);
  useEffect(() => { streamRef.current = stream; }, [stream]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // ΔΗΜΙΟΥΡΓΙΑ ΜΟΝΙΜΟΥ CHANNEL για επικοινωνία με το Timer
  useEffect(() => {
    if (!sessionCode) return;

    console.log('🔌 [STOP] Creating PERSISTENT timer channel:', `sprint-timer-control-${sessionCode}`);
    
    const channel = supabase.channel(`sprint-timer-control-${sessionCode}`, {
      config: { broadcast: { self: true } }
    });
    
    channel.subscribe((status) => {
      console.log('🔌 [STOP] Timer channel status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ [STOP] Timer channel READY to send broadcasts!');
        timerChannelRef.current = channel;
      }
    });

    return () => {
      console.log('🧹 [STOP] Cleaning up timer channel');
      supabase.removeChannel(channel);
      timerChannelRef.current = null;
    };
  }, [sessionCode]);

  // Track presence as Stop device
  useEffect(() => {
    if (!sessionCode) return;
    
    console.log('🔌 Stop: Setting up presence channel for:', sessionCode);
    const channel = supabase.channel(`presence-${sessionCode}`);
    
    channel.subscribe(async (status) => {
      console.log('📡 Stop: Channel status:', status);
      if (status === 'SUBSCRIBED') {
        const trackStatus = await channel.track({
          device: 'stop',
          timestamp: new Date().toISOString()
        });
        console.log('✅ Stop: Track status:', trackStatus);
      }
    });
    
    return () => {
      console.log('🔌 Stop: Cleaning up presence channel');
      supabase.removeChannel(channel);
    };
  }, [sessionCode]);

  // Listen for sprint results realtime - ΠΑΡΑΚΟΛΟΥΘΗΣΗ currentResult
  useEffect(() => {
    if (!session?.id) return;

    console.log('🎧 STOP: Setting up realtime listener for session:', session.id);

    const channel = supabase
      .channel('sprint-results-stop')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprint_timing_results',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          console.log('📡 STOP: Realtime event:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            const result = payload.new as any;
            // Ενημερώνουμε ΜΟΝΟ αν είναι νέο result χωρίς end_time
            if (!result.end_time) {
              console.log('✅ STOP: New result without end_time, updating localResult:', result);
              localResultRef.current = result;
              setLocalResult(result);
            } else {
              console.log('⚠️ STOP: Result already has end_time, ignoring');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  // Listen for START ALL broadcast
  useEffect(() => {
    if (!sessionCode) return;

    console.log('🎧 [STOP] Setting up START ALL listener for session:', sessionCode);
    
    const channelName = `sprint-start-all-${sessionCode}`;
    console.log('🎧 [STOP] Listening on channel:', channelName);
    
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { ack: false }
        }
      })
      .on('broadcast', { event: 'start_all_devices' }, async (payload: any) => {
        console.log('📡 [STOP] Received START ALL broadcast!', payload);
        
        // Χρησιμοποιούμε refs για να έχουμε τις τρέχουσες τιμές
        const currentMotionDetector = motionDetectorRef.current;
        const currentIsReady = isReadyRef.current;
        const currentStream = streamRef.current;
        const currentIsActive = isActiveRef.current;
        
        if (!currentIsReady || !currentStream || !currentMotionDetector || !videoRef.current) {
          console.log('⚠️ [STOP] Camera not ready');
          return;
        }
        
        if (currentIsActive) {
          console.log('⚠️ [STOP] Already active');
          return;
        }
        
        // ΑΥΤΟΜΑΤΗ ΕΝΕΡΓΟΠΟΙΗΣΗ motion detection
        console.log('✅ [STOP] AUTO-ACTIVATING motion detection from START ALL!');
        console.log('✅ [STOP] Current localResultRef:', localResultRef.current);
        setIsActive(true);
        
        currentMotionDetector.start(async () => {
          console.log('🏁 [STOP] MOTION DETECTED!');
          currentMotionDetector.stop();
          setIsActive(false);
          
          const currentLocalResult = localResultRef.current;
          console.log('🏁 [STOP] localResultRef at motion:', currentLocalResult);
          
          if (!currentLocalResult?.id) {
            console.error('❌ [STOP] No localResult id available!');
            return;
          }
          
          if (currentLocalResult.end_time) {
            console.error('❌ [STOP] Result already has end_time, skipping!');
            return;
          }
          
          await stopTiming(currentLocalResult.id);
        });
      })
      .subscribe((status) => {
        console.log('🎧 [STOP] Listener subscription status:', status);
      });

    return () => {
      console.log('🧹 [STOP] Cleaning up listener channel');
      supabase.removeChannel(channel);
    };
  }, [sessionCode, stopTiming]);

  // Listen for ACTIVATE MOTION DETECTION broadcast - RESET and ACTIVATE
  useEffect(() => {
    if (!sessionCode) {
      console.log('❌ [STOP] No sessionCode, cannot setup listener');
      return;
    }

    console.log('🎧 🎧 🎧 [STOP] Setting up ACTIVATE MOTION listener for channel:', `sprint-broadcast-${sessionCode}`);
    
    const channel = supabase
      .channel(`sprint-broadcast-${sessionCode}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on('broadcast', { event: 'activate_motion_detection' }, (payload: any) => {
        console.log('🔄 🔄 🔄 [STOP] Received ACTIVATE MOTION broadcast! 🔄 🔄 🔄', payload);
        
        // Χρησιμοποιούμε refs για να έχουμε τις τρέχουσες τιμές
        const currentMotionDetector = motionDetectorRef.current;
        const currentIsReady = isReadyRef.current;
        const currentStream = streamRef.current;
        const currentIsActive = isActiveRef.current;
        
        console.log('📊 [STOP] Camera status (from refs):', { 
          isReady: currentIsReady, 
          hasStream: !!currentStream, 
          hasDetector: !!currentMotionDetector,
          hasVideoRef: !!videoRef.current,
          isActive: currentIsActive 
        });
        
        // RESET του localResult και localResultRef για νέα μέτρηση
        console.log('🧹 [STOP] Clearing localResult and localResultRef');
        localResultRef.current = null;
        setLocalResult(null);
        shouldDetectRef.current = false; // Σταματάμε την ανίχνευση
        
        // Σταματάμε το motion detection αν είναι ενεργό
        if (currentIsActive && currentMotionDetector) {
          console.log('🛑 [STOP] Stopping previous motion detection');
          currentMotionDetector.stop();
        }
        
        // Έλεγχος αν η κάμερα είναι έτοιμη
        if (!currentIsReady || !currentStream || !currentMotionDetector || !videoRef.current) {
          console.error('❌ ❌ ❌ [STOP] Camera NOT READY - Cannot activate motion detection! ❌ ❌ ❌');
          console.error('❌ [STOP] Please start the camera first by clicking "Έναρξη Κάμερας"');
          return;
        }
        
        // ΕΝΕΡΓΟΠΟΙΗΣΗ motion detection ΑΜΕΣΩΣ
        console.log('✅ ✅ ✅ [STOP] ACTIVATING motion detection NOW! ✅ ✅ ✅');
        shouldDetectRef.current = true; // Ενεργοποιούμε την ανίχνευση
        setIsActive(true);
        
        currentMotionDetector.start(async () => {
          console.log('🏁 [STOP] MOTION DETECTED!');
          
          // Έλεγχος αν πρέπει να ανιχνεύει (μπορεί να έχει γίνει reset)
          if (!shouldDetectRef.current) {
            console.log('❌ [STOP] Detection cancelled - device was reset');
            return;
          }
          
          currentMotionDetector.stop();
          setIsActive(false);
          shouldDetectRef.current = false;
          
          // ΣΤΕΛΝΟΥΜΕ BROADCAST μέσω του ΜΟΝΙΜΟΥ channel
          if (timerChannelRef.current) {
            console.log('📡 [STOP] Sending STOP_TIMER via persistent channel!');
            timerChannelRef.current.send({
              type: 'broadcast',
              event: 'stop_timer',
              payload: { timestamp: Date.now() }
            }).then(() => {
              console.log('✅ [STOP] STOP_TIMER broadcast SENT!');
            }).catch((err) => {
              console.error('❌ [STOP] Failed to send broadcast:', err);
            });
          } else {
            console.error('❌ [STOP] Timer channel not ready!');
          }
        });
      })
      .on('broadcast', { event: 'reset_all_devices' }, (payload: any) => {
        console.log('🔄 🔄 🔄 [STOP] Received RESET broadcast! 🔄 🔄 🔄', payload);
        
        // ΠΡΩΤΑ απενεργοποιούμε το detection flag
        shouldDetectRef.current = false;
        
        // Σταματάμε το motion detection αν είναι ενεργό
        const currentMotionDetector = motionDetectorRef.current;
        if (currentMotionDetector) {
          console.log('🛑 [STOP] Stopping motion detection');
          currentMotionDetector.stop();
        }
        
        // Μηδενίζουμε όλα τα states
        console.log('🧹 [STOP] Resetting all states');
        setIsActive(false);
        localResultRef.current = null;
        setLocalResult(null);
        
        console.log('✅ [STOP] Reset complete!');
      })
      .subscribe((status) => {
        console.log('🎧 🎧 🎧 [STOP] Broadcast listener subscription status:', status, '🎧 🎧 🎧');
        if (status === 'SUBSCRIBED') {
          console.log('✅ ✅ ✅ [STOP] Successfully SUBSCRIBED to broadcast channel! ✅ ✅ ✅');
        }
      });

    return () => {
      console.log('🧹 [STOP] Cleaning up broadcast listener');
      supabase.removeChannel(channel);
    };
  }, [sessionCode, stopTiming]); // Προσθέτουμε stopTiming για ασφάλεια

  useEffect(() => {
    if (sessionCode) {
      joinSession(sessionCode);
    }
  }, [sessionCode, joinSession]);

  const handleStartCamera = async () => {
    try {
      if (!videoRef.current) {
        console.error('Video element not found');
        return;
      }

      console.log('🎥 Starting camera...');
      const mediaStream = await initializeCamera(videoRef.current, 'environment');
      console.log('✅ Camera stream obtained:', mediaStream);
      setStream(mediaStream);

      // Περιμένουμε το video να έχει διαστάσεις πριν δημιουργήσουμε το detector
      const waitForVideo = async (): Promise<void> => {
        return new Promise((resolve) => {
          const checkVideo = () => {
            if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
              console.log('📹 Video ready, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
              resolve();
            } else {
              setTimeout(checkVideo, 100);
            }
          };
          checkVideo();
        });
      };
      
      await waitForVideo();
      
      const detector = new MotionDetector(
        videoRef.current,
        40, // threshold
        3000 // min motion pixels
      );
      setMotionDetector(detector);
      setIsReady(true);
    } catch (error) {
      console.error('❌ Camera error:', error);
    }
  };

  const handleActivate = () => {
    if (!motionDetector || !videoRef.current || !localResult) return;

    setIsActive(true);
    
    motionDetector.start(async () => {
      console.log('🏁 STOP TRIGGERED BY MOTION!');
      
      motionDetector.stop();
      setIsActive(false);
      
      // Σταματάμε το χρονόμετρο
      await stopTiming(localResult.id);
    });
  };

  const handleStop = () => {
    if (motionDetector) {
      motionDetector.stop();
    }
    setIsActive(false);
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
            <Square className="w-5 h-5 text-red-500" />
            STOP Device - {session.session_code}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {!stream ? (
            <Button
              onClick={handleStartCamera}
              className="w-full rounded-none bg-red-500 hover:bg-red-600 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Έναρξη Κάμερας
            </Button>
          ) : (
            <>
              {isActive && (
                <Alert className="rounded-none bg-red-500/10 border-red-500">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-500">
                    Αναμονή για κίνηση... Περάστε μπροστά από την κάμερα για τερματισμό!
                  </AlertDescription>
                </Alert>
              )}

              {/* Session info */}
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded-none">
                <p><strong>STOP Device Session:</strong> {session?.session_code || 'Loading...'}</p>
                <p><strong>Session ID:</strong> {session?.id || 'N/A'}</p>
                <p><strong>Status:</strong> {isActive ? 'Ενεργό - Αναμονή κίνησης' : 'Περιμένει σήμα'}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

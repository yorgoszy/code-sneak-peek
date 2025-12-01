import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { Square, Camera, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export const SprintTimingStop = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const localResultRef = useRef<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const { session, joinSession, stopTiming } = useSprintTiming(sessionCode);
  const [localResult, setLocalResult] = useState<any>(null);

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
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const result = payload.new as any;
            console.log('✅ STOP: Setting localResult:', result);
            localResultRef.current = result;
            setLocalResult(result);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  // Listen for PREPARE broadcast
  useEffect(() => {
    if (!sessionCode) return;

    console.log('🎧 STOP Device: Setting up PREPARE listener...');
    
    const channel = supabase
      .channel(`sprint-prepare-${sessionCode}`, {
        config: {
          broadcast: { ack: false }
        }
      })
      .on('broadcast', { event: 'prepare_devices' }, (payload: any) => {
        console.log('📡 STOP Device: Received PREPARE broadcast!', payload);
        console.log('✅ STOP Device: Device is now READY and waiting for activation!');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionCode]);

  // Listen for broadcast activation - ΑΥΤΟΜΑΤΗ ΕΝΕΡΓΟΠΟΙΗΣΗ
  useEffect(() => {
    if (!sessionCode) return;

    console.log('🎧 STOP Device: Setting up broadcast listener...');
    
    const channel = supabase
      .channel(`sprint-broadcast-${sessionCode}`, {
        config: {
          broadcast: { ack: false }
        }
      })
      .on('broadcast', { event: 'activate_next_device' }, (payload: any) => {
        console.log('📡 STOP Device: Received broadcast!', payload);
        
        // Ελέγχουμε αν το μήνυμα είναι για εμάς
        if (payload.target !== 'stop') {
          console.log('⚠️ STOP Device: Message not for us, ignoring');
          return;
        }
        
        if (!isReady || !stream || !motionDetector || !videoRef.current) {
          console.log('⚠️ STOP Device: Camera not ready', {
            isReady,
            hasStream: !!stream,
            hasDetector: !!motionDetector
          });
          return;
        }
        
        if (isActive) {
          console.log('⚠️ STOP Device: Already active');
          return;
        }
        
        // ΑΥΤΟΜΑΤΗ ΕΝΕΡΓΟΠΟΙΗΣΗ motion detection
        console.log('✅ STOP Device: AUTO-ACTIVATING motion detection!');
        console.log('✅ STOP Device: localResultRef.current:', localResultRef.current);
        setIsActive(true);
        motionDetector.start(async () => {
          console.log('🏁 STOP TRIGGERED BY MOTION!');
          console.log('🏁 STOP: localResultRef.current at motion:', localResultRef.current);
          motionDetector.stop();
          setIsActive(false);
          if (localResultRef.current?.id) {
            await stopTiming(localResultRef.current.id);
          } else {
            console.error('❌ STOP: No localResult id available!');
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionCode, isReady, stream, motionDetector, stopTiming]);

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
          {localResult && !localResult.end_time && (
            <Alert className="rounded-none bg-green-500/10 border-green-500">
              <AlertCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Χρονόμετρο σε εξέλιξη... Result ID: {localResult.id}
              </AlertDescription>
            </Alert>
          )}

          {/* Test button για direct stop χωρίς motion detection */}
          {localResult && !localResult.end_time && (
            <Button
              onClick={async () => {
                console.log('🧪 TEST STOP DEVICE: ==================');
                console.log('🧪 TEST: localResult:', localResult);
                console.log('🧪 TEST: Calling stopTiming()...');
                
                const result = await stopTiming(localResult.id);
                
                if (result) {
                  console.log('✅ TEST: SUCCESS! Stopped:', result);
                } else {
                  console.error('❌ TEST: stopTiming() failed');
                }
                console.log('🧪 TEST STOP DEVICE: ==================');
              }}
              className="w-full rounded-none bg-blue-500 hover:bg-blue-600 text-white"
            >
              🧪 Test Direct Stop (No Motion Detection)
            </Button>
          )}

          {/* Video element πάντα στο DOM για το ref */}
          <div className="relative bg-black rounded-none overflow-hidden" style={{ minHeight: stream ? 'auto' : '0' }}>
            <video
              ref={videoRef}
              className="w-full"
              style={{ display: stream ? 'block' : 'none' }}
              autoPlay
              playsInline
              muted
            />
            {isActive && stream && (
              <div className="absolute inset-0 border-4 border-[#00ffba] pointer-events-none animate-pulse" />
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

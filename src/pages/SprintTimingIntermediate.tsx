import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { Timer, Camera, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export const SprintTimingIntermediate = () => {
  const { sessionCode, distance } = useParams<{ sessionCode: string; distance: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const localResultRef = useRef<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const { session, joinSession, broadcastActivateNext } = useSprintTiming(sessionCode);
  const [localResult, setLocalResult] = useState<any>(null);

  // Track presence as Intermediate device
  useEffect(() => {
    if (!sessionCode || !distance) return;
    
    console.log(`🔌 Intermediate ${distance}m: Setting up presence channel`);
    const channel = supabase.channel(`presence-${sessionCode}`);
    
    channel.subscribe(async (status) => {
      console.log(`📡 Intermediate ${distance}m: Channel status:`, status);
      if (status === 'SUBSCRIBED') {
        const trackStatus = await channel.track({
          device: `${distance}m`,
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Intermediate ${distance}m: Track status:`, trackStatus);
      }
    });
    
    return () => {
      console.log(`🔌 Intermediate ${distance}m: Cleaning up presence channel`);
      supabase.removeChannel(channel);
    };
  }, [sessionCode, distance]);

  // Listen for sprint results realtime
  useEffect(() => {
    if (!session?.id) return;

    console.log(`🎧 Intermediate ${distance}m: Setting up realtime listener`);

    const channel = supabase
      .channel(`sprint-results-${distance}m`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprint_timing_results',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          console.log(`📡 Intermediate ${distance}m: Realtime event:`, payload.eventType);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const result = payload.new as any;
            console.log(`✅ Intermediate ${distance}m: Setting localResult:`, result);
            localResultRef.current = result;
            setLocalResult(result);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id, distance]);

  // Listen for START ALL broadcast
  useEffect(() => {
    if (!sessionCode || !distance) return;

    console.log(`🎧 [INTERMEDIATE ${distance}m] Setting up START ALL listener for session:`, sessionCode);
    
    const channelName = `sprint-start-all-${sessionCode}`;
    console.log(`🎧 [INTERMEDIATE ${distance}m] Listening on channel:`, channelName);
    
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { ack: false }
        }
      })
      .on('broadcast', { event: 'start_all_devices' }, async (payload: any) => {
        console.log(`📡 [INTERMEDIATE ${distance}m] Received START ALL broadcast!`, payload);
        
        if (!isReady || !stream || !motionDetector || !videoRef.current) {
          console.log(`⚠️ [INTERMEDIATE ${distance}m] Camera not ready`);
          return;
        }
        
        if (isActive) {
          console.log(`⚠️ [INTERMEDIATE ${distance}m] Already active`);
          return;
        }
        
        // ΑΥΤΟΜΑΤΗ ΕΝΕΡΓΟΠΟΙΗΣΗ motion detection
        console.log(`✅ [INTERMEDIATE ${distance}m] AUTO-ACTIVATING motion detection from START ALL!`);
        setIsActive(true);
        
        motionDetector.start(async () => {
          console.log(`🏁 [INTERMEDIATE ${distance}m] MOTION DETECTED!`);
          motionDetector.stop();
          setIsActive(false);
          
          // Βρίσκουμε την επόμενη συσκευή
          const distances = session?.distances || [];
          const currentIndex = distances.indexOf(parseInt(distance));
          const nextDevice = currentIndex < distances.length - 1 
            ? distances[currentIndex + 1].toString() 
            : 'stop';
          
          console.log(`📡 [INTERMEDIATE ${distance}m] Activating next device: ${nextDevice}`);
          await broadcastActivateNext(nextDevice);
        });
      })
      .subscribe((status) => {
        console.log(`🎧 [INTERMEDIATE ${distance}m] Listener subscription status:`, status);
      });

    return () => {
      console.log(`🧹 [INTERMEDIATE ${distance}m] Cleaning up listener channel`);
      supabase.removeChannel(channel);
    };
  }, [sessionCode, distance, isReady, stream, motionDetector, isActive, session, broadcastActivateNext]);

  // Listen for broadcast activation - ΑΥΤΟΜΑΤΗ ΕΝΕΡΓΟΠΟΙΗΣΗ
  useEffect(() => {
    if (!sessionCode || !distance) return;

    console.log(`🎧 Intermediate ${distance}m: Setting up broadcast listener...`);
    
    const channel = supabase
      .channel(`sprint-broadcast-${sessionCode}`, {
        config: {
          broadcast: { ack: false }
        }
      })
      .on('broadcast', { event: 'activate_next_device' }, (payload: any) => {
        console.log(`📡 Intermediate ${distance}m: Received broadcast!`, payload);
        
        // Ελέγχουμε αν το μήνυμα είναι για εμάς
        if (payload.target !== distance) {
          console.log(`⚠️ Intermediate ${distance}m: Message not for us (target: ${payload.target}), ignoring`);
          return;
        }
        
        if (!isReady || !stream || !motionDetector || !videoRef.current) {
          console.log(`⚠️ Intermediate ${distance}m: Camera not ready`, {
            isReady,
            hasStream: !!stream,
            hasDetector: !!motionDetector
          });
          return;
        }
        
        if (isActive) {
          console.log(`⚠️ Intermediate ${distance}m: Already active`);
          return;
        }
        
        // ΑΥΤΟΜΑΤΗ ΕΝΕΡΓΟΠΟΙΗΣΗ motion detection
        console.log(`✅ Intermediate ${distance}m: AUTO-ACTIVATING motion detection!`);
        setIsActive(true);
        
        motionDetector.start(async () => {
          console.log(`🏁 Intermediate ${distance}m: MOTION DETECTED!`);
          motionDetector.stop();
          setIsActive(false);
          
          // Βρίσκουμε την επόμενη συσκευή
          const distances = session?.distances || [];
          const currentIndex = distances.indexOf(parseInt(distance));
          const nextDevice = currentIndex < distances.length - 1 
            ? distances[currentIndex + 1].toString() 
            : 'stop';
          
          console.log(`📡 Intermediate ${distance}m: Activating next device: ${nextDevice}`);
          console.log(`📡 Intermediate ${distance}m: localResultRef.current:`, localResultRef.current);
          await broadcastActivateNext(nextDevice);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionCode, distance, isReady, stream, motionDetector, broadcastActivateNext, session]);

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

      console.log(`🎥 Intermediate ${distance}m: Starting camera...`);
      const mediaStream = await initializeCamera(videoRef.current, 'environment');
      console.log(`✅ Intermediate ${distance}m: Camera stream obtained`);
      setStream(mediaStream);

      const waitForVideo = async (): Promise<void> => {
        return new Promise((resolve) => {
          const checkVideo = () => {
            if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
              console.log(`📹 Intermediate ${distance}m: Video ready`);
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
        40,
        3000
      );
      setMotionDetector(detector);
      setIsReady(true);
    } catch (error) {
      console.error(`❌ Intermediate ${distance}m: Camera error:`, error);
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
            <Timer className="w-5 h-5 text-[#cb8954]" />
            {distance}μ Device - {session.session_code}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {localResult && !localResult.end_time && (
            <Alert className="rounded-none bg-[#cb8954]/10 border-[#cb8954]">
              <AlertCircle className="h-4 w-4 text-[#cb8954]" />
              <AlertDescription className="text-[#cb8954]">
                Χρονόμετρο σε εξέλιξη...
              </AlertDescription>
            </Alert>
          )}

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
              className="w-full rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Έναρξη Κάμερας
            </Button>
          ) : (
            <>
              {isActive && (
                <Alert className="rounded-none bg-[#cb8954]/10 border-[#cb8954]">
                  <AlertCircle className="h-4 w-4 text-[#cb8954]" />
                  <AlertDescription className="text-[#cb8954]">
                    Αναμονή για κίνηση στα {distance}μ...
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground p-2 bg-muted rounded-none">
                <p><strong>{distance}μ Device Session:</strong> {session?.session_code || 'Loading...'}</p>
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

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { Timer, Camera, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export const SprintTimingIntermediate = () => {
  const { sessionCode, distance } = useParams<{ sessionCode: string; distance: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const localResultRef = useRef<any>(null);
  const shouldDetectRef = useRef<boolean>(false); // Flag για έλεγχο αν πρέπει να ανιχνεύει
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1);
  const { session, joinSession, stopTiming, broadcastActivateNext } = useSprintTiming(sessionCode);
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

  // Listen for ACTIVATE MOTION DETECTION broadcast - RESET and ACTIVATE
  useEffect(() => {
    if (!sessionCode || !distance) {
      console.log(`❌ [INTERMEDIATE ${distance}m] No sessionCode or distance, cannot setup listener`);
      return;
    }

    console.log(`🎧 🎧 🎧 [INTERMEDIATE ${distance}m] Setting up ACTIVATE MOTION listener for channel:`, `sprint-broadcast-${sessionCode}`);
    
    const channel = supabase
      .channel(`sprint-broadcast-${sessionCode}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on('broadcast', { event: 'activate_motion_detection' }, (payload: any) => {
        console.log(`🔄 🔄 🔄 [INTERMEDIATE ${distance}m] Received ACTIVATE MOTION broadcast! 🔄 🔄 🔄`, payload);
        console.log(`📊 [INTERMEDIATE ${distance}m] Camera status:`, { 
          isReady, 
          hasStream: !!stream, 
          hasDetector: !!motionDetector,
          hasVideoRef: !!videoRef.current,
          isActive 
        });
        
        // RESET του localResult και localResultRef για νέα μέτρηση
        console.log(`🧹 [INTERMEDIATE ${distance}m] Clearing localResult and localResultRef`);
        localResultRef.current = null;
        setLocalResult(null);
        shouldDetectRef.current = false; // Σταματάμε την ανίχνευση
        
        // Σταματάμε το motion detection αν είναι ενεργό
        if (isActive && motionDetector) {
          console.log(`🛑 [INTERMEDIATE ${distance}m] Stopping previous motion detection`);
          motionDetector.stop();
        }
        
        // Έλεγχος αν η κάμερα είναι έτοιμη
        if (!isReady || !stream || !motionDetector || !videoRef.current) {
          console.error(`❌ ❌ ❌ [INTERMEDIATE ${distance}m] Camera NOT READY - Cannot activate motion detection! ❌ ❌ ❌`);
          console.error(`❌ [INTERMEDIATE ${distance}m] Please start the camera first`);
          return;
        }
        
        // ΕΝΕΡΓΟΠΟΙΗΣΗ motion detection ΑΜΕΣΩΣ
        console.log(`✅ ✅ ✅ [INTERMEDIATE ${distance}m] ACTIVATING motion detection NOW! ✅ ✅ ✅`);
        shouldDetectRef.current = true; // Ενεργοποιούμε την ανίχνευση
        setIsActive(true);
        
        motionDetector.start(async () => {
          console.log(`🏁 [INTERMEDIATE ${distance}m] MOTION DETECTED!`);
          
          // Έλεγχος αν πρέπει να ανιχνεύει (μπορεί να έχει γίνει reset)
          if (!shouldDetectRef.current) {
            console.log(`❌ [INTERMEDIATE ${distance}m] Detection cancelled - device was reset`);
            return;
          }
          
          const currentLocalResult = localResultRef.current;
          console.log(`🏁 [INTERMEDIATE ${distance}m] localResultRef.current at motion:`, currentLocalResult);
          motionDetector.stop();
          setIsActive(false);
          shouldDetectRef.current = false;
          
          if (!currentLocalResult?.id) {
            console.error(`❌ [INTERMEDIATE ${distance}m] No localResult id available!`);
            return;
          }
          
          if (currentLocalResult.end_time) {
            console.error(`❌ [INTERMEDIATE ${distance}m] Result already has end_time, skipping!`);
            return;
          }
          
          await stopTiming(currentLocalResult.id);
          
          // Ενεργοποίηση επόμενης συσκευής
          const distances = session?.distances || [];
          const currentIndex = distances.indexOf(parseInt(distance));
          const nextIndex = currentIndex + 1;
          
          if (nextIndex < distances.length) {
            const nextDevice = distances[nextIndex].toString();
            console.log(`📡 [INTERMEDIATE ${distance}m] Activating next device: ${nextDevice}`);
            await broadcastActivateNext(nextDevice);
          } else {
            console.log(`📡 [INTERMEDIATE ${distance}m] Activating STOP device`);
            await broadcastActivateNext('stop');
          }
        });
      })
      .on('broadcast', { event: 'reset_all_devices' }, (payload: any) => {
        console.log(`🔄 🔄 🔄 [INTERMEDIATE ${distance}m] Received RESET broadcast! 🔄 🔄 🔄`, payload);
        
        // ΠΡΩΤΑ απενεργοποιούμε το detection flag
        shouldDetectRef.current = false;
        
        // Σταματάμε το motion detection αν είναι ενεργό
        if (motionDetector) {
          console.log(`🛑 [INTERMEDIATE ${distance}m] Stopping motion detection`);
          motionDetector.stop();
        }
        
        // Μηδενίζουμε όλα τα states
        console.log(`🧹 [INTERMEDIATE ${distance}m] Resetting all states`);
        setIsActive(false);
        localResultRef.current = null;
        setLocalResult(null);
        
        console.log(`✅ [INTERMEDIATE ${distance}m] Reset complete!`);
      })
      .subscribe((status) => {
        console.log(`🎧 🎧 🎧 [INTERMEDIATE ${distance}m] Broadcast listener subscription status:`, status, `🎧 🎧 🎧`);
        if (status === 'SUBSCRIBED') {
          console.log(`✅ ✅ ✅ [INTERMEDIATE ${distance}m] Successfully SUBSCRIBED to broadcast channel! ✅ ✅ ✅`);
        }
      });

    return () => {
      console.log(`🧹 [INTERMEDIATE ${distance}m] Cleaning up broadcast listener`);
      supabase.removeChannel(channel);
    };
  }, [sessionCode, distance]); // sessionCode και distance στο dependency array

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

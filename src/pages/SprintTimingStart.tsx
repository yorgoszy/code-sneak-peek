import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { Play, Camera, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const SprintTimingStart = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session, joinSession, startTiming, broadcastActivateNext } = useSprintTiming(sessionCode);
  const { toast } = useToast();

  // Listen for ACTIVATE MOTION DETECTION broadcast - RESET state
  useEffect(() => {
    if (!sessionCode) return;

    console.log('🎧 [START] Setting up ACTIVATE MOTION listener...');
    
    const channel = supabase
      .channel(`sprint-broadcast-reset-${sessionCode}`, {
        config: {
          broadcast: { ack: false }
        }
      })
      .on('broadcast', { event: 'activate_motion_detection' }, (payload: any) => {
        console.log('🔄 [START] Received ACTIVATE MOTION broadcast - RESETTING!', payload);
        
        // Σταματάμε το motion detection αν είναι ενεργό
        if (isActive && motionDetector) {
          console.log('🛑 [START] Stopping active motion detection');
          motionDetector.stop();
          setIsActive(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionCode, isActive, motionDetector]);

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
        console.log('📡 [START] Current state:', { isReady, hasStream: !!stream, hasDetector: !!motionDetector, isActive });
        
        if (!isReady || !stream || !motionDetector || !videoRef.current) {
          console.log('⚠️ [START] Camera not ready - ignoring broadcast');
          return;
        }
        
        if (isActive) {
          console.log('⚠️ [START] Already active - ignoring broadcast');
          return;
        }
        
        // ΑΥΤΟΜΑΤΗ ΕΝΕΡΓΟΠΟΙΗΣΗ motion detection
        console.log('✅ [START] AUTO-ACTIVATING motion detection!');
        setIsActive(true);
        
        motionDetector.start(async () => {
          console.log('🏁 [START] MOTION DETECTED!');
          motionDetector.stop();
          setIsActive(false);
          
          // Ξεκινάμε το χρονόμετρο
          const result = await startTiming();
          
          if (result) {
            console.log('✅ [START] Timer started:', result.id);
            
            // Ενεργοποίηση επόμενης συσκευής
            const distances = session?.distances || [];
            const nextDevice = distances.length > 0 ? distances[0].toString() : 'stop';
            console.log(`📡 [START] Activating next device: ${nextDevice}`);
            await broadcastActivateNext(nextDevice);
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
  }, [sessionCode, isReady, stream, motionDetector, isActive, startTiming, broadcastActivateNext, session]);

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
              style={{ display: stream ? 'block' : 'none' }}
              autoPlay
              playsInline
              muted
            />
            {isActive && stream && (
              <div className="absolute inset-0 border-4 border-[#00ffba] pointer-events-none animate-pulse" />
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

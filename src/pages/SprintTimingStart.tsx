import { useState, useEffect, useRef } from 'react';
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
  const { session, currentResult: hookResult, joinSession, startTiming, broadcastActivateMotion } = useSprintTiming(sessionCode);
  const { toast } = useToast();

  useEffect(() => {
    if (sessionCode) {
      joinSession(sessionCode);
    }
  }, [sessionCode, joinSession]);

  // Track presence as Start device
  useEffect(() => {
    if (!sessionCode) {
      console.log('❌ Start: No sessionCode, skipping presence setup');
      return;
    }
    
    console.log('🔌 Start: Setting up presence channel for:', sessionCode);
    const channelName = `presence-${sessionCode}`;
    console.log('📡 Start: Channel name:', channelName);
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: sessionCode,
        },
      },
    });
    
    channel.subscribe(async (status) => {
      console.log('📡 Start: Channel subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Start: Channel subscribed, tracking presence...');
        const trackStatus = await channel.track({
          device: 'start',
          timestamp: new Date().toISOString()
        });
        console.log('✅ Start: Track status:', trackStatus);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Start: Channel error');
      } else if (status === 'TIMED_OUT') {
        console.error('❌ Start: Channel timed out');
      }
    });
    
    return () => {
      console.log('🔌 Start: Cleaning up presence channel');
      channel.untrack();
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
            40, // threshold
            3000 // min motion pixels
          );
          setMotionDetector(detector);
          setIsReady(true);
          
          toast({
            title: "Κάμερα ενεργοποιήθηκε",
            description: "Μπορείτε να ενεργοποιήσετε το motion detection",
          });
        } else {
          // Δοκιμάζουμε ξανά σε 100ms
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

  const handleActivate = () => {
    if (!motionDetector || !videoRef.current) return;

    setIsActive(true);
    
    motionDetector.start(async () => {
      console.log('🏁 START TRIGGERED BY MOTION!');
      
      // Σταματάμε την ανίχνευση
      motionDetector.stop();
      setIsActive(false);
      
      // Ξεκινάμε το χρονόμετρο (χωρίς απόσταση - αυτό είναι START)
      await startTiming();
    });
  };

  const handleBroadcastActivate = async () => {
    if (!isReady || !stream) {
      toast({
        title: "Σφάλμα",
        description: "Η κάμερα δεν είναι έτοιμη",
        variant: "destructive",
      });
      return;
    }

    await broadcastActivateMotion();
    handleActivate();
    
    toast({
      title: "Έναρξη Motion Detection",
      description: "Όλες οι συσκευές ενεργοποιήθηκαν!",
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

          {!stream ? (
            <Button
              onClick={handleStartCamera}
              className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
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

              <div className="space-y-2">
                <Button
                  onClick={handleBroadcastActivate}
                  disabled={!isReady || isActive}
                  className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black font-bold"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Έναρξη Όλων των Συσκευών
                </Button>

                <div className="flex gap-2">
                  {!isActive ? (
                    <Button
                      onClick={handleActivate}
                      disabled={!isReady}
                      className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                    >
                      Ενεργοποίηση Μόνο START
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStop}
                      variant="destructive"
                      className="flex-1 rounded-none"
                    >
                      Απενεργοποίηση
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

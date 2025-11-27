import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { Play, Camera, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SprintTimingStart = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [searchParams] = useSearchParams();
  const distance = searchParams.get('distance');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const { session, joinSession, startTiming } = useSprintTiming(sessionCode);

  useEffect(() => {
    if (sessionCode) {
      joinSession(sessionCode);
    }
  }, [sessionCode, joinSession]);

  const handleStartCamera = async () => {
    try {
      if (!videoRef.current) return;

      const mediaStream = await initializeCamera(videoRef.current, 'environment');
      setStream(mediaStream);

      // Περιμένουμε να φορτώσει το video
      videoRef.current.onloadedmetadata = () => {
        const detector = new MotionDetector(
          videoRef.current!,
          40, // threshold
          3000 // min motion pixels
        );
        setMotionDetector(detector);
        setIsReady(true);
      };
    } catch (error) {
      console.error('Camera error:', error);
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
      
      // Ξεκινάμε το χρονόμετρο
      await startTiming(distance ? parseInt(distance) : undefined);
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-[#00ffba]" />
              START Device - {session.session_code}
            </div>
            {distance && (
              <Badge variant="secondary" className="rounded-none text-lg">
                {distance}m
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <div className="relative bg-black rounded-none overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full"
                  autoPlay
                  playsInline
                  muted
                />
                {isActive && (
                  <div className="absolute inset-0 border-4 border-[#00ffba] pointer-events-none animate-pulse" />
                )}
              </div>

              {isActive && (
                <Alert className="rounded-none bg-[#00ffba]/10 border-[#00ffba]">
                  <AlertCircle className="h-4 w-4 text-[#00ffba]" />
                  <AlertDescription className="text-[#00ffba]">
                    Αναμονή για κίνηση... Περάστε μπροστά από την κάμερα για έναρξη!
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                {!isActive ? (
                  <Button
                    onClick={handleActivate}
                    disabled={!isReady}
                    className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                  >
                    Ενεργοποίηση Motion Detection
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

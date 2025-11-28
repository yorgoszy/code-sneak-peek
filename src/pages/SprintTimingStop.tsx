import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { Square, Camera, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SprintTimingStop = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const { session, currentResult, joinSession, stopTiming } = useSprintTiming(sessionCode);

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
    if (!motionDetector || !videoRef.current || !currentResult) return;

    setIsActive(true);
    
    motionDetector.start(async () => {
      console.log('🏁 STOP TRIGGERED BY MOTION!');
      
      motionDetector.stop();
      setIsActive(false);
      
      // Σταματάμε το χρονόμετρο
      await stopTiming(currentResult.id);
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
          {currentResult && !currentResult.end_time && (
            <Alert className="rounded-none bg-green-500/10 border-green-500">
              <AlertCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Χρονόμετρο σε εξέλιξη...
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
              <div className="absolute inset-0 border-4 border-red-500 pointer-events-none animate-pulse" />
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

            <div className="flex gap-2">
              {!isActive ? (
                <Button
                  onClick={handleActivate}
                  disabled={!isReady || !currentResult || !!currentResult.end_time}
                  className="flex-1 rounded-none bg-red-500 hover:bg-red-600 text-white"
                >
                  Ενεργοποίηση Motion Detection
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  variant="secondary"
                  className="flex-1 rounded-none"
                >
                  Απενεργοποίηση
                </Button>
              )}
            </div>

            {currentResult?.duration_ms && (
              <div className="bg-muted p-6 rounded-none text-center">
                <p className="text-sm text-muted-foreground mb-2">Τελικός Χρόνος</p>
                <p className="text-5xl font-bold text-[#00ffba]">
                  {(currentResult.duration_ms / 1000).toFixed(3)}
                </p>
                <p className="text-xl text-muted-foreground mt-1">δευτερόλεπτα</p>
              </div>
            )}
          </>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

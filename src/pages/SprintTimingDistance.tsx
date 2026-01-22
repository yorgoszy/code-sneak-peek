import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { MotionDetector, initializeCamera, stopCamera } from '@/utils/motionDetection';
import { MapPin, Camera, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export const SprintTimingDistance = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [searchParams] = useSearchParams();
  const distancesParam = searchParams.get('distances');
  const distances = distancesParam ? distancesParam.split(',').map(Number) : [];
  const [completedDistances, setCompletedDistances] = useState<number[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [motionDetector, setMotionDetector] = useState<MotionDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1);
  const { session, currentResult, joinSession, stopTiming } = useSprintTiming(sessionCode);

  // Track presence as Distance device with distances info
  useEffect(() => {
    if (!sessionCode || distances.length === 0) return;
    
    console.log('🔌 Distance: Setting up presence channel for:', sessionCode);
    const distanceLabel = distances.join(',') + 'm';
    const channel = supabase.channel(`presence-${sessionCode}`);
    
    channel.subscribe(async (status) => {
      console.log('📡 Distance: Channel status:', status);
      if (status === 'SUBSCRIBED') {
        const trackStatus = await channel.track({
          device: `distance-${distanceLabel}`,
          timestamp: new Date().toISOString()
        });
        console.log('✅ Distance: Track status:', trackStatus);
      }
    });
    
    return () => {
      console.log('🔌 Distance: Cleaning up presence channel');
      supabase.removeChannel(channel);
    };
  }, [sessionCode, distances]);

  // Listen for broadcast activation
  useEffect(() => {
    if (!sessionCode) return;

    console.log('🎧 DISTANCE Device: Setting up broadcast listener...');
    
    const channel = supabase
      .channel(`sprint-broadcast-${sessionCode}`, {
        config: {
          broadcast: { ack: false }
        }
      })
      .on('broadcast', { event: 'activate_motion_detection' }, (payload) => {
        console.log('📡 DISTANCE Device: Received broadcast!', payload);
        if (isReady && stream && !isActive && currentResult && !currentResult.end_time && completedDistances.length < distances.length && motionDetector && videoRef.current) {
          const nextDistance = distances.find(d => !completedDistances.includes(d));
          if (nextDistance) {
            console.log(`✅ DISTANCE Device: Activating for ${nextDistance}m`);
            setIsActive(true);
            motionDetector.start(async () => {
              console.log(`📍 DISTANCE ${nextDistance}m TRIGGERED BY MOTION (Broadcast)!`);
              motionDetector.stop();
              setIsActive(false);
              await stopTiming(currentResult.id);
              setCompletedDistances(prev => [...prev, nextDistance]);
            });
          }
        } else {
          console.log('⚠️ DISTANCE Device: Conditions not met', {
            isReady,
            hasStream: !!stream,
            isActive,
            hasResult: !!currentResult,
            resultEnded: currentResult?.end_time,
            hasDetector: !!motionDetector,
            completed: completedDistances.length,
            total: distances.length
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionCode, isReady, stream, isActive, currentResult, completedDistances, distances, motionDetector, stopTiming]);

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
    if (!motionDetector || !videoRef.current || !currentResult?.id) return;

    setIsActive(true);
    
    motionDetector.start(async () => {
      // Βρίσκουμε την επόμενη απόσταση που δεν έχει ολοκληρωθεί
      const nextDistance = distances.find(d => !completedDistances.includes(d));
      
      if (!nextDistance) {
        console.log('⚠️ Όλες οι αποστάσεις έχουν ολοκληρωθεί');
        motionDetector.stop();
        setIsActive(false);
        return;
      }
      
      console.log(`📍 DISTANCE ${nextDistance}m TRIGGERED BY MOTION!`);
      
      motionDetector.stop();
      setIsActive(false);
      
      // Σταματάμε το χρονόμετρο για αυτή την απόσταση
      await stopTiming(currentResult.id);
      
      // Σημειώνουμε ότι αυτή η απόσταση ολοκληρώθηκε
      setCompletedDistances(prev => [...prev, nextDistance]);
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
              <MapPin className="w-5 h-5 text-[#cb8954]" />
              DISTANCE Device - {session.session_code}
            </div>
            <div className="flex gap-2 flex-wrap">
              {distances.map(dist => (
                <Badge 
                  key={dist} 
                  className={`rounded-none ${
                    completedDistances.includes(dist)
                      ? 'bg-green-500 hover:bg-green-500'
                      : 'bg-[#cb8954] hover:bg-[#cb8954]/90'
                  }`}
                >
                  {dist}m {completedDistances.includes(dist) && '✓'}
                </Badge>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentResult && !currentResult.end_time && (
            <Alert className="rounded-none bg-blue-500/10 border-blue-500">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-500">
                Χρονόμετρο σε εξέλιξη... Επόμενη απόσταση: {distances.find(d => !completedDistances.includes(d))}m
              </AlertDescription>
            </Alert>
          )}
          
          {completedDistances.length > 0 && (
            <div className="bg-[#cb8954]/10 p-4 rounded-none border border-[#cb8954]">
              <p className="text-sm text-muted-foreground mb-2">Ολοκληρωμένες Αποστάσεις</p>
              <div className="flex gap-2 flex-wrap">
                {completedDistances.map(dist => (
                  <Badge key={dist} className="rounded-none bg-green-500">
                    {dist}m ✓
                  </Badge>
                ))}
              </div>
            </div>
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

            {isReady && !isActive && completedDistances.length < distances.length && (
              <Alert className="rounded-none">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Περάστε μπροστά από την κάμερα στα {distances.find(d => !completedDistances.includes(d))}m για να καταγραφεί ο χρόνος
                </AlertDescription>
              </Alert>
            )}
            
            {completedDistances.length === distances.length && (
              <Alert className="rounded-none bg-green-500/10 border-green-500">
                <AlertCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  ✓ Όλες οι αποστάσεις ολοκληρώθηκαν!
                </AlertDescription>
              </Alert>
            )}

            {isReady && (
              <div className="flex gap-2">
                {!isActive ? (
                  <Button
                    onClick={handleActivate}
                    disabled={!currentResult || !!currentResult.end_time || completedDistances.length === distances.length}
                    className="flex-1 rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white"
                  >
                    Ενεργοποίηση Motion Detection
                    {completedDistances.length < distances.length && ` (${distances.find(d => !completedDistances.includes(d))}m)`}
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
            )}
          </>
        )}

        </CardContent>
      </Card>
    </div>
  );
};

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
  const { session, currentResult: hookResult, joinSession, startTiming, broadcastActivateMotion, broadcastActivateNext, broadcastPrepareDevices } = useSprintTiming(sessionCode);
  const { toast } = useToast();

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

  const handleActivate = useCallback(() => {
    if (!motionDetector || !videoRef.current) {
      console.error('❌ START: Motion detector or video ref not ready');
      return;
    }

    console.log('🟢 START: Activating motion detection...', { 
      session: session?.id, 
      sessionCode: session?.session_code 
    });
    setIsActive(true);
    
    motionDetector.start(async () => {
      console.log('🏁 START: ⚡ MOTION DETECTED! ⚡');
      console.log('🔴 START: Green border should disappear now');
      console.log('📍 START: Session ID:', session?.id);
      
      // Σταματάμε την ανίχνευση
      motionDetector.stop();
      setIsActive(false);
      
      // Ξεκινάμε το χρονόμετρο
      console.log('🔄 START: Calling startTiming() to create database record...');
      const result = await startTiming();
      
      if (result) {
        console.log('✅ START: SUCCESS! Timing record created:', {
          id: result.id,
          session_id: result.session_id,
          start_time: result.start_time
        });
        console.log('📡 START: TIMER device should now pick this up via realtime!');
        
        // Ενεργοποίηση επόμενης συσκευής
        const distances = session?.distances || [];
        const nextDevice = distances.length > 0 ? distances[0].toString() : 'stop';
        console.log(`📡 START: Activating next device: ${nextDevice}`);
        await broadcastActivateNext(nextDevice);
        
        toast({
          title: "✅ Χρονόμετρο ξεκίνησε!",
          description: `Timing ID: ${result.id}`,
        });
      } else {
        console.error('❌ START: FAILED - startTiming() returned null');
        toast({
          title: "Σφάλμα",
          description: "Αποτυχία έναρξης χρονομέτρου",
          variant: "destructive",
        });
      }
    });
    
    toast({
      title: "Motion Detection Ενεργό",
      description: "Περιμένει για κίνηση...",
    });
  }, [motionDetector, session, startTiming, toast]);

  const handleStartActivate = async () => {
    console.log('🔘 START: Start button clicked!', { 
      stream: !!stream, 
      isActive, 
      session: !!session,
      motionDetector: !!motionDetector,
      isReady
    });
    
    if (!stream) {
      console.log('⚠️ START: No camera stream available');
      toast({
        title: "Σφάλμα",
        description: "Ενεργοποιήστε πρώτα την κάμερα",
        variant: "destructive",
      });
      return;
    }

    if (!session) {
      console.log('⚠️ START: No session found');
      toast({
        title: "Σφάλμα",
        description: "Δεν υπάρχει ενεργό session",
        variant: "destructive",
      });
      return;
    }

    if (!motionDetector) {
      console.log('⚠️ START: Motion detector not ready');
      toast({
        title: "Σφάλμα",
        description: "Περιμένετε να φορτώσει η κάμερα",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Στέλνουμε broadcast για να ετοιμάσουμε όλες τις συσκευές
      console.log('📡 START: Broadcasting PREPARE to all devices...');
      await broadcastPrepareDevices();
      
      // Ενεργοποιούμε το motion detection του START device
      console.log('🎬 START: Activating START motion detection...');
      handleActivate();
      
      toast({
        title: "Motion Detection Ενεργό",
        description: "Όλες οι συσκευές ετοιμάστηκαν!",
      });
    } catch (error) {
      console.error('❌ START: Error activating motion detection:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία ενεργοποίησης",
        variant: "destructive",
      });
    }
  };

  const handleStop = () => {
    if (motionDetector) {
      motionDetector.stop();
    }
    setIsActive(false);
  };

  // Αφαιρέθηκε το broadcast listener από το START device
  // Το START device ενεργοποιείται μόνο μέσω του κουμπιού "Έναρξη"

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

          {/* Κουμπί έναρξης motion detection */}
          <button
            onClick={handleStartActivate}
            disabled={isActive || !stream}
            className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black font-bold h-16 text-lg px-6 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 border-0"
            type="button"
          >
            <Play className="w-6 h-6" />
            Έναρξη
          </button>

          {/* Test button για direct start χωρίς motion detection */}
          <Button
            onClick={async () => {
              console.log('🧪 TEST START DEVICE: ==================');
              console.log('🧪 TEST: Session Code:', sessionCode);
              console.log('🧪 TEST: Session Object:', session);
              console.log('🧪 TEST: Session ID:', session?.id);
              
              if (!session) {
                console.error('❌ TEST: NO SESSION FOUND!');
                toast({
                  title: "❌ Error",
                  description: "No session found! Refresh and try again.",
                  variant: "destructive",
                });
                return;
              }
              
              console.log('🧪 TEST: Calling startTiming()...');
              const result = await startTiming();
              
              if (result) {
                console.log('✅ TEST: SUCCESS! Created record:', {
                  id: result.id,
                  session_id: result.session_id,
                  start_time: result.start_time
                });
                toast({
                  title: "✅ Test Success",
                  description: `Result ID: ${result.id}\nSession: ${session.session_code}`,
                });
              } else {
                console.error('❌ TEST: startTiming() returned null');
                toast({
                  title: "❌ Test Failed",
                  description: "startTiming() returned null",
                  variant: "destructive",
                });
              }
              console.log('🧪 TEST START DEVICE: ==================');
            }}
            className="w-full rounded-none bg-blue-500 hover:bg-blue-600 text-white"
          >
            🧪 Test Direct Start (No Motion Detection)
          </Button>

          {/* Εμφάνιση session info */}
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded-none">
            <p><strong>START Device Session:</strong> {session?.session_code || 'Loading...'}</p>
            <p><strong>Session ID:</strong> {session?.id || 'N/A'}</p>
          </div>

          {!stream ? (
            <Button
              onClick={handleStartCamera}
              className="w-full rounded-none bg-gray-500 hover:bg-gray-600 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Έναρξη Κάμερας (Optional)
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

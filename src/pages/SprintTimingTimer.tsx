import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Timer as TimerIcon, Play, Square, RotateCcw, Radar } from 'lucide-react';

export const SprintTimingTimer = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const { session, currentResult: hookResult, joinSession, broadcastActivateMotion, broadcastResetDevices } = useSprintTiming(sessionCode);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<{ [key: string]: { device: string, timestamp: string }[] }>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sprintDistance, setSprintDistance] = useState<number>(30);

  useEffect(() => {
    if (sessionCode) {
      joinSession(sessionCode);
    }
  }, [sessionCode, joinSession]);

  // Listen for START/STOP/RESET/ACTIVATE_MOTION broadcasts from other devices
  useEffect(() => {
    if (!sessionCode) return;

    console.log('🎧 TIMER: Setting up broadcast listeners for:', sessionCode);

    // Channel για start_timer και stop_timer
    const controlChannel = supabase
      .channel(`sprint-timer-control-${sessionCode}`)
      .on('broadcast', { event: 'start_timer' }, (payload) => {
        console.log('▶️▶️▶️ TIMER: Received START_TIMER broadcast!', payload);
        const now = Date.now();
        setStartTime(now);
        setIsRunning(true);
        setElapsedTime(0);
      })
      .on('broadcast', { event: 'stop_timer' }, (payload) => {
        console.log('⏹️⏹️⏹️ TIMER: Received STOP_TIMER broadcast!', payload);
        setIsRunning(false);
        // Κρατάμε το τελικό elapsed time
      })
      .subscribe((status) => {
        console.log('🎧 TIMER: Control channel status:', status);
      });

    // Channel για reset
    const resetChannel = supabase
      .channel(`timer-reset-${sessionCode}`)
      .on('broadcast', { event: 'reset_all_devices' }, () => {
        console.log('🔄🔄🔄 TIMER: Received RESET broadcast!');
        setIsRunning(false);
        setStartTime(null);
        setElapsedTime(0);
        setCurrentResult(null);
        setSprintDistance(null);
      })
      .subscribe();

    // Channel για activate_motion_detection (με απόσταση)
    const motionChannel = supabase
      .channel(`sprint-broadcast-${sessionCode}`)
      .on('broadcast', { event: 'activate_motion_detection' }, (payload) => {
        console.log('📍📍📍 TIMER: Received ACTIVATE_MOTION with distance!', payload);
        const distance = payload.payload?.distanceMeters;
        if (distance) {
          console.log('📍 TIMER: Setting sprint distance to:', distance);
          setSprintDistance(distance);
        }
      })
      .subscribe((status) => {
        console.log('🎧 TIMER: Motion channel status:', status);
      });

    return () => {
      supabase.removeChannel(controlChannel);
      supabase.removeChannel(resetChannel);
      supabase.removeChannel(motionChannel);
    };
  }, [sessionCode]);

  // Track presence as Timer device
  useEffect(() => {
    if (!sessionCode) return;
    
    console.log('🔌 Timer: Setting up presence channel for:', sessionCode);
    const channel = supabase.channel(`presence-${sessionCode}`);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('👥 Timer: Presence sync:', state);
        setConnectedDevices(state as any);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('✅ Timer: Device joined:', key, newPresences);
        const state = channel.presenceState();
        setConnectedDevices(state as any);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 Timer: Device left:', key, leftPresences);
        const state = channel.presenceState();
        setConnectedDevices(state as any);
      })
      .subscribe(async (status) => {
        console.log('📡 Timer: Channel status:', status);
        if (status === 'SUBSCRIBED') {
          const trackStatus = await channel.track({
            device: 'timer',
            timestamp: new Date().toISOString()
          });
          console.log('✅ Timer: Track status:', trackStatus);
        }
      });
    
    return () => {
      console.log('🔌 Timer: Cleaning up presence channel');
      supabase.removeChannel(channel);
    };
  }, [sessionCode]);

  // Sync with hook result initially
  useEffect(() => {
    if (hookResult) {
      setCurrentResult(hookResult);
    }
  }, [hookResult]);

  // Listen for results only for this session - REALTIME
  // Το μόνο που κάνει: ενημερώνει το currentResult
  useEffect(() => {
    if (!session?.id) {
      console.warn('⚠️ TIMER: No session ID, skipping realtime setup');
      return;
    }

    console.log('🎧 TIMER: Setting up realtime listener for session:', session.id);

    const channel = supabase
      .channel('sprint-results')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprint_timing_results',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          console.log('📡 TIMER: ========== REALTIME EVENT ==========');
          console.log('📡 TIMER: Event type:', payload.eventType);
          console.log('📡 TIMER: Payload:', payload.new);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const result = payload.new as any;
            console.log('✅ TIMER: Setting currentResult, the other useEffect will handle the rest');
            setCurrentResult(result);
          }
          
          console.log('📡 TIMER: ========== END ==========');
        }
      )
      .subscribe((status) => {
        console.log('🎧 TIMER: Subscription status:', status);
      });

    return () => {
      console.log('🎧 TIMER: Cleaning up realtime listener');
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  // Monitor currentResult and start/stop timer accordingly
  useEffect(() => {
    console.log('🔄 TIMER: currentResult changed:', currentResult);
    
    if (!currentResult) {
      console.log('⚠️ TIMER: No currentResult, resetting timer');
      setIsRunning(false);
      setElapsedTime(0);
      setStartTime(null);
      return;
    }

    // If result has duration (completed), show final time
    if (currentResult.duration_ms) {
      console.log('✅ TIMER: Result completed, showing final time:', currentResult.duration_ms);
      setElapsedTime(currentResult.duration_ms);
      setIsRunning(false);
      setStartTime(null);
      return;
    }

    // If result has start_time but no end_time, start counting
    if (currentResult.start_time && !currentResult.end_time) {
      const startTimeMs = new Date(currentResult.start_time).getTime();
      console.log('▶️ TIMER: Starting timer! Start time:', startTimeMs);
      
      setStartTime(startTimeMs);
      setIsRunning(true);
      setElapsedTime(0);
      
      console.log('✅ TIMER: Timer should now be running!');
    } else {
      console.log('⚠️ TIMER: Unexpected state', currentResult);
    }
  }, [currentResult]);

  const handleManualStart = () => {
    console.log('▶️ TIMER: Manual start');
    setStartTime(Date.now());
    setIsRunning(true);
    setElapsedTime(0);
  };

  const handleManualStop = () => {
    console.log('⏹️ TIMER: Manual stop');
    setIsRunning(false);
    setStartTime(null);
  };

  const handleRefresh = async () => {
    console.log('🔄 TIMER: Broadcasting RESET to all devices...');
    // Στέλνουμε broadcast σε όλες τις συσκευές να μηδενιστούν
    await broadcastResetDevices();
    
    // Περιμένουμε λίγο για να φτάσει το broadcast και μετά κάνουμε local reset
    setTimeout(() => {
      console.log('🔄 TIMER: Local reset');
      setIsRunning(false);
      setStartTime(null);
      setElapsedTime(0);
      setCurrentResult(null);
    }, 300);
  };

  // Timer interval - updates elapsed time every 10ms when running
  useEffect(() => {
    if (!isRunning || !startTime) {
      console.log('⏸️ TIMER: Timer interval not running', { isRunning, startTime });
      return;
    }

    console.log('⏱️ TIMER: Starting interval with startTime:', startTime);

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      setElapsedTime(elapsed);
    }, 10); // Update every 10ms

    return () => {
      console.log('🛑 TIMER: Clearing interval');
      clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}.${centiseconds.toString().padStart(2, '0')}`;
  };

  // Calculate speed in km/h
  const calculateSpeed = (distanceMeters: number, timeMs: number): number => {
    if (timeMs <= 0) return 0;
    const timeSeconds = timeMs / 1000;
    const speedMps = distanceMeters / timeSeconds; // meters per second
    const speedKmh = speedMps * 3.6; // convert to km/h
    return speedKmh;
  };

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

  const getDeviceIcon = (device: string) => {
    if (device === 'start') return '🟢';
    if (device === 'stop') return '🔴';
    if (device === 'timer') return '⏱️';
    if (device.startsWith('distance')) return '📍';
    return '🔵';
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-2xl w-full rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <TimerIcon className="w-5 h-5 text-blue-500" />
            TIMER Device - {session.session_code}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connected Devices */}
          <div className="bg-muted p-4 rounded-none">
            <h3 className="text-sm font-semibold mb-3">Συνδεδεμένες Συσκευές</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(connectedDevices).map(([key, data]: [string, any]) => (
                <Badge 
                  key={key}
                  variant="outline" 
                  className="rounded-none justify-start py-2"
                >
                  <span className="mr-2">{getDeviceIcon(data[0]?.device)}</span>
                  <span className="capitalize">{data[0]?.device}</span>
                  <span className="ml-auto text-xs text-green-500">● Connected</span>
                </Badge>
              ))}
              {Object.keys(connectedDevices).length === 0 && (
                <p className="text-sm text-muted-foreground col-span-2">
                  Καμία συσκευή δεν είναι συνδεδεμένη ακόμα
                </p>
              )}
            </div>
          </div>
          {/* Status Badge */}
          <div className="text-center">
            <Badge 
              className="rounded-none text-lg px-4 py-2"
              variant={isRunning ? "default" : "secondary"}
            >
              {isRunning ? 'Running' : currentResult?.duration_ms ? 'Completed' : 'Waiting'}
            </Badge>
          </div>

          {/* Timer Display */}
          <div className="bg-black/90 p-12 rounded-none">
            <div className="text-center">
              <div className={`font-mono text-8xl font-bold ${
                isRunning ? 'text-[#00ffba]' : currentResult?.duration_ms ? 'text-blue-500' : 'text-gray-500'
              }`}>
                {formatTime(elapsedTime)}
              </div>
              <div className="text-gray-400 text-sm mt-4">
                {isRunning ? 'Χρονομέτρηση σε εξέλιξη...' : 
                 currentResult?.duration_ms ? 'Ολοκληρώθηκε!' : 
                 'Αναμονή για έναρξη...'}
              </div>
            </div>
          </div>

          {/* Distance Input & Speed Display */}
          <div className="bg-[#cb8954]/10 border border-[#cb8954]/30 p-4 rounded-none space-y-4">
            {/* Distance Input */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-[#cb8954] whitespace-nowrap">Απόσταση:</Label>
              <Input
                type="number"
                value={sprintDistance}
                onChange={(e) => setSprintDistance(parseInt(e.target.value) || 0)}
                className="rounded-none h-10 text-lg font-bold text-center w-24 bg-white"
                min={1}
              />
              <span className="text-[#cb8954] font-semibold">μέτρα</span>
            </div>
            
            {/* Speed Display */}
            <div className="text-center border-t border-[#cb8954]/20 pt-4">
              <p className="text-sm text-[#cb8954] mb-2">Ταχύτητα</p>
              <div className="font-mono text-5xl font-bold text-[#cb8954]">
                {sprintDistance > 0 && elapsedTime > 0 && !isRunning 
                  ? calculateSpeed(sprintDistance, elapsedTime).toFixed(2)
                  : '--'
                }
                <span className="text-2xl ml-2">km/h</span>
              </div>
            </div>
          </div>

          {/* Motion Detection Button */}
          <Button
            onClick={async () => {
              console.log('🎬 TIMER: Broadcasting ACTIVATE MOTION DETECTION...');
              await broadcastActivateMotion();
            }}
            className="w-full rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white h-16 text-lg font-bold"
          >
            <Radar className="w-6 h-6 mr-2" />
            ΑΝΙΧΝΕΥΣΗ ΚΙΝΗΣΗΣ
          </Button>

          {/* Manual Controls */}
          <div className="flex gap-4">
            <Button
              onClick={handleManualStart}
              disabled={isRunning}
              className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-16 text-lg"
            >
              <Play className="w-6 h-6 mr-2" />
              Start
            </Button>
            <Button
              onClick={handleManualStop}
              disabled={!isRunning}
              className="flex-1 rounded-none bg-red-500 hover:bg-red-600 text-white h-16 text-lg"
            >
              <Square className="w-6 h-6 mr-2" />
              Stop
            </Button>
            <Button
              onClick={handleRefresh}
              className="flex-1 rounded-none bg-gray-500 hover:bg-gray-600 text-white h-16 text-lg"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Distance Info */}
          {currentResult?.distance_meters && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Απόσταση</p>
              <Badge variant="outline" className="rounded-none text-2xl py-2 px-4 mt-2">
                {currentResult.distance_meters}m
              </Badge>
            </div>
          )}

          {/* Εμφάνιση session info */}
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded-none mt-4">
            <p><strong>TIMER Device Session:</strong> {session?.session_code || 'Loading...'}</p>
            <p><strong>Session ID:</strong> {session?.id || 'N/A'}</p>
            <p><strong>Listening to:</strong> sprint_timing_results where session_id={session?.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

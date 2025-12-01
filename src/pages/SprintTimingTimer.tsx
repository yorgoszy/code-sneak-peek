import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Timer as TimerIcon } from 'lucide-react';

export const SprintTimingTimer = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const { session, currentResult: hookResult, joinSession } = useSprintTiming(sessionCode);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<{ [key: string]: { device: string, timestamp: string }[] }>({});

  useEffect(() => {
    if (sessionCode) {
      joinSession(sessionCode);
    }
  }, [sessionCode, joinSession]);

  // Track presence as Timer device και ακούει για αλλαγές realtime
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
          console.log('⏱️ TIMER: Result update received:', payload);
          console.log('📊 TIMER: Payload event:', payload.eventType);
          console.log('📊 TIMER: Payload new data:', payload.new);
          
          if (payload.eventType === 'INSERT') {
            console.log('🆕 TIMER: New result inserted - starting timer!');
            setCurrentResult(payload.new as any);
          } else if (payload.eventType === 'UPDATE') {
            console.log('🔄 TIMER: Result updated');
            setCurrentResult(payload.new as any);
          }
        }
      )
      .subscribe((status) => {
        console.log('🎧 TIMER: Channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ TIMER: Successfully subscribed to realtime updates for session:', session.id);
        }
      });

    return () => {
      console.log('🎧 TIMER: Cleaning up realtime listener');
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  // Monitor currentResult for timing
  useEffect(() => {
    console.log('🔄 TIMER: currentResult changed:', currentResult);
    
    if (!currentResult) {
      console.log('⚠️ TIMER: No currentResult, resetting timer');
      setIsRunning(false);
      setElapsedTime(0);
      return;
    }

    // If result has duration (completed), show final time
    if (currentResult.duration_ms) {
      console.log('✅ TIMER: Result completed, showing final time:', currentResult.duration_ms);
      setElapsedTime(currentResult.duration_ms);
      setIsRunning(false);
      return;
    }

    // If result has start_time but no end_time, start counting
    if (currentResult.start_time && !currentResult.end_time) {
      console.log('▶️ TIMER: Starting timer with start_time:', currentResult.start_time);
      setIsRunning(true);
      const startTime = new Date(currentResult.start_time).getTime();
      console.log('🕐 TIMER: Start timestamp:', startTime);
      
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        setElapsedTime(elapsed);
      }, 10); // Update every 10ms for smooth display

      return () => {
        console.log('⏹️ TIMER: Clearing interval');
        clearInterval(interval);
      };
    } else {
      console.log('⚠️ TIMER: Unexpected state - start_time:', currentResult.start_time, 'end_time:', currentResult.end_time);
    }
  }, [currentResult]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
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

          {/* Distance Info */}
          {currentResult?.distance_meters && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Απόσταση</p>
              <Badge variant="outline" className="rounded-none text-2xl py-2 px-4 mt-2">
                {currentResult.distance_meters}m
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

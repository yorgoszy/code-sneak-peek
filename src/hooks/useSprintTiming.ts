import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SprintSession {
  id: string;
  session_code: string;
  status: 'waiting' | 'active' | 'completed';
  distances?: number[];
  created_at: string;
}

interface SprintResult {
  id: string;
  session_id: string;
  distance_meters?: number;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  created_at: string;
}

export const useSprintTiming = (sessionCode?: string) => {
  const [session, setSession] = useState<SprintSession | null>(null);
  const [currentResult, setCurrentResult] = useState<SprintResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<{ [key: string]: { device: string, timestamp: string }[] }>({});
  const { toast } = useToast();

  // Δημιουργία νέου session
  const createSession = useCallback(async (distances?: number[]) => {
    setIsLoading(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('sprint_timing_sessions')
        .insert({
          session_code: code,
          distances: distances || [10, 20, 30],
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      setSession(data as SprintSession);
      toast({
        title: 'Session Created',
        description: `Session Code: ${code}`,
      });

      return data as SprintSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Αποτυχία δημιουργίας session',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Join σε υπάρχον session με κωδικό
  const joinSession = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sprint_timing_sessions')
        .select('*')
        .eq('session_code', code.toUpperCase())
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: 'Error',
          description: 'Το session δεν βρέθηκε',
          variant: 'destructive',
        });
        return null;
      }

      setSession(data as SprintSession);
      return data as SprintSession;
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: 'Error',
        description: 'Αποτυχία σύνδεσης στο session',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Έναρξη χρονομέτρησης
  const startTiming = useCallback(async (distanceMeters?: number) => {
    if (!session) return null;

    try {
      // Ενημέρωση session status σε active
      await supabase
        .from('sprint_timing_sessions')
        .update({ status: 'active' })
        .eq('id', session.id);

      // Δημιουργία νέου result
      const { data, error } = await supabase
        .from('sprint_timing_results')
        .insert({
          session_id: session.id,
          distance_meters: distanceMeters,
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentResult(data);
      console.log('⏱️ Timing started:', data);
      return data;
    } catch (error) {
      console.error('Error starting timing:', error);
      toast({
        title: 'Error',
        description: 'Αποτυχία έναρξης χρονομέτρησης',
        variant: 'destructive',
      });
      return null;
    }
  }, [session, toast]);

  // Τερματισμός χρονομέτρησης
  const stopTiming = useCallback(async (resultId: string) => {
    try {
      const endTime = new Date();
      
      // Fetch το result για να πάρουμε το start_time
      const { data: result } = await supabase
        .from('sprint_timing_results')
        .select('start_time')
        .eq('id', resultId)
        .single();

      if (!result) throw new Error('Result not found');

      const startTime = new Date(result.start_time);
      const durationMs = endTime.getTime() - startTime.getTime();

      // Ενημέρωση του result με end_time και duration
      const { data, error } = await supabase
        .from('sprint_timing_results')
        .update({
          end_time: endTime.toISOString(),
          duration_ms: durationMs
        })
        .eq('id', resultId)
        .select()
        .single();

      if (error) throw error;

      console.log('⏱️ Timing stopped:', data);
      toast({
        title: 'Completed!',
        description: `Time: ${(durationMs / 1000).toFixed(3)}s`,
      });

      return data;
    } catch (error) {
      console.error('Error stopping timing:', error);
      toast({
        title: 'Error',
        description: 'Αποτυχία τερματισμού χρονομέτρησης',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Track device presence
  const trackDevicePresence = useCallback(async (sessionCode: string, deviceType: string) => {
    const channel = supabase.channel(`presence-${sessionCode}`);
    
    await channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('👥 Presence sync:', state);
        setConnectedDevices(state as any);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('✅ Device joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 Device left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            device: deviceType,
            timestamp: new Date().toISOString()
          });
        }
      });

    return channel;
  }, []);

  // Broadcast έναρξης motion detection σε όλες τις συσκευές
  const broadcastActivateMotion = useCallback(async () => {
    if (!session?.session_code) return;

    console.log('📡 Broadcasting activate motion detection to all devices...');
    
    const channel = supabase.channel(`sprint-broadcast-${session.session_code}`, {
      config: {
        broadcast: { ack: false }
      }
    });
    
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Broadcast channel subscribed, sending message...');
        
        await channel.send({
          type: 'broadcast',
          event: 'activate_motion_detection',
          payload: { timestamp: new Date().toISOString() }
        });
        
        console.log('✅ Broadcast sent successfully');
        
        // Cleanup after a short delay
        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 1000);
      }
    });
  }, [session]);

  // Broadcast για έναρξη ΟΛΩΝ των συσκευών
  const broadcastStartAll = useCallback(async () => {
    if (!session?.session_code) return;

    console.log('📡 [TIMER] Broadcasting START ALL DEVICES...');
    
    // Unique channel name με timestamp για να αποφύγουμε conflicts
    const channelName = `sprint-start-all-${session.session_code}-${Date.now()}`;
    console.log('📡 [TIMER] Creating channel:', channelName);
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false }
      }
    });
    
    await channel.subscribe(async (status) => {
      console.log('📡 [TIMER] Channel status:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ [TIMER] Channel subscribed, sending start all message...');
        
        await channel.send({
          type: 'broadcast',
          event: 'start_all_devices',
          payload: { 
            timestamp: new Date().toISOString() 
          }
        });
        
        console.log('✅ [TIMER] Start all broadcast sent');
        
        // Cleanup immediately after sending
        setTimeout(async () => {
          console.log('🧹 [TIMER] Cleaning up channel:', channelName);
          await supabase.removeChannel(channel);
          console.log('✅ [TIMER] Channel cleaned up');
        }, 500);
      }
    });
  }, [session]);

  // Broadcast για ετοιμασία όλων των συσκευών
  const broadcastPrepareDevices = useCallback(async () => {
    if (!session?.session_code) return;

    console.log('📡 Broadcasting PREPARE to all devices...');
    
    const channel = supabase.channel(`sprint-broadcast-${session.session_code}`, {
      config: {
        broadcast: { ack: false }
      }
    });
    
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Broadcast channel subscribed, sending prepare message...');
        
        await channel.send({
          type: 'broadcast',
          event: 'prepare_devices',
          payload: { 
            timestamp: new Date().toISOString() 
          }
        });
        
        console.log('✅ Prepare broadcast sent');
        
        // Cleanup after a short delay
        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 1000);
      }
    });
  }, [session]);

  // Broadcast στην επόμενη συσκευή
  const broadcastActivateNext = useCallback(async (nextDevice: string) => {
    if (!session?.session_code) return;

    console.log(`📡 Broadcasting activate to NEXT device: ${nextDevice}...`);
    
    const channel = supabase.channel(`sprint-broadcast-${session.session_code}`, {
      config: {
        broadcast: { ack: false }
      }
    });
    
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Broadcast channel subscribed, sending to ${nextDevice}...`);
        
        await channel.send({
          type: 'broadcast',
          event: 'activate_next_device',
          payload: { 
            target: nextDevice,
            timestamp: new Date().toISOString() 
          }
        });
        
        console.log(`✅ Broadcast sent to ${nextDevice}`);
        
        // Cleanup after a short delay
        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 1000);
      }
    });
  }, [session]);

  // Subscribe to realtime changes for sessions only
  useEffect(() => {
    if (!sessionCode) return;

    const channel = supabase
      .channel('sprint-timing')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprint_timing_sessions',
          filter: `session_code=eq.${sessionCode}`
        },
        (payload) => {
          console.log('Session update:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            setSession(payload.new as SprintSession);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionCode]);

  return {
    session,
    currentResult,
    isLoading,
    connectedDevices,
    createSession,
    joinSession,
    startTiming,
    stopTiming,
    broadcastActivateMotion,
    broadcastActivateNext,
    broadcastPrepareDevices,
    broadcastStartAll,
    trackDevicePresence
  };
};

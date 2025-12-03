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
      const startTime = new Date().toISOString();
      
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
          start_time: startTime
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentResult(data);
      console.log('⏱️ Timing started:', data);
      
      // Broadcast timing_started στο Timer
      console.log('📡 Broadcasting TIMING STARTED to Timer...');
      const channel = supabase.channel(`sprint-broadcast-${session.session_code}`, {
        config: { broadcast: { self: true } }
      });
      
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'timing_started',
            payload: { 
              result_id: data.id,
              start_time: startTime,
              distance_meters: distanceMeters
            }
          });
          console.log('✅ TIMING STARTED broadcast sent!');
          setTimeout(() => supabase.removeChannel(channel), 500);
        }
      });
      
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
    if (!session) return null;
    
    try {
      const endTime = new Date();
      
      // Fetch το result για να πάρουμε το start_time και να ελέγξουμε αν έχει ήδη end_time
      const { data: result } = await supabase
        .from('sprint_timing_results')
        .select('start_time, end_time')
        .eq('id', resultId)
        .single();

      if (!result) throw new Error('Result not found');
      
      // Αν το result έχει ήδη end_time, δεν κάνουμε τίποτα
      if (result.end_time) {
        console.warn('⚠️ stopTiming: Result already has end_time, skipping update');
        return null;
      }

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
      
      // Broadcast timing_stopped στο Timer
      console.log('📡 Broadcasting TIMING STOPPED to Timer...');
      const channel = supabase.channel(`sprint-broadcast-${session.session_code}`, {
        config: { broadcast: { self: true } }
      });
      
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'timing_stopped',
            payload: { 
              result_id: data.id,
              duration_ms: durationMs,
              end_time: endTime.toISOString()
            }
          });
          console.log('✅ TIMING STOPPED broadcast sent!');
          setTimeout(() => supabase.removeChannel(channel), 500);
        }
      });
      
      // Μορφοποίηση χρόνου: λεπτά:δευτερόλεπτα.εκατοστά
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const centiseconds = Math.floor((durationMs % 1000) / 10);
      
      const formattedTime = minutes > 0 
        ? `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
        : `${seconds}.${centiseconds.toString().padStart(2, '0')}`;
      
      toast({
        title: 'Completed!',
        description: `Time: ${formattedTime}`,
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
  }, [session, toast]);

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

    console.log('📡 📡 📡 Broadcasting ACTIVATE MOTION DETECTION to all devices! 📡 📡 📡');
    console.log('📡 Channel name:', `sprint-broadcast-${session.session_code}`);
    
    // Χρησιμοποιούμε το ίδιο channel name που ακούν οι listeners
    const channel = supabase.channel(`sprint-broadcast-${session.session_code}`, {
      config: {
        broadcast: { self: true } // Να στείλει και στον εαυτό του
      }
    });
    
    await channel.subscribe(async (status) => {
      console.log('📡 Broadcast channel status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ ✅ ✅ Broadcast channel SUBSCRIBED, sending message NOW! ✅ ✅ ✅');
        
        // Περιμένουμε λίγο για να βεβαιωθούμε ότι όλοι οι listeners είναι έτοιμοι
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await channel.send({
          type: 'broadcast',
          event: 'activate_motion_detection',
          payload: { 
            timestamp: new Date().toISOString(),
            sessionCode: session.session_code
          }
        });
        
        console.log('✅ ✅ ✅ Broadcast SENT successfully! ✅ ✅ ✅');
        
        // Cleanup after a delay
        setTimeout(() => {
          console.log('🧹 Cleaning up broadcast channel');
          supabase.removeChannel(channel);
        }, 2000);
      }
    });
  }, [session]);

  // Broadcast για έναρξη ΟΛΩΝ των συσκευών
  const broadcastStartAll = useCallback(async () => {
    if (!session?.session_code) return;

    console.log('📡 [TIMER] Broadcasting START ALL DEVICES...');
    
    // Χρησιμοποιούμε σταθερό channel name που ταιριάζει με τα listeners
    const channelName = `sprint-start-all-${session.session_code}`;
    console.log('📡 [TIMER] Using channel:', channelName);
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: true }
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
        
        // Cleanup after broadcast
        setTimeout(async () => {
          console.log('🧹 [TIMER] Cleaning up broadcast channel');
          await supabase.removeChannel(channel);
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

  // Broadcast για reset όλων των συσκευών
  const broadcastResetDevices = useCallback(async () => {
    if (!sessionCode) {
      console.error('❌ No sessionCode available for reset broadcast!');
      return;
    }

    console.log('🔄 🔄 🔄 Broadcasting RESET to all devices! 🔄 🔄 🔄');
    console.log('🔄 Session Code:', sessionCode);
    console.log('🔄 Channel name:', `sprint-broadcast-${sessionCode}`);
    
    const channel = supabase.channel(`sprint-broadcast-${sessionCode}`, {
      config: {
        broadcast: { self: true }
      }
    });
    
    await channel.subscribe(async (status) => {
      console.log('🔄 Reset broadcast channel status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ ✅ ✅ Reset channel SUBSCRIBED, sending RESET message! ✅ ✅ ✅');
        
        await channel.send({
          type: 'broadcast',
          event: 'reset_all_devices',
          payload: { 
            timestamp: new Date().toISOString(),
            sessionCode: sessionCode
          }
        });
        
        console.log('✅ ✅ ✅ RESET Broadcast SENT successfully! ✅ ✅ ✅');
        
        // Cleanup
        setTimeout(() => {
          console.log('🧹 Cleaning up reset broadcast channel');
          supabase.removeChannel(channel);
        }, 1000);
      }
    });
  }, [sessionCode]);

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
    broadcastResetDevices,
    trackDevicePresence
  };
};

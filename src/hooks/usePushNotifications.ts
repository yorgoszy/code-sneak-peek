import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

// Public VAPID key - safe to expose (used to subscribe browsers to push)
const VAPID_PUBLIC_KEY = 'BPxXKxBz_PLACEHOLDER_REPLACE_WITH_REAL_PUBLIC_KEY';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function bufToBase64(buf: ArrayBuffer | null): string | null {
  if (!buf) return null;
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  workout_reminder: boolean;
  program_assigned: boolean;
  test_scheduled: boolean;
  coach_message: boolean;
  rpe_reminder: boolean;
  health_card_expiry: boolean;
  booking_confirmation: boolean;
  booking_reminder_24h: boolean;
  goal_milestone: boolean;
  award_unlocked: boolean;
  muaythai_sparring_reminder: boolean;
  recovery_alert: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  email_channel: boolean;
  push_channel: boolean;
}

export function usePushNotifications() {
  const { user, userProfile } = useAuthContext();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const appUserId = userProfile?.id ?? null;

  const isSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && typeof Notification !== 'undefined';

  // Load existing subscription state
  useEffect(() => {
    if (!isSupported) return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch (e) {
        console.warn('SW not ready', e);
      }
    })();
  }, [isSupported]);

  // Load preferences
  useEffect(() => {
    if (!appUserId) return;
    (async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', appUserId)
        .maybeSingle();
      if (data) setPreferences(data as any);
    })();
  }, [appUserId]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !appUserId) return false;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
      }
      const json = sub.toJSON();
      await supabase.from('push_subscriptions').upsert({
        user_id: appUserId,
        platform: 'web',
        endpoint: sub.endpoint,
        p256dh_key: (json.keys as any)?.p256dh ?? bufToBase64(sub.getKey('p256dh')),
        auth_key: (json.keys as any)?.auth ?? bufToBase64(sub.getKey('auth')),
        device_info: {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
        },
        is_active: true,
        last_used_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform,endpoint,device_token' });

      setIsSubscribed(true);
      return true;
    } catch (e) {
      console.error('subscribe error', e);
      return false;
    } finally {
      setLoading(false);
    }
  }, [appUserId, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !appUserId) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('user_id', appUserId)
          .eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [appUserId, isSupported]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!appUserId) return;
    const merged = { ...(preferences ?? { user_id: appUserId } as any), ...updates };
    setPreferences(merged);
    const { data } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: appUserId, ...updates }, { onConflict: 'user_id' })
      .select()
      .single();
    if (data) setPreferences(data as any);
  }, [appUserId, preferences]);

  const sendTest = useCallback(async () => {
    if (!appUserId) return null;
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: appUserId,
        notification_type: 'coach_message',
        variables: { message_preview: 'Test notification ✅' },
        force_send: true,
      },
    });
    return error ? { error } : data;
  }, [appUserId]);

  return {
    permission, isSubscribed, isSupported, loading,
    preferences, subscribe, unsubscribe, updatePreferences, sendTest,
  };
}

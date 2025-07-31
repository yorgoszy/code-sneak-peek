import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationActions {
  markAsAcknowledged: (notificationType: string, itemIds: string[]) => Promise<void>;
  isAcknowledged: (notificationType: string, itemId: string) => boolean;
  refreshAcknowledged: () => Promise<void>;
}

export const usePersistentNotifications = (): NotificationActions => {
  const { user } = useAuth();
  const userId = user?.id;
  const [acknowledgedItems, setAcknowledgedItems] = useState<Map<string, Set<string>>>(new Map());

  // Φόρτωση acknowledged notifications από τη βάση
  const loadAcknowledgedNotifications = async () => {
    if (!userId) return;

    try {
      const { data: userProfile } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!userProfile) return;

      const { data: notifications } = await supabase
        .from('admin_notifications')
        .select('notification_type, item_id')
        .eq('admin_user_id', userProfile.id);

      const acknowledgedMap = new Map<string, Set<string>>();
      
      notifications?.forEach(notification => {
        const typeSet = acknowledgedMap.get(notification.notification_type) || new Set();
        typeSet.add(notification.item_id);
        acknowledgedMap.set(notification.notification_type, typeSet);
      });

      setAcknowledgedItems(acknowledgedMap);
    } catch (error) {
      console.error('Error loading acknowledged notifications:', error);
    }
  };

  // Marking items as acknowledged
  const markAsAcknowledged = async (notificationType: string, itemIds: string[]) => {
    if (!userId || itemIds.length === 0) return;

    try {
      const { data: userProfile } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!userProfile) return;

      // Προσθήκη στη βάση δεδομένων
      const notificationsToInsert = itemIds.map(itemId => ({
        admin_user_id: userProfile.id,
        notification_type: notificationType,
        item_id: itemId
      }));

      await supabase
        .from('admin_notifications')
        .upsert(notificationsToInsert, { 
          onConflict: 'admin_user_id,notification_type,item_id',
          ignoreDuplicates: true 
        });

      // Ενημέρωση local state
      const updatedMap = new Map(acknowledgedItems);
      const typeSet = updatedMap.get(notificationType) || new Set();
      itemIds.forEach(id => typeSet.add(id));
      updatedMap.set(notificationType, typeSet);
      setAcknowledgedItems(updatedMap);

    } catch (error) {
      console.error('Error marking notifications as acknowledged:', error);
    }
  };

  const isAcknowledged = (notificationType: string, itemId: string): boolean => {
    const typeSet = acknowledgedItems.get(notificationType);
    return typeSet ? typeSet.has(itemId) : false;
  };

  const refreshAcknowledged = async () => {
    await loadAcknowledgedNotifications();
  };

  useEffect(() => {
    loadAcknowledgedNotifications();
  }, [userId]);

  return {
    markAsAcknowledged,
    isAcknowledged,
    refreshAcknowledged
  };
};
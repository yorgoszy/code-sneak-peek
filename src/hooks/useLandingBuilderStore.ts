import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Layout {
  id: string;
  name: string;
  layout_data: any;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useLandingBuilderStore = () => {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLayouts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('landing_page_layouts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setLayouts(data || []);
    } catch (error) {
      console.error('Error fetching layouts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  const saveLayout = useCallback(async (name: string, layoutData: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Get app_user id
      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', userData.user.id)
        .single();

      if (currentLayoutId) {
        // Update existing layout
        const { error } = await supabase
          .from('landing_page_layouts')
          .update({
            name,
            layout_data: JSON.parse(layoutData),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentLayoutId);

        if (error) throw error;
      } else {
        // Create new layout
        const { data, error } = await supabase
          .from('landing_page_layouts')
          .insert({
            name,
            layout_data: JSON.parse(layoutData),
            created_by: appUser?.id
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setCurrentLayoutId(data.id);
      }

      await fetchLayouts();
    } catch (error) {
      console.error('Error saving layout:', error);
      throw error;
    }
  }, [currentLayoutId, fetchLayouts]);

  const loadLayout = useCallback(async (layoutId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('landing_page_layouts')
        .select('layout_data')
        .eq('id', layoutId)
        .single();

      if (error) throw error;
      
      setCurrentLayoutId(layoutId);
      return data?.layout_data ? JSON.stringify(data.layout_data) : null;
    } catch (error) {
      console.error('Error loading layout:', error);
      throw error;
    }
  }, []);

  const publishLayout = useCallback(async (layoutId: string) => {
    try {
      // First, set all layouts to not active
      await supabase
        .from('landing_page_layouts')
        .update({ is_active: false });

      // Then set the selected layout as active and published
      const { error } = await supabase
        .from('landing_page_layouts')
        .update({
          is_published: true,
          is_active: true,
          published_at: new Date().toISOString()
        })
        .eq('id', layoutId);

      if (error) throw error;
      
      await fetchLayouts();
      toast.success('Layout published successfully!');
    } catch (error) {
      console.error('Error publishing layout:', error);
      toast.error('Failed to publish layout');
    }
  }, [fetchLayouts]);

  const deleteLayout = useCallback(async (layoutId: string) => {
    try {
      const { error } = await supabase
        .from('landing_page_layouts')
        .delete()
        .eq('id', layoutId);

      if (error) throw error;
      
      if (currentLayoutId === layoutId) {
        setCurrentLayoutId(null);
      }
      
      await fetchLayouts();
      toast.success('Layout deleted');
    } catch (error) {
      console.error('Error deleting layout:', error);
      toast.error('Failed to delete layout');
    }
  }, [currentLayoutId, fetchLayouts]);

  return {
    layouts,
    currentLayoutId,
    setCurrentLayoutId,
    loading,
    saveLayout,
    loadLayout,
    publishLayout,
    deleteLayout,
    fetchLayouts
  };
};

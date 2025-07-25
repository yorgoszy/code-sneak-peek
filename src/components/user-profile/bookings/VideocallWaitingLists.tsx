import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, X, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWaitingList } from "@/hooks/useWaitingList";
import { toast } from "sonner";
import { format } from "date-fns";

interface VideocallWaitingEntry {
  id: string;
  section_id: string;
  booking_date: string;
  booking_time: string;
  position: number;
  created_at: string;
  booking_sections?: {
    name: string;
  };
}

interface VideocallWaitingListsProps {
  userProfile: any;
}

export const VideocallWaitingLists: React.FC<VideocallWaitingListsProps> = ({ userProfile }) => {
  const [waitingEntries, setWaitingEntries] = useState<VideocallWaitingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { leaveWaitingList } = useWaitingList();

  useEffect(() => {
    if (userProfile?.id) {
      fetchWaitingEntries();
    }
  }, [userProfile]);

  const fetchWaitingEntries = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('booking_waiting_list')
        .select(`
          *,
          booking_sections!fk_waiting_list_section(name)
        `)
        .eq('user_id', userProfile.id)
        .eq('booking_type', 'videocall')
        .eq('status', 'waiting')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) {
        console.error('Error fetching videocall waiting entries:', error);
        return;
      }

      setWaitingEntries(data || []);
    } catch (error) {
      console.error('Error fetching videocall waiting entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWaitingList = async (entry: VideocallWaitingEntry) => {
    const success = await leaveWaitingList(
      entry.section_id,
      entry.booking_date,
      entry.booking_time,
      'videocall'
    );
    
    if (success) {
      await fetchWaitingEntries();
    }
  };

  if (loading) {
    return <div className="text-center py-4">Φόρτωση...</div>;
  }

  if (waitingEntries.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Δεν είστε σε λίστα αναμονής για videocalls</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {waitingEntries.map((entry) => (
        <div key={entry.id} className="border border-gray-200 rounded-none p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-[#00ffba] text-black rounded-none">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-sm">
                  {format(new Date(entry.booking_date), 'dd/MM/yyyy')} στις {entry.booking_time}
                </div>
                <div className="text-xs text-gray-500">
                  {entry.booking_sections?.name || 'Videocall Session'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs rounded-none bg-yellow-50 text-yellow-700 border-yellow-200">
                <Users className="w-3 h-3 mr-1" />
                Θέση #{entry.position}
              </Badge>
              <Button
                onClick={() => handleLeaveWaitingList(entry)}
                variant="outline"
                size="sm"
                className="rounded-none text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="w-3 h-3 mr-1" />
                Αφαίρεση
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <Clock className="w-3 h-3 inline mr-1" />
            Προστέθηκε: {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
      ))}
    </div>
  );
};
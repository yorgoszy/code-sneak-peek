import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, X, Calendar } from "lucide-react";
import { useWaitingList } from "@/hooks/useWaitingList";
import { format } from "date-fns";
import { useToast } from '@/hooks/use-toast';

interface WaitingListEntry {
  id: string;
  section_id: string;
  booking_date: string;
  booking_time: string;
  position: number;
  status: string;
  created_at: string;
  booking_sections?: {
    name: string;
  };
}

export const UserWaitingLists: React.FC = () => {
  const [waitingEntries, setWaitingEntries] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { leaveWaitingList, getUserWaitingListEntries } = useWaitingList();
  const { toast } = useToast();

  useEffect(() => {
    fetchWaitingEntries();
  }, []);

  const fetchWaitingEntries = async () => {
    setLoading(true);
    try {
      const entries = await getUserWaitingListEntries();
      setWaitingEntries(entries);
    } catch (error) {
      console.error('Error fetching waiting list entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWaitingList = async (entry: WaitingListEntry) => {
    const success = await leaveWaitingList(
      entry.section_id,
      entry.booking_date,
      entry.booking_time
    );
    
    if (success) {
      // Remove the entry from local state
      setWaitingEntries(prev => prev.filter(e => e.id !== entry.id));
      toast({
        title: "Επιτυχία",
        description: "Αφαιρεθήκατε από τη λίστα αναμονής",
        variant: "default",
      });
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00ffba] mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Φόρτωση λιστών αναμονής...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Λίστες Αναμονής
        </CardTitle>
      </CardHeader>
      <CardContent>
        {waitingEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Δεν έχετε εγγραφές σε λίστες αναμονής</h3>
            <p>Όταν ένα slot είναι γεμάτο, μπορείτε να μπείτε στη λίστα αναμονής για να ειδοποιηθείτε όταν ελευθερωθεί θέση.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitingEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-none">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 text-yellow-600 rounded-none">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">{entry.booking_sections?.name || 'Γυμναστήριο'}</h4>
                    <p className="text-sm text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {format(new Date(entry.booking_date), 'dd/MM/yyyy')} στις {entry.booking_time}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="rounded-none text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Θέση #{entry.position}
                      </Badge>
                      <Badge variant="secondary" className="rounded-none text-xs">
                        {entry.status === 'waiting' ? 'Σε αναμονή' : 
                         entry.status === 'notified' ? 'Ειδοποιημένος' : entry.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Εγγραφή: {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLeaveWaitingList(entry)}
                  className="rounded-none border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Αφαίρεση
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
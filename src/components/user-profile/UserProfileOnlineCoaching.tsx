import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Lock, ExternalLink, Play, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfileOnlineCoachingProps {
  userProfile: any;
}

interface UserAvailability {
  type: string;
  has_videocall?: boolean;
  videocall_subscription?: string;
  single_videocall_sessions?: number;
}

export const UserProfileOnlineCoaching: React.FC<UserProfileOnlineCoachingProps> = ({ 
  userProfile 
}) => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<UserAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [roomName, setRoomName] = useState('');

  useEffect(() => {
    if (userProfile?.id) {
      fetchAvailability();
    }
  }, [userProfile]);

  const fetchAvailability = async () => {
    if (!userProfile?.id) return;

    try {
      const { data } = await supabase.rpc('get_user_available_bookings', {
        user_uuid: userProfile.id
      });

      setAvailability(data as unknown as UserAvailability);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = () => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank');
    }
  };

  const handleStartInstantMeeting = () => {
    const room = roomName || `coaching-${Date.now()}`;
    const jitsiUrl = `https://meet.jit.si/${room}`;
    window.open(jitsiUrl, '_blank');
    toast.success('Άνοιξε νέο παράθυρο για το meeting');
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  if (!availability?.has_videocall) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Online Coaching</h2>
          <p className="text-gray-600">Χρειάζεσαι συνδρομή Videocall Coaching για πρόσβαση</p>
        </div>

        <Card className="rounded-none border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-amber-800">Περιορισμένη Πρόσβαση</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-4">
              Για να έχεις πρόσβαση στο Online Coaching, χρειάζεσαι ενεργή συνδρομή "Videocall Coaching".
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-amber-700">
                <Video className="w-4 h-4" />
                <span className="text-sm">Απεριόριστες videocall συνεδρίες</span>
              </div>
              <div className="flex items-center space-x-2 text-amber-700">
                <Users className="w-4 h-4" />
                <span className="text-sm">Προσωπική καθοδήγηση από προπονητή</span>
              </div>
              <div className="flex items-center space-x-2 text-amber-700">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Προγραμματισμός συνεδριών</span>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/dashboard/user-profile/shop'}
              className="w-full mt-4 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              Αγόρασε Videocall Coaching - €29.99/μήνα
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Online Coaching</h2>
        <p className="text-gray-600">Συνδέσου με τον προπονητή σου μέσω βιντεοκλήσης</p>
        <Badge variant="outline" className="mt-2 rounded-none bg-green-50 text-green-700 border-green-200">
          {availability.videocall_subscription 
            ? availability.videocall_subscription 
            : availability.single_videocall_sessions 
              ? `${availability.single_videocall_sessions} videocall sessions διαθέσιμες`
              : 'Videocall διαθέσιμο'
          }
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instant Meeting */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="w-5 h-5 text-[#00ffba]" />
              <span>Άμεση Συνεδρία</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Ξεκίνησε μια άμεση συνεδρία online coaching
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Όνομα Αίθουσας (προαιρετικό)
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="π.χ. coaching-session"
                className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-[#00ffba]"
              />
            </div>

            <Button 
              onClick={handleStartInstantMeeting}
              className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Video className="w-4 h-4 mr-2" />
              Ξεκίνα Άμεσα
            </Button>
          </CardContent>
        </Card>

        {/* Join Meeting */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              <span>Συμμετοχή σε Meeting</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Εισήγαγε το link του meeting για συμμετοχή
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Meeting URL
              </label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://meet.jit.si/room-name"
                className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-[#00ffba]"
              />
            </div>

            <Button 
              onClick={handleJoinMeeting}
              disabled={!meetingUrl}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-none disabled:bg-gray-300"
            >
              <Video className="w-4 h-4 mr-2" />
              Συμμετοχή στο Meeting
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Οδηγίες Χρήσης</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-gray-600">
            <p>• Χρησιμοποιούμε την πλατφόρμα Jitsi Meet για τις βιντεοκλήσεις</p>
            <p>• Δεν χρειάζεται εγκατάσταση - λειτουργεί απευθείας από τον browser</p>
            <p>• Για καλύτερη ποιότητα, χρησιμοποίησε Chrome ή Firefox</p>
            <p>• Βεβαιώσου ότι έχεις ενεργοποιήσει την κάμερα και το μικρόφωνο</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
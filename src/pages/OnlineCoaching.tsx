import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Clock, Users, ExternalLink } from "lucide-react";

const OnlineCoaching = () => {
  const [meetingUrl, setMeetingUrl] = useState('');
  const [roomName, setRoomName] = useState('');

  useEffect(() => {
    // Generate a unique room name based on timestamp
    const timestamp = Date.now();
    const generatedRoomName = `coaching-session-${timestamp}`;
    setRoomName(generatedRoomName);
    setMeetingUrl(`https://meet.jit.si/${generatedRoomName}`);
  }, []);

  const startMeeting = () => {
    window.open(meetingUrl, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetingUrl);
  };

  const scheduledSessions = [
    {
      id: 1,
      client: "Γιάννης Παπαδόπουλος",
      date: "2024-07-25",
      time: "10:00",
      duration: "60 min",
      status: "Επιβεβαιωμένο"
    },
    {
      id: 2,
      client: "Μαρία Κωνσταντίνου",
      date: "2024-07-25",
      time: "14:30",
      duration: "45 min",
      status: "Εκκρεμεί"
    },
    {
      id: 3,
      client: "Νίκος Δημητρίου",
      date: "2024-07-26",
      time: "09:00",
      duration: "60 min",
      status: "Επιβεβαιωμένο"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Online Coaching</h1>
          <p className="text-lg text-gray-600">
            Συνδέσου με τους πελάτες σου μέσω βιντεοκλήσης για προσωπική καθοδήγηση
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Instant Meeting */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-[#00ffba]" />
                Άμεση Βιντεοκλήση
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Ξεκίνησε μια άμεση συνεδρία online coaching
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Σύνδεσμος Συνεδρίας:
                </label>
                <div className="flex gap-2">
                  <Input 
                    value={meetingUrl}
                    readOnly
                    className="rounded-none"
                  />
                  <Button 
                    onClick={copyToClipboard}
                    variant="outline"
                    className="rounded-none"
                  >
                    Αντιγραφή
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={startMeeting}
                  className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Ξεκίνα Συνεδρία
                </Button>
                <Button 
                  onClick={startMeeting}
                  variant="outline"
                  className="rounded-none"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Η συνεδρία θα ανοίξει σε νέο tab</p>
                <p>• Μπορείς να μοιραστείς τον σύνδεσμο με τον πελάτη σου</p>
                <p>• Δεν χρειάζεται εγγραφή για τους συμμετέχοντες</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#00ffba]" />
                Γρήγορες Ενέργειες
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start rounded-none"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Προγραμμάτισε Συνεδρία
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start rounded-none"
              >
                <Users className="w-4 h-4 mr-2" />
                Διαχείριση Πελατών
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start rounded-none"
              >
                <Clock className="w-4 h-4 mr-2" />
                Ιστορικό Συνεδριών
              </Button>

              <div className="mt-6 p-4 bg-[#00ffba]/10 border border-[#00ffba]/20 rounded-none">
                <h4 className="font-medium text-gray-900 mb-2">Συμβουλές για Καλύτερες Συνεδρίες:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ελέγξτε τη σύνδεσή σας πριν ξεκινήσετε</li>
                  <li>• Φροντίστε για καλό φωτισμό</li>
                  <li>• Χρησιμοποιήστε ακουστικά για καλύτερο ήχο</li>
                  <li>• Προετοιμάστε τα υλικά σας εκ των προτέρων</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Sessions */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#00ffba]" />
              Προγραμματισμένες Συνεδρίες
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Πελάτης</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ημερομηνία</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ώρα</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Διάρκεια</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Κατάσταση</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledSessions.map((session) => (
                    <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{session.client}</td>
                      <td className="py-3 px-4">{session.date}</td>
                      <td className="py-3 px-4">{session.time}</td>
                      <td className="py-3 px-4">{session.duration}</td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={session.status === 'Επιβεβαιωμένο' ? 'default' : 'secondary'}
                          className="rounded-none"
                        >
                          {session.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          size="sm" 
                          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                        >
                          <Video className="w-3 h-3 mr-1" />
                          Συμμετοχή
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnlineCoaching;
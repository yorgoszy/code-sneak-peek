import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users } from "lucide-react";
import { toast } from "sonner";

export const MeetingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<string[]>(['Εσύ']);

  useEffect(() => {
    // Simulate connection
    const timer = setTimeout(() => {
      setIsConnected(true);
      toast.success('Συνδέθηκες στη κλήση');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    toast.info(isVideoOn ? 'Κάμερα απενεργοποιήθηκε' : 'Κάμερα ενεργοποιήθηκε');
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    toast.info(isAudioOn ? 'Μικρόφωνο απενεργοποιήθηκε' : 'Μικρόφωνο ενεργοποιήθηκε');
  };

  const leaveMeeting = () => {
    toast.info('Έφυγες από τη κλήση');
    window.close();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="w-6 h-6 text-[#00ffba]" />
            <h1 className="text-white font-semibold">Meeting Room: {roomId}</h1>
            {isConnected && (
              <Badge className="bg-green-500 hover:bg-green-600 rounded-none">
                Συνδεδεμένος
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-sm">{participants.length}</span>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl bg-gray-800 border-gray-700 rounded-none">
          <CardHeader>
            <CardTitle className="text-white text-center">
              {isConnected ? 'Videocall Session' : 'Συνδέεσαι...'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-video bg-gray-900 relative flex items-center justify-center">
              {isVideoOn ? (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Video className="w-16 h-16 mx-auto mb-4 text-[#00ffba]" />
                    <p className="text-lg">Η κάμερά σου είναι ενεργή</p>
                    <p className="text-sm text-gray-400">Περιμένοντας για άλλους συμμετέχοντες...</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-white">
                    <VideoOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg">Η κάμερα είναι απενεργοποιημένη</p>
                  </div>
                </div>
              )}
              
              {/* Audio indicator */}
              <div className="absolute bottom-4 left-4">
                {isAudioOn ? (
                  <div className="bg-green-500 p-2 rounded-full">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="bg-red-500 p-2 rounded-full">
                    <MicOff className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center gap-4">
          <Button
            onClick={toggleVideo}
            variant={isVideoOn ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
          
          <Button
            onClick={toggleAudio}
            variant={isAudioOn ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          
          <Button
            onClick={leaveMeeting}
            variant="destructive"
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            Μοιράσου αυτό το link: {window.location.href}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
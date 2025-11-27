import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { Clock, Users } from 'lucide-react';

export const SprintTimingMaster = () => {
  const [distance, setDistance] = useState<string>('');
  const [sessionCode, setSessionCode] = useState<string>();
  const { session, currentResult, createSession, isLoading } = useSprintTiming(sessionCode);

  // Update session code when session is created
  if (session && !sessionCode) {
    setSessionCode(session.session_code);
  }

  const handleCreateSession = async () => {
    const distanceMeters = distance ? parseFloat(distance) : undefined;
    await createSession(distanceMeters);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-md mx-auto rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Sprint Timer - Master Device
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Απόσταση (μέτρα) - Προαιρετικό</Label>
              <Input
                type="number"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="π.χ. 100"
                className="rounded-none"
              />
            </div>
            <Button
              onClick={handleCreateSession}
              disabled={isLoading}
              className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              Δημιουργία Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const qrUrl = `${window.location.origin}/sprint-timing/join/${session.session_code}`;

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-2xl mx-auto rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Session Active
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Session Code</p>
              <p className="text-4xl font-bold text-[#00ffba]">{session.session_code}</p>
            </div>

            {session.distance_meters && (
              <div>
                <p className="text-sm text-muted-foreground">Απόσταση</p>
                <p className="text-2xl font-bold">{session.distance_meters}m</p>
              </div>
            )}

            <div className="p-6 bg-white rounded-none inline-block">
              <QRCodeSVG value={qrUrl} size={256} level="H" />
            </div>

            <p className="text-sm text-muted-foreground">
              Σκανάρετε το QR code για να συνδεθείτε
            </p>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm font-medium mb-2">Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                session.status === 'active' ? 'bg-[#00ffba]' : 
                session.status === 'completed' ? 'bg-blue-500' : 
                'bg-yellow-500'
              }`} />
              <span className="capitalize">{session.status}</span>
            </div>
          </div>

          {currentResult?.duration_ms && (
            <div className="bg-muted p-4 rounded-none">
              <p className="text-sm text-muted-foreground mb-1">Τελευταίος Χρόνος</p>
              <p className="text-3xl font-bold text-[#00ffba]">
                {(currentResult.duration_ms / 1000).toFixed(3)}s
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

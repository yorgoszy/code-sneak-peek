import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { Clock, Users, Plus, X } from 'lucide-react';

export const SprintTimingMaster = () => {
  const [distances, setDistances] = useState<number[]>([10, 20, 30]);
  const [newDistance, setNewDistance] = useState<string>('');
  const [sessionCode, setSessionCode] = useState<string>();
  const { session, currentResult, createSession, isLoading } = useSprintTiming(sessionCode);

  // Update session code when session is created
  if (session && !sessionCode) {
    setSessionCode(session.session_code);
  }

  const handleAddDistance = () => {
    const dist = parseFloat(newDistance);
    if (dist && dist > 0 && !distances.includes(dist)) {
      setDistances([...distances, dist].sort((a, b) => a - b));
      setNewDistance('');
    }
  };

  const handleRemoveDistance = (dist: number) => {
    setDistances(distances.filter(d => d !== dist));
  };

  const handleCreateSession = async () => {
    await createSession(distances);
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
              <Label>Αποστάσεις προς μέτρηση (μέτρα)</Label>
              <div className="flex gap-2 flex-wrap mt-2 mb-3">
                {distances.map(dist => (
                  <Badge key={dist} variant="secondary" className="rounded-none">
                    {dist}m
                    <X 
                      className="w-3 h-3 ml-2 cursor-pointer" 
                      onClick={() => handleRemoveDistance(dist)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="1"
                  value={newDistance}
                  onChange={(e) => setNewDistance(e.target.value)}
                  placeholder="Προσθήκη απόστασης..."
                  className="rounded-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDistance()}
                />
                <Button
                  onClick={handleAddDistance}
                  size="icon"
                  variant="outline"
                  className="rounded-none"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleCreateSession}
              disabled={isLoading || distances.length === 0}
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

            {session.distances && session.distances.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Αποστάσεις</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {session.distances.map(dist => (
                    <Badge key={dist} variant="outline" className="rounded-none text-lg">
                      {dist}m
                    </Badge>
                  ))}
                </div>
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
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">Τελευταίος Χρόνος</p>
                {currentResult.distance_meters && (
                  <Badge variant="secondary" className="rounded-none">
                    {currentResult.distance_meters}m
                  </Badge>
                )}
              </div>
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

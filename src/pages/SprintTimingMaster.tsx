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
  const [numStartDevices, setNumStartDevices] = useState<number>(1);
  const [numStopDevices, setNumStopDevices] = useState<number>(1);
  const [numDistanceDevices, setNumDistanceDevices] = useState<number>(1);
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
        <Card className="max-w-2xl mx-auto rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Sprint Timer - Ρύθμιση Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Αποστάσεις */}
            <div>
              <Label className="text-base font-semibold">Αποστάσεις προς μέτρηση</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Ορίστε τις αποστάσεις που θα μετρηθούν (π.χ. 10m, 20m, 30m)
              </p>
              <div className="flex gap-2 flex-wrap mb-3">
                {distances.map(dist => (
                  <Badge key={dist} variant="secondary" className="rounded-none text-base py-1 px-3">
                    {dist}m
                    <X 
                      className="w-4 h-4 ml-2 cursor-pointer" 
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

            {/* Αριθμός Συσκευών */}
            <div className="space-y-4 border-t pt-4">
              <Label className="text-base font-semibold">Αριθμός Συσκευών</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Ορίστε πόσες συσκευές κάθε τύπου θα συνδεθούν
              </p>

              <div className="grid gap-4">
                {/* START Devices */}
                <div className="flex items-center justify-between p-3 bg-[#00ffba]/10 rounded-none border border-[#00ffba]/20">
                  <div>
                    <Label className="text-sm font-medium">START Devices</Label>
                    <p className="text-xs text-muted-foreground">Συσκευές γραμμής εκκίνησης</p>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={numStartDevices}
                    onChange={(e) => setNumStartDevices(parseInt(e.target.value) || 1)}
                    className="w-20 rounded-none text-center"
                  />
                </div>

                {/* DISTANCE Devices */}
                <div className="flex items-center justify-between p-3 bg-[#cb8954]/10 rounded-none border border-[#cb8954]/20">
                  <div>
                    <Label className="text-sm font-medium">DISTANCE Devices</Label>
                    <p className="text-xs text-muted-foreground">Συσκευές ενδιάμεσων αποστάσεων</p>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={numDistanceDevices}
                    onChange={(e) => setNumDistanceDevices(parseInt(e.target.value) || 1)}
                    className="w-20 rounded-none text-center"
                  />
                </div>

                {/* STOP Devices */}
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-none border border-red-500/20">
                  <div>
                    <Label className="text-sm font-medium">STOP Devices</Label>
                    <p className="text-xs text-muted-foreground">Συσκευές γραμμής τερματισμού</p>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={numStopDevices}
                    onChange={(e) => setNumStopDevices(parseInt(e.target.value) || 1)}
                    className="w-20 rounded-none text-center"
                  />
                </div>
              </div>
            </div>

            {/* Σύνολο Συσκευών */}
            <div className="bg-muted p-4 rounded-none">
              <div className="flex items-center justify-between">
                <span className="font-medium">Σύνολο Συσκευών:</span>
                <Badge className="rounded-none text-lg">
                  {numStartDevices + numDistanceDevices + numStopDevices} συσκευές
                </Badge>
              </div>
            </div>

            <Button
              onClick={handleCreateSession}
              disabled={isLoading || distances.length === 0}
              className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black font-semibold text-base h-12"
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

          {/* Αριθμός Συσκευών */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Αναμενόμενες Συσκευές</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#00ffba]/10 p-3 rounded-none border border-[#00ffba]/20 text-center">
                <div className="text-2xl font-bold text-[#00ffba]">{numStartDevices}</div>
                <div className="text-xs text-muted-foreground">START</div>
              </div>
              <div className="bg-[#cb8954]/10 p-3 rounded-none border border-[#cb8954]/20 text-center">
                <div className="text-2xl font-bold text-[#cb8954]">{numDistanceDevices}</div>
                <div className="text-xs text-muted-foreground">DISTANCE</div>
              </div>
              <div className="bg-red-500/10 p-3 rounded-none border border-red-500/20 text-center">
                <div className="text-2xl font-bold text-red-500">{numStopDevices}</div>
                <div className="text-xs text-muted-foreground">STOP</div>
              </div>
            </div>
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

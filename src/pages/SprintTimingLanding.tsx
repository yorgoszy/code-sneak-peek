import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timer, QrCode, Play, Square, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SprintTimingLanding = () => {
  const [sessionCode, setSessionCode] = useState('');
  const navigate = useNavigate();

  const handleCreateSession = () => {
    navigate('/sprint-timing/master');
  };

  const handleJoinSession = () => {
    if (sessionCode.trim()) {
      navigate(`/sprint-timing/join/${sessionCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Timer className="w-6 h-6 text-[#00ffba]" />
              Sprint Timing System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="rounded-none">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Σύστημα χρονομέτρησης sprint με motion detection. Χρησιμοποιήστε 2-4 συσκευές που επικοινωνούν μεταξύ τους για αυτόματη μέτρηση χρόνου.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="rounded-none border-2 hover:border-[#00ffba] transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Δημιουργία Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ξεκινήστε ένα νέο session και λάβετε QR code για τις άλλες συσκευές
                  </p>
                  <Button
                    onClick={handleCreateSession}
                    className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Δημιουργία Νέου Session
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-none border-2 hover:border-[#00ffba] transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Σύνδεση σε Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sessionCode">Session Code</Label>
                    <Input
                      id="sessionCode"
                      value={sessionCode}
                      onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                      placeholder="π.χ. ABC123"
                      className="rounded-none"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleJoinSession}
                    disabled={!sessionCode.trim()}
                    className="w-full rounded-none"
                  >
                    Σύνδεση
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Πώς λειτουργεί;</h3>
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00ffba] text-black flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Δημιουργία Session</p>
                    <p className="text-sm text-muted-foreground">
                      Η master συσκευή δημιουργεί ένα session και εμφανίζει QR code
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00ffba] text-black flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Σύνδεση Συσκευών</p>
                    <p className="text-sm text-muted-foreground">
                      Άλλες συσκευές σκανάρουν το QR ή εισάγουν τον κωδικό και επιλέγουν ρόλο (START/STOP)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00ffba] text-black flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Motion Detection</p>
                    <p className="text-sm text-muted-foreground">
                      Οι συσκευές START/STOP ανιχνεύουν κίνηση μέσω κάμερας και ξεκινούν/σταματούν αυτόματα το χρονόμετρο
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00ffba] text-black flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Αποτελέσματα</p>
                    <p className="text-sm text-muted-foreground">
                      Όλες οι συσκευές βλέπουν τα αποτελέσματα σε πραγματικό χρόνο
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Ρόλοι Συσκευών</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="rounded-none bg-blue-500/10 border-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="w-5 h-5 text-blue-500" />
                      <p className="font-medium">Master</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Δημιουργεί το session και εμφανίζει τα αποτελέσματα
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-none bg-[#00ffba]/10 border-[#00ffba]">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Play className="w-5 h-5 text-[#00ffba]" />
                      <p className="font-medium">START</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ανιχνεύει την έναρξη του sprint
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-none bg-red-500/10 border-red-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Square className="w-5 h-5 text-red-500" />
                      <p className="font-medium">STOP</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ανιχνεύει τον τερματισμό του sprint
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

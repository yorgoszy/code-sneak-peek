import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timer, QrCode, Play, Square, Info, Menu } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sidebar } from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export const SprintTimingLanding = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleCreateSession = () => {
    navigate('/sprint-timing/master');
  };

  const handleJoinSession = () => {
    if (sessionCode.trim()) {
      navigate(`/sprint-timing/join/${sessionCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="absolute left-0 top-0 h-full bg-white shadow-xl">
            <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        {isMobile && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-2 lg:hidden flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-none"
              onClick={() => setShowMobileSidebar(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-base font-semibold">Sprint Timing</h1>
            <div className="w-9" />
          </div>
        )}

        <div className="p-2 md:p-4 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <Card className="rounded-none">
              <CardHeader className="p-3 md:p-4">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Timer className="w-5 h-5 md:w-6 md:h-6 text-[#00ffba]" />
                  Sprint Timing System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-3 md:p-4">
                <Alert className="rounded-none">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs md:text-sm">
                    Σύστημα χρονομέτρησης sprint με motion detection. Χρησιμοποιήστε 2-4 συσκευές που επικοινωνούν μεταξύ τους για αυτόματη μέτρηση χρόνου.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-3">
                  <Card className="rounded-none border-2 hover:border-[#00ffba] transition-colors">
                    <CardHeader className="p-3">
                      <CardTitle className="text-base md:text-lg">Δημιουργία Session</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-3">
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Ξεκινήστε ένα νέο session και λάβετε QR code για τις άλλες συσκευές
                      </p>
                      <Button
                        onClick={handleCreateSession}
                        className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-9 text-sm"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Δημιουργία Νέου Session
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="rounded-none border-2 hover:border-[#00ffba] transition-colors">
                    <CardHeader className="p-3">
                      <CardTitle className="text-base md:text-lg">Σύνδεση σε Session</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-3">
                      <div>
                        <Label htmlFor="sessionCode" className="text-xs md:text-sm">Session Code</Label>
                        <Input
                          id="sessionCode"
                          value={sessionCode}
                          onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                          placeholder="π.χ. ABC123"
                          className="rounded-none h-9 text-sm"
                          maxLength={6}
                        />
                      </div>
                      <Button
                        onClick={handleJoinSession}
                        disabled={!sessionCode.trim()}
                        className="w-full rounded-none h-9 text-sm"
                      >
                        Σύνδεση
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-base md:text-lg font-semibold mb-3">Πώς λειτουργεί;</h3>
                  <div className="grid gap-3">
                    <div className="flex gap-2">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00ffba] text-black flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-sm">Δημιουργία Session</p>
                        <p className="text-xs text-muted-foreground">
                          Η master συσκευή δημιουργεί ένα session και εμφανίζει QR code
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00ffba] text-black flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-sm">Σύνδεση Συσκευών</p>
                        <p className="text-xs text-muted-foreground">
                          Άλλες συσκευές σκανάρουν το QR ή εισάγουν τον κωδικό και επιλέγουν ρόλο (START/STOP)
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00ffba] text-black flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-sm">Motion Detection</p>
                        <p className="text-xs text-muted-foreground">
                          Οι συσκευές START/STOP ανιχνεύουν κίνηση μέσω κάμερας και ξεκινούν/σταματούν αυτόματα το χρονόμετρο
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00ffba] text-black flex items-center justify-center font-bold text-sm">
                        4
                      </div>
                      <div>
                        <p className="font-medium text-sm">Αποτελέσματα</p>
                        <p className="text-xs text-muted-foreground">
                          Όλες οι συσκευές βλέπουν τα αποτελέσματα σε πραγματικό χρόνο
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-base md:text-lg font-semibold mb-3">Ρόλοι Συσκευών</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    <Card className="rounded-none bg-blue-500/10 border-blue-500">
                      <CardContent className="pt-4 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <QrCode className="w-4 h-4 text-blue-500" />
                          <p className="font-medium text-sm">Master</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Δημιουργεί το session και εμφανίζει τα αποτελέσματα
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-none bg-[#00ffba]/10 border-[#00ffba]">
                      <CardContent className="pt-4 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Play className="w-4 h-4 text-[#00ffba]" />
                          <p className="font-medium text-sm">START</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ανιχνεύει την έναρξη του sprint
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-none bg-red-500/10 border-red-500">
                      <CardContent className="pt-4 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Square className="w-4 h-4 text-red-500" />
                          <p className="font-medium text-sm">STOP</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
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
      </div>
    </div>
  );
};

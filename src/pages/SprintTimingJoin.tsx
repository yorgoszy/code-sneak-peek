import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Square, Monitor } from 'lucide-react';

export const SprintTimingJoin = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const [selectedDevice, setSelectedDevice] = useState<'start' | 'stop' | 'master' | null>(null);

  useEffect(() => {
    if (selectedDevice && sessionCode) {
      if (selectedDevice === 'master') {
        navigate(`/sprint-timing/master/${sessionCode}`);
      } else {
        navigate(`/sprint-timing/${selectedDevice}/${sessionCode}`);
      }
    }
  }, [selectedDevice, sessionCode, navigate]);

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-md w-full rounded-none">
        <CardHeader>
          <CardTitle className="text-center">
            Joining Session: {sessionCode}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Επιλέξτε τον ρόλο αυτής της συσκευής
          </p>

          <Button
            onClick={() => setSelectedDevice('master')}
            className="w-full rounded-none h-20 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Monitor className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-bold">Master Device</div>
              <div className="text-xs opacity-90">Εμφάνιση αποτελεσμάτων</div>
            </div>
          </Button>

          <Button
            onClick={() => setSelectedDevice('start')}
            className="w-full rounded-none h-20 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            <Play className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-bold">START Device</div>
              <div className="text-xs opacity-90">Ανίχνευση έναρξης</div>
            </div>
          </Button>

          <Button
            onClick={() => setSelectedDevice('stop')}
            className="w-full rounded-none h-20 bg-red-500 hover:bg-red-600 text-white"
          >
            <Square className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-bold">STOP Device</div>
              <div className="text-xs opacity-90">Ανίχνευση τερματισμού</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

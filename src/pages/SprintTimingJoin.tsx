import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Monitor, Loader2, MapPin } from 'lucide-react';
import { useSprintTiming } from '@/hooks/useSprintTiming';

export const SprintTimingJoin = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const { session, joinSession, isLoading } = useSprintTiming(sessionCode);
  const [selectedRole, setSelectedRole] = useState<'start' | 'distance' | 'stop' | 'master' | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);

  // Join session on mount
  useEffect(() => {
    if (sessionCode) {
      joinSession(sessionCode);
    }
  }, [sessionCode]);

  // Navigate when both role and distance are selected (if needed)
  useEffect(() => {
    if (selectedRole && sessionCode) {
      if (selectedRole === 'master') {
        navigate(`/sprint-timing/master/${sessionCode}`);
      } else if (selectedRole === 'start' || selectedRole === 'stop') {
        // START και STOP δεν χρειάζονται απόσταση
        navigate(`/sprint-timing/${selectedRole}/${sessionCode}`);
      } else if (selectedRole === 'distance' && selectedDistance !== null) {
        // DISTANCE χρειάζεται απόσταση
        navigate(`/sprint-timing/distance/${sessionCode}?distance=${selectedDistance}`);
      }
    }
  }, [selectedRole, selectedDistance, sessionCode, navigate]);

  const handleRoleSelect = (role: 'start' | 'distance' | 'stop' | 'master') => {
    setSelectedRole(role);
    // If master, start, or stop, navigate immediately (no distance needed)
    if (role === 'master' || role === 'start' || role === 'stop') {
      return;
    }
    // If distance, wait for distance selection
  };

  const handleDistanceSelect = (distance: number) => {
    setSelectedDistance(distance);
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-md w-full rounded-none">
          <CardContent className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Φόρτωση session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If role not selected, show role selection
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-md w-full rounded-none">
          <CardHeader>
            <CardTitle className="text-center">
              Session: {sessionCode}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground mb-6">
              Επιλέξτε τον ρόλο αυτής της συσκευής
            </p>

            <Button
              onClick={() => handleRoleSelect('master')}
              className="w-full rounded-none h-20 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Monitor className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-bold">Master Device</div>
                <div className="text-xs opacity-90">Εμφάνιση αποτελεσμάτων</div>
              </div>
            </Button>

            <Button
              onClick={() => handleRoleSelect('start')}
              className="w-full rounded-none h-20 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              <Play className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-bold">START Device</div>
                <div className="text-xs opacity-90">Ανίχνευση έναρξης (γραμμή εκκίνησης)</div>
              </div>
            </Button>

            <Button
              onClick={() => handleRoleSelect('distance')}
              className="w-full rounded-none h-20 bg-[#cb8954] hover:bg-[#cb8954]/90 text-white"
            >
              <MapPin className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-bold">DISTANCE Device</div>
                <div className="text-xs opacity-90">Ενδιάμεσες αποστάσεις (10m, 20m, κτλ)</div>
              </div>
            </Button>

            <Button
              onClick={() => handleRoleSelect('stop')}
              className="w-full rounded-none h-20 bg-red-500 hover:bg-red-600 text-white"
            >
              <Square className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-bold">STOP Device</div>
                <div className="text-xs opacity-90">Τελική γραμμή (τερματισμός)</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If distance role selected but distance not selected, show distance selection
  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-md w-full rounded-none">
        <CardHeader>
          <CardTitle className="text-center">
            Επιλέξτε Απόσταση
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Για ποια απόσταση θα λειτουργεί αυτή η συσκευή DISTANCE?
          </p>

          <div className="grid grid-cols-2 gap-3">
            {session.distances?.map(distance => (
              <Button
                key={distance}
                onClick={() => handleDistanceSelect(distance)}
                className="h-20 rounded-none bg-muted hover:bg-muted/80 text-foreground"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold">{distance}</div>
                  <div className="text-xs">μέτρα</div>
                </div>
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setSelectedRole(null)}
            className="w-full rounded-none"
          >
            Επιστροφή
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

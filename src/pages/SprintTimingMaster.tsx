import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { Clock, Users, Plus, X, Trash2, Play, Square, MapPin, Timer as TimerIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Device {
  id: string;
  role: 'start' | 'stop' | 'distance' | 'timer';
  distance?: number;
}

export const SprintTimingMaster = () => {
  const [distances, setDistances] = useState<number[]>([10, 20, 30]);
  const [newDistance, setNewDistance] = useState<string>('');
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', role: 'start' },
    { id: '2', role: 'stop' },
    { id: '3', role: 'timer' }
  ]);
  const [newDeviceRole, setNewDeviceRole] = useState<'start' | 'stop' | 'distance' | 'timer'>('start');
  const [newDeviceDistance, setNewDeviceDistance] = useState<number | undefined>();
  const [customDistance, setCustomDistance] = useState<string>('');
  const [sessionCode, setSessionCode] = useState<string>();
  const [selectedDeviceForQR, setSelectedDeviceForQR] = useState<Device | null>(null);
  const [showSession, setShowSession] = useState(false);
  const { session, currentResult, createSession, isLoading } = useSprintTiming(sessionCode);

  // Update session code when session is created
  if (session && !sessionCode) {
    setSessionCode(session.session_code);
    setShowSession(true);
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

  const handleAddDevice = () => {
    const newDevice: Device = {
      id: Date.now().toString(),
      role: newDeviceRole,
      distance: newDeviceRole === 'distance' ? newDeviceDistance : undefined
    };
    setDevices([...devices, newDevice]);
    setNewDeviceDistance(undefined);
    setCustomDistance('');
  };

  const handleAddCustomDistance = () => {
    const dist = parseFloat(customDistance);
    if (dist && dist > 0 && !distances.includes(dist)) {
      setDistances([...distances, dist].sort((a, b) => a - b));
      setNewDeviceDistance(dist);
      setCustomDistance('');
    }
  };

  const handleRemoveDevice = (id: string) => {
    setDevices(devices.filter(d => d.id !== id));
  };

  const getDeviceIcon = (role: string) => {
    switch (role) {
      case 'start': return Play;
      case 'stop': return Square;
      case 'distance': return MapPin;
      case 'timer': return TimerIcon;
      default: return Clock;
    }
  };

  const getDeviceColor = (role: string) => {
    switch (role) {
      case 'start': return { bg: 'bg-[#00ffba]/10', border: 'border-[#00ffba]/20', text: 'text-[#00ffba]' };
      case 'stop': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500' };
      case 'distance': return { bg: 'bg-[#cb8954]/10', border: 'border-[#cb8954]/20', text: 'text-[#cb8954]' };
      case 'timer': return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500' };
      default: return { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-600' };
    }
  };

  const handleCreateSession = async () => {
    await createSession(distances);
  };

  const handleCloseSession = () => {
    setShowSession(false);
    setSessionCode(undefined);
    setDevices([
      { id: '1', role: 'start' },
      { id: '2', role: 'stop' },
      { id: '3', role: 'timer' }
    ]);
  };

  if (!session || !showSession) {
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

            {/* Συσκευές */}
            <div className="space-y-4 border-t pt-4">
              <Label className="text-base font-semibold">Συσκευές</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Ορίστε τις συσκευές και τους ρόλους τους
              </p>

              {/* Device Cards */}
              <div className="space-y-2">
                {devices.map((device) => {
                  const Icon = getDeviceIcon(device.role);
                  const colors = getDeviceColor(device.role);
                  
                  return (
                    <div 
                      key={device.id}
                      className={`flex items-center justify-between p-3 ${colors.bg} rounded-none border ${colors.border}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {device.role === 'start' && 'START Device'}
                            {device.role === 'stop' && 'STOP Device'}
                            {device.role === 'timer' && 'TIMER Device'}
                            {device.role === 'distance' && `DISTANCE Device - ${device.distance}m`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {device.role === 'start' && 'Γραμμή εκκίνησης'}
                            {device.role === 'stop' && 'Γραμμή τερματισμού'}
                            {device.role === 'timer' && 'Χρονόμετρο'}
                            {device.role === 'distance' && 'Ενδιάμεση απόσταση'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDevice(device.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Add Device Form */}
              <div className="border border-dashed border-gray-300 rounded-none p-4 space-y-3">
                <Label className="text-sm font-medium">Προσθήκη Συσκευής</Label>
                
                <div className="space-y-2">
                  <Select value={newDeviceRole} onValueChange={(value: any) => setNewDeviceRole(value)}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="start" className="rounded-none">START Device</SelectItem>
                      <SelectItem value="stop" className="rounded-none">STOP Device</SelectItem>
                      <SelectItem value="distance" className="rounded-none">DISTANCE Device</SelectItem>
                      <SelectItem value="timer" className="rounded-none">TIMER Device</SelectItem>
                    </SelectContent>
                  </Select>

                  {newDeviceRole === 'distance' && (
                    <div className="space-y-2">
                      <Select 
                        value={newDeviceDistance?.toString()} 
                        onValueChange={(value) => setNewDeviceDistance(parseInt(value))}
                      >
                        <SelectTrigger className="rounded-none">
                          <SelectValue placeholder="Επιλέξτε απόσταση" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {distances.map(dist => (
                            <SelectItem key={dist} value={dist.toString()} className="rounded-none">
                              {dist}m
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="1"
                          value={customDistance}
                          onChange={(e) => setCustomDistance(e.target.value)}
                          placeholder="Νέα απόσταση (π.χ. 40)"
                          className="rounded-none"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCustomDistance()}
                        />
                        <Button
                          onClick={handleAddCustomDistance}
                          size="icon"
                          variant="outline"
                          className="rounded-none"
                          type="button"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleAddDevice}
                    disabled={newDeviceRole === 'distance' && !newDeviceDistance}
                    className="w-full rounded-none"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Προσθήκη
                  </Button>
                </div>
              </div>

              {/* Total Devices */}
              <div className="bg-muted p-3 rounded-none">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Σύνολο Συσκευών:</span>
                  <Badge className="rounded-none">
                    {devices.length} συσκευές
                  </Badge>
                </div>
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

  const getDeviceQRUrl = (device: Device) => {
    const baseUrl = `${window.location.origin}/sprint-timing/join/${session.session_code}`;
    if (device.role === 'distance' && device.distance) {
      return `${baseUrl}?role=${device.role}&distance=${device.distance}`;
    }
    return `${baseUrl}?role=${device.role}`;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-2xl mx-auto rounded-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Session Active
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseSession}
              className="rounded-none"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
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

          {/* Συσκευές */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Συσκευές ({devices.length})</p>
            <div className="grid grid-cols-2 gap-2">
              {devices.map((device) => {
                const Icon = getDeviceIcon(device.role);
                const colors = getDeviceColor(device.role);
                
                return (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDeviceForQR(device)}
                    className={`${colors.bg} p-3 rounded-none border ${colors.border} text-center hover:opacity-80 transition-opacity cursor-pointer`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-1 ${colors.text}`} />
                    <div className="text-xs font-medium text-foreground uppercase">
                      {device.role}
                      {device.role === 'distance' && ` ${device.distance}m`}
                    </div>
                  </button>
                );
              })}
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

      {/* Device QR Code Dialog */}
      {selectedDeviceForQR && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDeviceForQR(null)}
        >
          <Card 
            className="max-w-md w-full rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 capitalize">
                  {(() => {
                    const Icon = getDeviceIcon(selectedDeviceForQR.role);
                    const colors = getDeviceColor(selectedDeviceForQR.role);
                    return <Icon className={`w-5 h-5 ${colors.text}`} />;
                  })()}
                  {selectedDeviceForQR.role === 'start' && 'START Device'}
                  {selectedDeviceForQR.role === 'stop' && 'STOP Device'}
                  {selectedDeviceForQR.role === 'timer' && 'TIMER Device'}
                  {selectedDeviceForQR.role === 'distance' && `DISTANCE ${selectedDeviceForQR.distance}m`}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedDeviceForQR(null)}
                  className="rounded-none"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Σκανάρετε το QR code για να συνδέσετε αυτή τη συσκευή
                </p>
                <div className="p-6 bg-white rounded-none inline-block">
                  <QRCodeSVG 
                    value={getDeviceQRUrl(selectedDeviceForQR)} 
                    size={200} 
                    level="H" 
                  />
                </div>
                <div className="mt-4 p-3 bg-muted rounded-none">
                  <p className="text-xs text-muted-foreground">Session Code</p>
                  <p className="text-lg font-bold text-[#00ffba]">{session.session_code}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

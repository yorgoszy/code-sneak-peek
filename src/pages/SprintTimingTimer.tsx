import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSprintTiming } from '@/hooks/useSprintTiming';
import { Clock, Timer as TimerIcon } from 'lucide-react';

export const SprintTimingTimer = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const { session, currentResult, joinSession } = useSprintTiming(sessionCode);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (sessionCode) {
      joinSession(sessionCode);
    }
  }, [sessionCode, joinSession]);

  // Monitor currentResult for timing
  useEffect(() => {
    if (!currentResult) {
      setIsRunning(false);
      setElapsedTime(0);
      return;
    }

    // If result has duration (completed), show final time
    if (currentResult.duration_ms) {
      setElapsedTime(currentResult.duration_ms);
      setIsRunning(false);
      return;
    }

    // If result has start_time but no end_time, start counting
    if (currentResult.start_time && !currentResult.end_time) {
      setIsRunning(true);
      const startTime = new Date(currentResult.start_time).getTime();
      
      const interval = setInterval(() => {
        const now = Date.now();
        setElapsedTime(now - startTime);
      }, 10); // Update every 10ms for smooth display

      return () => clearInterval(interval);
    }
  }, [currentResult]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="rounded-none">
          <CardContent className="p-6">
            <p>Loading session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-2xl w-full rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <TimerIcon className="w-5 h-5 text-blue-500" />
            TIMER Device - {session.session_code}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Badge */}
          <div className="text-center">
            <Badge 
              className="rounded-none text-lg px-4 py-2"
              variant={isRunning ? "default" : "secondary"}
            >
              {isRunning ? 'Running' : currentResult?.duration_ms ? 'Completed' : 'Waiting'}
            </Badge>
          </div>

          {/* Timer Display */}
          <div className="bg-black/90 p-12 rounded-none">
            <div className="text-center">
              <div className={`font-mono text-8xl font-bold ${
                isRunning ? 'text-[#00ffba]' : currentResult?.duration_ms ? 'text-blue-500' : 'text-gray-500'
              }`}>
                {formatTime(elapsedTime)}
              </div>
              <div className="text-gray-400 text-sm mt-4">
                {isRunning ? 'Χρονομέτρηση σε εξέλιξη...' : 
                 currentResult?.duration_ms ? 'Ολοκληρώθηκε!' : 
                 'Αναμονή για έναρξη...'}
              </div>
            </div>
          </div>

          {/* Distance Info */}
          {currentResult?.distance_meters && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Απόσταση</p>
              <Badge variant="outline" className="rounded-none text-2xl py-2 px-4 mt-2">
                {currentResult.distance_meters}m
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

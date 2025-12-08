
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Check } from 'lucide-react';

interface InteractiveBlockInfoProps {
  blockId: string;
  workoutFormat?: string;
  workoutDuration?: string;
  blockSets?: number;
  workoutInProgress: boolean;
}

// Parse duration string to seconds (e.g., "5:00" -> 300, "90" -> 90)
const parseDurationToSeconds = (duration: string): number => {
  if (!duration) return 0;
  
  // Remove any whitespace
  const cleaned = duration.trim();
  
  // Check if it's in MM:SS format
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  
  // Check if it ends with 'm' or 'min' for minutes
  if (cleaned.toLowerCase().endsWith('min')) {
    return parseInt(cleaned) * 60;
  }
  if (cleaned.toLowerCase().endsWith('m')) {
    return parseInt(cleaned) * 60;
  }
  
  // Check if it ends with 's' or 'sec' for seconds
  if (cleaned.toLowerCase().endsWith('sec') || cleaned.toLowerCase().endsWith('s')) {
    return parseInt(cleaned);
  }
  
  // Default: assume it's seconds if just a number
  const num = parseInt(cleaned);
  if (!isNaN(num)) {
    // If number is small (< 10), assume minutes
    if (num < 10) return num * 60;
    return num;
  }
  
  return 0;
};

// Format seconds to MM:SS display
const formatSecondsToDisplay = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Boxing ring bell sound using Web Audio API
const playBoxingBell = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for bell sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Bell-like frequency
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
    
    // Envelope for bell ring
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
    
    // Second ring (boxing bell rings twice)
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.setValueAtTime(800, audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
      
      gain2.gain.setValueAtTime(0.8, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      osc2.type = 'sine';
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 1);
    }, 200);
  } catch (e) {
    console.log('Could not play bell sound:', e);
  }
};

export const InteractiveBlockInfo: React.FC<InteractiveBlockInfoProps> = ({
  blockId,
  workoutFormat,
  workoutDuration,
  blockSets = 1,
  workoutInProgress
}) => {
  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [initialSeconds, setInitialSeconds] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sets counter state
  const [completedSets, setCompletedSets] = useState(0);

  // Initialize timer seconds from duration
  useEffect(() => {
    if (workoutDuration) {
      const seconds = parseDurationToSeconds(workoutDuration);
      setInitialSeconds(seconds);
      setRemainingSeconds(seconds);
    }
  }, [workoutDuration]);

  // Reset states when workout ends
  useEffect(() => {
    if (!workoutInProgress) {
      setTimerActive(false);
      setCompletedSets(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (workoutDuration) {
        const seconds = parseDurationToSeconds(workoutDuration);
        setRemainingSeconds(seconds);
      }
    }
  }, [workoutInProgress, workoutDuration]);

  // Timer countdown logic
  useEffect(() => {
    if (timerActive && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            // Timer finished
            setTimerActive(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            playBoxingBell();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerActive, remainingSeconds]);

  // Handle format/timer click
  const handleTimerClick = useCallback(() => {
    if (!workoutInProgress) return;
    
    if (timerActive) {
      // Pause
      setTimerActive(false);
    } else {
      // Start/Resume
      if (remainingSeconds === 0 && initialSeconds > 0) {
        // Reset if finished
        setRemainingSeconds(initialSeconds);
      }
      setTimerActive(true);
    }
  }, [workoutInProgress, timerActive, remainingSeconds, initialSeconds]);

  // Handle double click - reset timer
  const handleTimerDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!workoutInProgress) return;
    
    setRemainingSeconds(initialSeconds);
    setTimerActive(true);
  }, [workoutInProgress, initialSeconds]);

  // Handle set click - complete one set
  const handleSetClick = useCallback(() => {
    if (!workoutInProgress) return;
    
    if (completedSets < blockSets) {
      setCompletedSets(prev => prev + 1);
    }
  }, [workoutInProgress, completedSets, blockSets]);

  const isSetComplete = completedSets >= blockSets;
  const hasFormat = workoutFormat || workoutDuration;
  const hasSets = blockSets > 1;

  if (!hasFormat && !hasSets) return null;

  return (
    <div className="mb-2 flex items-center gap-2">
      {hasFormat && (
        <div 
          className={`inline-flex items-center gap-2 text-xs border px-2 py-1 transition-all ${
            workoutInProgress 
              ? 'cursor-pointer hover:bg-[#cb8954]/10 active:scale-95' 
              : ''
          } ${
            timerActive 
              ? 'border-[#00ffba] bg-[#00ffba]/10' 
              : remainingSeconds === 0 && initialSeconds > 0
                ? 'border-[#00ffba] bg-[#00ffba]/20'
                : 'border-[#cb8954]'
          }`}
          onClick={handleTimerClick}
          onDoubleClick={handleTimerDoubleClick}
          title={workoutInProgress ? 'Click: Start/Pause | Double-click: Reset' : ''}
        >
          {workoutFormat && (
            <span className={timerActive ? 'text-[#00ffba]' : 'text-[#cb8954]'}>
              {workoutFormat}
            </span>
          )}
          {workoutFormat && workoutDuration && (
            <span className={timerActive ? 'text-[#00ffba]' : 'text-[#cb8954]'}>-</span>
          )}
          {workoutDuration && (
            <span className={`font-mono ${
              timerActive 
                ? 'text-[#00ffba] animate-pulse' 
                : remainingSeconds === 0 && initialSeconds > 0
                  ? 'text-[#00ffba]'
                  : 'text-[#cb8954]'
            }`}>
              {workoutInProgress && initialSeconds > 0
                ? formatSecondsToDisplay(remainingSeconds)
                : workoutDuration
              }
            </span>
          )}
        </div>
      )}
      
      {hasSets && (
        <div 
          className={`inline-flex items-center text-xs border px-2 py-1 transition-all ${
            workoutInProgress 
              ? 'cursor-pointer hover:bg-[#cb8954]/10 active:scale-95' 
              : ''
          } ${
            isSetComplete 
              ? 'border-[#00ffba] bg-[#00ffba]/20' 
              : 'border-[#cb8954]'
          }`}
          onClick={handleSetClick}
          title={workoutInProgress ? `Click to complete set (${completedSets}/${blockSets})` : ''}
        >
          {isSetComplete ? (
            <Check className="w-4 h-4 text-[#00ffba]" />
          ) : (
            <span className="text-[#cb8954] font-semibold">
              {blockSets - completedSets}/{blockSets}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

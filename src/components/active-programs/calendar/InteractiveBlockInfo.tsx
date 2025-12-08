
import React, { useCallback, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useBlockTimer } from '@/contexts/BlockTimerContext';

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
  
  const cleaned = duration.trim();
  
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  
  if (cleaned.toLowerCase().endsWith('min')) {
    return parseInt(cleaned) * 60;
  }
  if (cleaned.toLowerCase().endsWith('m')) {
    return parseInt(cleaned) * 60;
  }
  
  if (cleaned.toLowerCase().endsWith('sec') || cleaned.toLowerCase().endsWith('s')) {
    return parseInt(cleaned);
  }
  
  const num = parseInt(cleaned);
  if (!isNaN(num)) {
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

export const InteractiveBlockInfo: React.FC<InteractiveBlockInfoProps> = ({
  blockId,
  workoutFormat,
  workoutDuration,
  blockSets = 1,
  workoutInProgress
}) => {
  const { getBlockState, setBlockTimer, setBlockSets, initializeBlock } = useBlockTimer();
  
  // Get persisted state from context
  const blockState = getBlockState(blockId);
  const timerActive = blockState?.timerActive || false;
  const remainingSeconds = blockState?.remainingSeconds ?? parseDurationToSeconds(workoutDuration || '');
  const initialSeconds = blockState?.initialSeconds ?? parseDurationToSeconds(workoutDuration || '');
  const completedSets = blockState?.completedSets || 0;

  // Initialize block state on mount
  useEffect(() => {
    if (workoutDuration) {
      const seconds = parseDurationToSeconds(workoutDuration);
      initializeBlock(blockId, seconds, blockSets);
    }
  }, [blockId, workoutDuration, blockSets, initializeBlock]);

  // Handle format/timer click
  const handleTimerClick = useCallback(() => {
    if (!workoutInProgress) return;
    
    if (timerActive) {
      // Pause
      setBlockTimer(blockId, remainingSeconds, initialSeconds, false);
    } else {
      // Start/Resume
      if (remainingSeconds === 0 && initialSeconds > 0) {
        // Reset if finished
        setBlockTimer(blockId, initialSeconds, initialSeconds, true);
      } else {
        setBlockTimer(blockId, remainingSeconds, initialSeconds, true);
      }
    }
  }, [workoutInProgress, timerActive, remainingSeconds, initialSeconds, blockId, setBlockTimer]);

  // Handle double click - reset timer
  const handleTimerDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!workoutInProgress) return;
    
    setBlockTimer(blockId, initialSeconds, initialSeconds, true);
  }, [workoutInProgress, initialSeconds, blockId, setBlockTimer]);

  // Handle set click - complete one set
  const handleSetClick = useCallback(() => {
    if (!workoutInProgress) return;
    
    if (completedSets < blockSets) {
      setBlockSets(blockId, completedSets + 1);
    }
  }, [workoutInProgress, completedSets, blockSets, blockId, setBlockSets]);

  const isSetComplete = completedSets >= blockSets;
  const hasFormat = workoutFormat || workoutDuration;
  const hasSets = blockSets > 1;
  
  // Determine timer color based on state
  const isFinished = remainingSeconds === 0 && initialSeconds > 0;
  const isUnderOneMinute = remainingSeconds > 0 && remainingSeconds <= 60;
  
  const getTimerColor = () => {
    if (isFinished) return 'text-[#00ffba]';
    if (isUnderOneMinute) return 'text-red-500';
    if (timerActive) return 'text-[#cb8954]';
    return 'text-[#cb8954]';
  };
  
  const getBorderColor = () => {
    if (isFinished) return 'border-[#00ffba] bg-[#00ffba]/20';
    if (isUnderOneMinute) return 'border-red-500 bg-red-500/10';
    if (timerActive) return 'border-[#cb8954] bg-[#cb8954]/10';
    return 'border-[#cb8954]';
  };

  if (!hasFormat && !hasSets) return null;

  return (
    <div className="mb-2 flex items-center gap-2">
      {hasFormat && (
        <div 
          className={`inline-flex items-center gap-2 text-xs border px-2 py-1 transition-all ${
            workoutInProgress 
              ? 'cursor-pointer hover:bg-[#cb8954]/10 active:scale-95' 
              : ''
          } ${getBorderColor()}`}
          onClick={handleTimerClick}
          onDoubleClick={handleTimerDoubleClick}
          title={workoutInProgress ? 'Click: Start/Pause | Double-click: Reset' : ''}
        >
          {workoutFormat && (
            <span className={getTimerColor()}>
              {workoutFormat}
            </span>
          )}
          {workoutFormat && workoutDuration && (
            <span className={getTimerColor()}>-</span>
          )}
          {workoutDuration && (
            <span className={`font-mono ${getTimerColor()} ${timerActive && !isFinished ? 'animate-pulse' : ''}`}>
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

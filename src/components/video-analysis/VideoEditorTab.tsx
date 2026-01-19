import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Upload, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Clock,
  Film,
  RefreshCw,
  Loader2,
  FileVideo,
  Flag,
  Swords,
  Shield,
  Target,
  User,
  Users,
  CircleDot,
  Timer,
  ZoomIn,
  ZoomOut,
  Minus,
  Plus as PlusIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useVideoExport } from '@/hooks/useVideoExport';
import { useStrikeTypes, StrikeType, categoryLabels, sideLabels } from '@/hooks/useStrikeTypes';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { supabase } from '@/integrations/supabase/client';

interface TrimClip {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
}

type ActionType = 'attack' | 'defense' | 'clinch';

interface ActionFlag {
  id: string;
  type: ActionType;
  startTime: number;
  endTime: number | null; // null αν δεν έχει κλείσει ακόμα
}

// Round marker on timeline
interface RoundMarker {
  id: string;
  roundNumber: number;
  startTime: number;
  endTime: number | null;
}

// Strike marker on timeline
interface StrikeMarker {
  id: string;
  strikeTypeId: string;
  strikeTypeName: string;
  strikeCategory: string;
  strikeSide: string | null;
  time: number;
  owner: 'athlete' | 'opponent'; // Determined by which flag it's inside
  roundNumber: number | null; // Which round this strike is in
  timeInRound: number | null; // Time (in seconds) within the round
  hitTarget: boolean; // Did the strike hit the target? (ορθότητα)
  blocked: boolean; // Was the strike blocked? (only for opponent strikes during defense)
}

interface VideoEditorTabProps {
  userId: string;
  onFightSaved?: () => void;
}

export const VideoEditorTab: React.FC<VideoEditorTabProps> = ({ userId, onFightSaved }) => {
  // Role check & coach ID - use useEffectiveCoachId hook
  const { userProfile } = useRoleCheck();
  const coachId = userProfile?.id || null;
  
  // Strike types hook
  const { strikeTypes, loading: strikeTypesLoading } = useStrikeTypes(coachId);

  // Video export hook
  const { 
    isLoading: isFFmpegLoading, 
    isExporting, 
    progress: exportProgress, 
    isReady: isFFmpegReady,
    loadFFmpeg,
    exportTrimmedVideo,
    exportMergedClips,
    downloadBlob
  } = useVideoExport();

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Trim state
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [clips, setClips] = useState<TrimClip[]>([]);
  const [isAddingClip, setIsAddingClip] = useState(false);
  const [clipLabel, setClipLabel] = useState('');
  
  // Action flags state
  const [actionFlags, setActionFlags] = useState<ActionFlag[]>([]);
  const [activeFlag, setActiveFlag] = useState<{ id: string; type: ActionType } | null>(null);
  
  // Round markers state
  const [roundMarkers, setRoundMarkers] = useState<RoundMarker[]>([]);
  const [activeRound, setActiveRound] = useState<{ id: string; roundNumber: number } | null>(null);
  
  // Strike markers state
  const [strikeMarkers, setStrikeMarkers] = useState<StrikeMarker[]>([]);
  const [isStrikePopoverOpen, setIsStrikePopoverOpen] = useState(false);
  
  // Timeline zoom state
  const [timelineZoom, setTimelineZoom] = useState(1); // 1 = normal, up to 10x zoom
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  
  // Drag state for round markers
  const [draggingRound, setDraggingRound] = useState<{ id: string; edge: 'start' | 'end' } | null>(null);
  
  // Drag state for action flags
  const [draggingFlag, setDraggingFlag] = useState<{ id: string; edge: 'start' | 'end' } | null>(null);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supported video extensions
  const supportedVideoExtensions = [
    '.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv', '.wmv', 
    '.flv', '.3gp', '.mpeg', '.mpg', '.m4v', '.ts', '.mts', '.m2ts'
  ];

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const hasVideoExtension = supportedVideoExtensions.some(ext => fileName.endsWith(ext));
      
      if (!file.type.startsWith('video/') && !hasVideoExtension) {
        toast.error('Παρακαλώ επιλέξτε αρχείο βίντεο');
        return;
      }
      
      // Cleanup previous URL
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      
      const url = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoUrl(url);
      setClips([]);
      setActionFlags([]);
      setActiveFlag(null);
      setRoundMarkers([]);
      setActiveRound(null);
      setStrikeMarkers([]);
      setTrimStart(0);
      setTrimEnd(0);
      setCurrentTime(0);
      toast.success('Βίντεο φορτώθηκε επιτυχώς');
    }
  };

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setTrimEnd(dur);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  // Playback controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const skipBack = () => seek(currentTime - 5);
  const skipForward = () => seek(currentTime + 5);
  const frameBack = () => seek(currentTime - (1/30)); // ~1 frame at 30fps
  const frameForward = () => seek(currentTime + (1/30));

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeVolume = (value: number[]) => {
    const vol = value[0];
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Trim controls
  const setTrimStartToCurrent = () => {
    setTrimStart(currentTime);
    toast.success(`Αρχή κοπής: ${formatTime(currentTime)}`);
  };

  const setTrimEndToCurrent = () => {
    setTrimEnd(currentTime);
    toast.success(`Τέλος κοπής: ${formatTime(currentTime)}`);
  };

  const previewTrim = () => {
    seek(trimStart);
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const addClip = () => {
    if (trimStart >= trimEnd) {
      toast.error('Η αρχή πρέπει να είναι πριν το τέλος');
      return;
    }
    
    const newClip: TrimClip = {
      id: crypto.randomUUID(),
      startTime: trimStart,
      endTime: trimEnd,
      label: clipLabel || `Clip ${clips.length + 1}`
    };
    
    setClips([...clips, newClip]);
    setClipLabel('');
    setIsAddingClip(false);
    toast.success('Clip προστέθηκε');
  };

  const removeClip = (id: string) => {
    setClips(clips.filter(c => c.id !== id));
  };

  const playClip = (clip: TrimClip) => {
    seek(clip.startTime);
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Auto-pause at trim end
  useEffect(() => {
    if (isPlaying && currentTime >= trimEnd && trimEnd < duration) {
      // Only pause if we're in trim preview mode
    }
  }, [currentTime, trimEnd, isPlaying, duration]);

  // Format time MM:SS.ms
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Action Flags functions
  const startActionFlag = (type: ActionType) => {
    // Αν υπάρχει ήδη ανοιχτό flag, κλείσε το πρώτα
    if (activeFlag) {
      closeActiveFlag();
    }
    
    const newFlag: ActionFlag = {
      id: crypto.randomUUID(),
      type,
      startTime: currentTime,
      endTime: null
    };
    
    setActionFlags(prev => [...prev, newFlag]);
    setActiveFlag({ id: newFlag.id, type });
    const typeLabels = { attack: 'Επίθεση', defense: 'Άμυνα', clinch: 'Clinch' };
    toast.success(`${typeLabels[type]} ξεκίνησε στο ${formatTime(currentTime)}`);
  };

  const closeActiveFlag = () => {
    if (!activeFlag) return;
    
    setActionFlags(prev => prev.map(flag => 
      flag.id === activeFlag.id 
        ? { ...flag, endTime: currentTime }
        : flag
    ));
    
    const typeLabels = { attack: 'Επίθεση', defense: 'Άμυνα', clinch: 'Clinch' };
    toast.success(`${typeLabels[activeFlag.type]} τελείωσε στο ${formatTime(currentTime)}`);
    setActiveFlag(null);
  };

  const removeActionFlag = (id: string) => {
    if (activeFlag?.id === id) {
      setActiveFlag(null);
    }
    setActionFlags(prev => prev.filter(f => f.id !== id));
    toast.success('Σήμανση διαγράφηκε');
  };

  // Calculate total action times
  const actionStats = useMemo(() => {
    const completedFlags = actionFlags.filter(f => f.endTime !== null);
    
    const attackFlags = completedFlags.filter(f => f.type === 'attack');
    const defenseFlags = completedFlags.filter(f => f.type === 'defense');
    const clinchFlags = completedFlags.filter(f => f.type === 'clinch');
    
    const attackTime = attackFlags.reduce((sum, f) => sum + (f.endTime! - f.startTime), 0);
    const defenseTime = defenseFlags.reduce((sum, f) => sum + (f.endTime! - f.startTime), 0);
    const clinchTime = clinchFlags.reduce((sum, f) => sum + (f.endTime! - f.startTime), 0);
    const totalActionTime = attackTime + defenseTime + clinchTime;
    
    return {
      attackCount: attackFlags.length,
      defenseCount: defenseFlags.length,
      clinchCount: clinchFlags.length,
      attackTime,
      defenseTime,
      clinchTime,
      totalActionTime,
      attackPercentage: totalActionTime > 0 ? (attackTime / totalActionTime) * 100 : 0,
      defensePercentage: totalActionTime > 0 ? (defenseTime / totalActionTime) * 100 : 0,
      clinchPercentage: totalActionTime > 0 ? (clinchTime / totalActionTime) * 100 : 0
    };
  }, [actionFlags]);

  // Determine strike owner based on which flag it falls into
  const determineStrikeOwner = (time: number): 'athlete' | 'opponent' => {
    // Find which flag this time falls into
    for (const flag of actionFlags) {
      const endTime = flag.endTime ?? duration;
      if (time >= flag.startTime && time <= endTime) {
        // Attack = athlete's strike, Defense = opponent's strike
        return flag.type === 'attack' ? 'athlete' : 'opponent';
      }
    }
    // Default to athlete if not in any flag
    return 'athlete';
  };

  // Determine which round a timestamp is in and time within that round
  const determineRoundInfo = (time: number): { roundNumber: number | null; timeInRound: number | null } => {
    for (const round of roundMarkers) {
      const endTime = round.endTime ?? duration;
      if (time >= round.startTime && time <= endTime) {
        return {
          roundNumber: round.roundNumber,
          timeInRound: time - round.startTime
        };
      }
    }
    return { roundNumber: null, timeInRound: null };
  };

  // Start a new round
  const startRound = () => {
    // Close any active round first
    if (activeRound) {
      closeActiveRound();
    }
    
    const nextRoundNumber = roundMarkers.length + 1;
    const newRound: RoundMarker = {
      id: crypto.randomUUID(),
      roundNumber: nextRoundNumber,
      startTime: currentTime,
      endTime: null
    };
    
    setRoundMarkers(prev => [...prev, newRound]);
    setActiveRound({ id: newRound.id, roundNumber: nextRoundNumber });
    toast.success(`Round ${nextRoundNumber} ξεκίνησε στο ${formatTime(currentTime)}`);
  };

  const closeActiveRound = () => {
    if (!activeRound) return;
    
    setRoundMarkers(prev => prev.map(round => 
      round.id === activeRound.id 
        ? { ...round, endTime: currentTime }
        : round
    ));
    
    toast.success(`Round ${activeRound.roundNumber} τελείωσε στο ${formatTime(currentTime)}`);
    setActiveRound(null);
  };

  const removeRound = (id: string) => {
    if (activeRound?.id === id) {
      setActiveRound(null);
    }
    // Re-number remaining rounds
    setRoundMarkers(prev => {
      const filtered = prev.filter(r => r.id !== id);
      return filtered.map((r, i) => ({ ...r, roundNumber: i + 1 }));
    });
    toast.success('Round διαγράφηκε');
  };


  // Drag handlers for round markers
  const handleRoundDragStart = (e: React.MouseEvent, roundId: string, edge: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingRound({ id: roundId, edge });
  };

  const handleRoundDrag = useCallback((e: MouseEvent) => {
    if (!draggingRound || !timelineContainerRef.current) return;
    
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    setRoundMarkers(prev => prev.map(round => {
      if (round.id !== draggingRound.id) return round;
      
      if (draggingRound.edge === 'start') {
        // Don't let start go past end
        const maxStart = round.endTime ? round.endTime - 0.1 : duration - 0.1;
        return { ...round, startTime: Math.min(newTime, maxStart) };
      } else {
        // Don't let end go before start
        const minEnd = round.startTime + 0.1;
        return { ...round, endTime: Math.max(newTime, minEnd) };
      }
    }));
  }, [draggingRound, duration]);

  const handleRoundDragEnd = useCallback(() => {
    if (draggingRound) {
      setDraggingRound(null);
    }
  }, [draggingRound]);

  // Drag handlers for action flags
  const handleFlagDragStart = (e: React.MouseEvent, flagId: string, edge: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingFlag({ id: flagId, edge });
  };

  const handleFlagDrag = useCallback((e: MouseEvent) => {
    if (!draggingFlag || !timelineContainerRef.current) return;
    
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    setActionFlags(prev => prev.map(flag => {
      if (flag.id !== draggingFlag.id) return flag;
      
      if (draggingFlag.edge === 'start') {
        const maxStart = flag.endTime ? flag.endTime - 0.1 : duration - 0.1;
        return { ...flag, startTime: Math.min(newTime, maxStart) };
      } else {
        const minEnd = flag.startTime + 0.1;
        return { ...flag, endTime: Math.max(newTime, minEnd) };
      }
    }));
  }, [draggingFlag, duration]);

  const handleFlagDragEnd = useCallback(() => {
    if (draggingFlag) {
      setDraggingFlag(null);
    }
  }, [draggingFlag]);

  // Add/remove mouse event listeners for dragging
  useEffect(() => {
    const isDragging = draggingRound || draggingFlag;
    
    if (isDragging) {
      const handleDrag = (e: MouseEvent) => {
        if (draggingRound) handleRoundDrag(e);
        if (draggingFlag) handleFlagDrag(e);
      };
      
      const handleDragEnd = () => {
        handleRoundDragEnd();
        handleFlagDragEnd();
      };
      
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [draggingRound, draggingFlag, handleRoundDrag, handleRoundDragEnd, handleFlagDrag, handleFlagDragEnd]);

  // Add strike marker at current time
  const addStrikeMarker = (strikeType: StrikeType) => {
    const owner = determineStrikeOwner(currentTime);
    const roundInfo = determineRoundInfo(currentTime);
    
    const newMarker: StrikeMarker = {
      id: crypto.randomUUID(),
      strikeTypeId: strikeType.id,
      strikeTypeName: strikeType.name,
      strikeCategory: strikeType.category,
      strikeSide: strikeType.side,
      time: currentTime,
      owner,
      roundNumber: roundInfo.roundNumber,
      timeInRound: roundInfo.timeInRound,
      hitTarget: false, // Default to false, user can toggle with click
      blocked: false // Default to false, can toggle only for opponent strikes during defense
    };
    
    setStrikeMarkers(prev => [...prev, newMarker].sort((a, b) => a.time - b.time));
    setIsStrikePopoverOpen(false);
    
    const roundText = roundInfo.roundNumber 
      ? ` - R${roundInfo.roundNumber} @ ${formatTimeInRound(roundInfo.timeInRound!)}`
      : '';
    toast.success(`${strikeType.name} (${owner === 'athlete' ? 'Αθλητής' : 'Αντίπαλος'})${roundText}`);
  };

  // Toggle strike states based on owner
  // For athlete strikes: toggle hitTarget (correct/incorrect technique)
  // For opponent strikes: cycle through states (miss -> hit -> blocked -> miss)
  const toggleStrikeState = (id: string) => {
    setStrikeMarkers(prev => prev.map(m => {
      if (m.id !== id) return m;
      
      if (m.owner === 'athlete') {
        // Athlete strikes: simple toggle for hitTarget (ορθότητα)
        return { ...m, hitTarget: !m.hitTarget };
      } else {
        // Opponent strikes: cycle through miss -> hit -> blocked -> miss
        if (!m.hitTarget && !m.blocked) {
          // miss -> hit
          return { ...m, hitTarget: true, blocked: false };
        } else if (m.hitTarget && !m.blocked) {
          // hit -> blocked
          return { ...m, hitTarget: false, blocked: true };
        } else {
          // blocked -> miss
          return { ...m, hitTarget: false, blocked: false };
        }
      }
    }));
  };

  // Format time within round (MM:SS)
  const formatTimeInRound = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Remove strike marker
  const removeStrikeMarker = (id: string) => {
    setStrikeMarkers(prev => prev.filter(m => m.id !== id));
  };

  // Strike statistics
  const strikeStats = useMemo(() => {
    const athleteStrikes = strikeMarkers.filter(m => m.owner === 'athlete');
    const opponentStrikes = strikeMarkers.filter(m => m.owner === 'opponent');
    
    // Calculate hit accuracy (ορθότητα)
    const athleteHits = athleteStrikes.filter(m => m.hitTarget).length;
    const opponentHits = opponentStrikes.filter(m => m.hitTarget).length;
    
    const athleteAccuracy = athleteStrikes.length > 0 
      ? (athleteHits / athleteStrikes.length) * 100 
      : 0;
    const opponentAccuracy = opponentStrikes.length > 0 
      ? (opponentHits / opponentStrikes.length) * 100 
      : 0;
    
    // Group strikes by round
    const byRound = strikeMarkers.reduce((acc, m) => {
      const key = m.roundNumber ?? 'unknown';
      if (!acc[key]) acc[key] = { athlete: [], opponent: [] };
      acc[key][m.owner].push(m);
      return acc;
    }, {} as Record<string | number, { athlete: StrikeMarker[]; opponent: StrikeMarker[] }>);
    
    return {
      athleteTotal: athleteStrikes.length,
      opponentTotal: opponentStrikes.length,
      athleteHits,
      opponentHits,
      athleteAccuracy,
      opponentAccuracy,
      athleteByCategory: athleteStrikes.reduce((acc, m) => {
        acc[m.strikeCategory] = (acc[m.strikeCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      opponentByCategory: opponentStrikes.reduce((acc, m) => {
        acc[m.strikeCategory] = (acc[m.strikeCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byRound
    };
  }, [strikeMarkers]);

  // Export clips info (in real implementation, would use FFmpeg.wasm or server-side processing)
  const exportClipsInfo = () => {
    if (clips.length === 0) {
      toast.error('Δεν υπάρχουν clips για εξαγωγή');
      return;
    }
    
    const clipData = clips.map((clip, i) => ({
      index: i + 1,
      label: clip.label,
      start: formatTime(clip.startTime),
      end: formatTime(clip.endTime),
      duration: formatTime(clip.endTime - clip.startTime),
      startSeconds: clip.startTime.toFixed(3),
      endSeconds: clip.endTime.toFixed(3)
    }));
    
    const json = JSON.stringify(clipData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `clips-${videoFile?.name || 'video'}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Στοιχεία clips εξήχθησαν');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Calculate action time from action flags
  const calculateActionTime = useMemo(() => {
    let totalActionTime = 0;
    actionFlags.forEach(flag => {
      if (flag.endTime !== null) {
        totalActionTime += (flag.endTime - flag.startTime);
      }
    });
    return Math.round(totalActionTime);
  }, [actionFlags]);

  // Calculate average round duration from roundMarkers
  const calculateAverageRoundDuration = useMemo(() => {
    const completedRounds = roundMarkers.filter(r => r.endTime !== null);
    if (completedRounds.length === 0) return 180; // default 3 minutes
    
    const totalDuration = completedRounds.reduce((sum, r) => {
      return sum + ((r.endTime || 0) - r.startTime);
    }, 0);
    
    return Math.round(totalDuration / completedRounds.length);
  }, [roundMarkers]);

  // Save fight to database
  const saveFight = async () => {
    if (!userId || !coachId) {
      toast.error('Απαιτείται επιλογή χρήστη');
      return;
    }

    if (strikeMarkers.length === 0 && roundMarkers.length === 0) {
      toast.error('Δεν υπάρχουν δεδομένα για αποθήκευση');
      return;
    }

    try {
      // Calculate average round duration from marked rounds
      const completedRounds = roundMarkers.filter(r => r.endTime !== null);
      let avgRoundDuration = 180; // default
      if (completedRounds.length > 0) {
        const totalDuration = completedRounds.reduce((sum, r) => {
          return sum + ((r.endTime || 0) - r.startTime);
        }, 0);
        avgRoundDuration = Math.round(totalDuration / completedRounds.length);
      }

      // Create fight record
      const { data: fightData, error: fightError } = await supabase
        .from('muaythai_fights')
        .insert({
          user_id: userId,
          coach_id: coachId,
          fight_date: new Date().toISOString().split('T')[0],
          fight_type: 'sparring',
          opponent_name: 'Sparring Partner',
          total_rounds: roundMarkers.length || 1,
          round_duration_seconds: avgRoundDuration,
          notes: `Video: ${videoFile?.name || 'Unknown'}`
        })
        .select()
        .single();

      if (fightError) throw fightError;

      const fightId = fightData.id;

      // Create round records from roundMarkers
      const roundsToInsert = roundMarkers.map(round => {
        const roundDuration = round.endTime !== null 
          ? Math.round(round.endTime - round.startTime) 
          : avgRoundDuration;
        
        // Calculate stats for this round
        const roundStrikes = strikeMarkers.filter(s => s.roundNumber === round.roundNumber);
        const athleteStrikes = roundStrikes.filter(s => s.owner === 'athlete');
        const opponentStrikes = roundStrikes.filter(s => s.owner === 'opponent');
        
        const athleteStrikesTotal = athleteStrikes.length;
        const athleteStrikesCorrect = athleteStrikes.filter(s => s.hitTarget).length;
        const opponentStrikesTotal = opponentStrikes.length;
        const opponentStrikesCorrect = opponentStrikes.filter(s => s.hitTarget).length;
        const hitsReceived = opponentStrikesCorrect; // Opponent strikes that hit target = hits received by athlete
        
        return {
          fight_id: fightId,
          round_number: round.roundNumber,
          duration_seconds: roundDuration,
          athlete_strikes_total: athleteStrikesTotal,
          athlete_strikes_correct: athleteStrikesCorrect,
          opponent_strikes_total: opponentStrikesTotal,
          opponent_strikes_correct: opponentStrikesCorrect,
          hits_received: hitsReceived
        };
      });

      // If no rounds were marked, create a default round with all strikes
      if (roundsToInsert.length === 0) {
        const athleteStrikes = strikeMarkers.filter(s => s.owner === 'athlete');
        const opponentStrikes = strikeMarkers.filter(s => s.owner === 'opponent');
        
        roundsToInsert.push({
          fight_id: fightId,
          round_number: 1,
          duration_seconds: avgRoundDuration,
          athlete_strikes_total: athleteStrikes.length,
          athlete_strikes_correct: athleteStrikes.filter(s => s.hitTarget).length,
          opponent_strikes_total: opponentStrikes.length,
          opponent_strikes_correct: opponentStrikes.filter(s => s.hitTarget).length,
          hits_received: opponentStrikes.filter(s => s.hitTarget).length
        });
      }

      // Insert rounds
      const { data: roundsData, error: roundsError } = await supabase
        .from('muaythai_rounds')
        .insert(roundsToInsert)
        .select();

      if (roundsError) throw roundsError;

      // Create a map from round_number to round_id
      const roundIdMap = new Map<number, string>();
      roundsData?.forEach(r => {
        roundIdMap.set(r.round_number, r.id);
      });

      // Create strike records
      if (strikeMarkers.length > 0) {
        const strikesToInsert = strikeMarkers.map(strike => {
          // Find the round_id for this strike
          const roundId = strike.roundNumber 
            ? roundIdMap.get(strike.roundNumber) 
            : roundIdMap.get(1); // Default to round 1
          
          if (!roundId) return null;

          // Map strike category to the expected strike_type
          let strikeType: 'punch' | 'kick' | 'knee' | 'elbow' = 'punch';
          if (strike.strikeCategory === 'kick' || strike.strikeCategory === 'kicks') {
            strikeType = 'kick';
          } else if (strike.strikeCategory === 'knee' || strike.strikeCategory === 'knees') {
            strikeType = 'knee';
          } else if (strike.strikeCategory === 'elbow' || strike.strikeCategory === 'elbows') {
            strikeType = 'elbow';
          } else if (strike.strikeCategory === 'punch' || strike.strikeCategory === 'punches') {
            strikeType = 'punch';
          }

          return {
            round_id: roundId,
            timestamp_in_round: strike.timeInRound ? Math.round(strike.timeInRound) : 0,
            strike_type: strikeType,
            side: strike.strikeSide || 'right',
            landed: strike.hitTarget,
            is_opponent: strike.owner === 'opponent',
            is_correct: strike.hitTarget
          };
        }).filter(Boolean);

        if (strikesToInsert.length > 0) {
          const { error: strikesError } = await supabase
            .from('muaythai_strikes')
            .insert(strikesToInsert as any[]);

          if (strikesError) throw strikesError;
        }
      }

      toast.success('Αγώνας αποθηκεύτηκε επιτυχώς!');
      
      // Reset editor
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoFile(null);
      setVideoUrl(null);
      setClips([]);
      setActionFlags([]);
      setActiveFlag(null);
      setRoundMarkers([]);
      setActiveRound(null);
      setStrikeMarkers([]);
      
      // Call the callback to refresh fights list
      if (onFightSaved) {
        onFightSaved();
      }
    } catch (error) {
      console.error('Error saving fight:', error);
      toast.error('Σφάλμα κατά την αποθήκευση');
    }
  };

  if (!videoUrl) {
    return (
      <Card className="rounded-none border-dashed border-2 border-gray-300">
        <CardContent className="py-6">
          <div className="text-center">
            <Film className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm mb-3">
              Ανεβάστε βίντεο για νέο αγώνα
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/avi,video/mov,video/quicktime,video/x-msvideo,video/x-matroska,video/mkv,video/wmv,video/flv,video/3gpp,video/mpeg,video/x-m4v,.mp4,.webm,.ogg,.avi,.mov,.mkv,.wmv,.flv,.3gp,.mpeg,.m4v,.ts,.mts,.m2ts"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Upload className="w-4 h-4 mr-1" />
              Επιλογή Βίντεο
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <Card className="rounded-none">
        <CardContent className="p-4">
          <div className="relative bg-black rounded-none overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full max-h-[60vh] object-contain"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onClick={togglePlay}
              playsInline
            />
            
            {/* Play overlay */}
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                onClick={togglePlay}
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-8 h-8 text-black ml-1" />
                </div>
              </div>
            )}
          </div>
          
          {/* Strike Buttons - Above Timeline */}
          <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded-none">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 mr-2">
                <Target className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-medium">Χτυπήματα:</span>
              </div>
              {strikeTypesLoading ? (
                <span className="text-xs text-gray-500">Φόρτωση...</span>
              ) : strikeTypes.length === 0 ? (
                <span className="text-xs text-gray-500">Δεν υπάρχουν χτυπήματα</span>
              ) : (
                [...strikeTypes]
                  .sort((a, b) => {
                    // Check if name is a number
                    const aIsNumber = /^\d+$/.test(a.name.trim());
                    const bIsNumber = /^\d+$/.test(b.name.trim());
                    
                    // Numbers come first
                    if (aIsNumber && !bIsNumber) return -1;
                    if (!aIsNumber && bIsNumber) return 1;
                    
                    // If both are numbers, sort numerically
                    if (aIsNumber && bIsNumber) {
                      return parseInt(a.name) - parseInt(b.name);
                    }
                    
                    // Otherwise keep original order
                    return 0;
                  })
                  .map((strike) => (
                    <Button
                      key={strike.id}
                      size="sm"
                      variant="outline"
                      className="rounded-none h-6 text-[10px] px-2 hover:bg-[#cb8954] hover:text-white hover:border-[#cb8954]"
                      onClick={() => addStrikeMarker(strike)}
                    >
                      {strike.name}
                    </Button>
                  ))
              )}
            </div>
          </div>

          {/* Timeline with Zoom */}
          <div className="mt-2 space-y-2">
            {/* Zoom Controls */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-1.5 rounded-none">
              <div className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600">Zoom: {timelineZoom.toFixed(1)}x</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-none"
                  onClick={() => setTimelineZoom(Math.max(1, timelineZoom - 0.5))}
                  disabled={timelineZoom <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Slider
                  value={[timelineZoom]}
                  min={1}
                  max={10}
                  step={0.5}
                  onValueChange={(value) => setTimelineZoom(value[0])}
                  className="w-24"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-none"
                  onClick={() => setTimelineZoom(Math.min(10, timelineZoom + 0.5))}
                  disabled={timelineZoom >= 10}
                >
                  <PlusIcon className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 rounded-none text-xs"
                  onClick={() => setTimelineZoom(1)}
                  disabled={timelineZoom === 1}
                >
                  Reset
                </Button>
              </div>
            </div>
            
            {/* Scrollable Timeline Container */}
            <div 
              ref={timelineScrollRef}
              className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
              style={{ 
                scrollbarWidth: 'thin',
              }}
            >
              <div ref={timelineContainerRef} style={{ width: `${100 * timelineZoom}%`, minWidth: '100%' }}>
                {/* Rounds Timeline - Enlarged */}
                <div className="relative h-10 bg-blue-50 rounded-none border border-blue-200">
                  {roundMarkers.map((round) => {
                    const isOpen = round.endTime === null;
                    // For open rounds, use the max of currentTime and startTime to prevent backwards jumping
                    const effectiveEndTime = isOpen 
                      ? Math.max(currentTime, round.startTime + 0.1) 
                      : round.endTime!;
                    const roundWidth = Math.max(0, ((effectiveEndTime - round.startTime) / duration) * 100);
                    const isDragging = draggingRound?.id === round.id;
                    const roundDuration = effectiveEndTime - round.startTime;
                    const roundMinutes = Math.floor(roundDuration / 60);
                    const roundSeconds = Math.floor(roundDuration % 60);
                    const durationText = `${roundMinutes}:${roundSeconds.toString().padStart(2, '0')}`;
                    
                    return (
                      <div
                        key={round.id}
                        className={`absolute h-full transition-opacity bg-blue-400/50 ${isOpen ? 'animate-pulse' : ''} ${isDragging ? 'z-20' : ''}`}
                        style={{ 
                          left: `${(round.startTime / duration) * 100}%`,
                          width: `${roundWidth}%`,
                          minWidth: '40px'
                        }}
                        title={`Round ${round.roundNumber}: ${formatTime(round.startTime)} - ${round.endTime ? formatTime(round.endTime) : 'σε εξέλιξη'} (${durationText})`}
                      >
                        {/* Start edge drag handle */}
                        <div 
                          className="absolute left-0 top-0 w-2 h-full bg-blue-600 cursor-ew-resize hover:bg-blue-700 transition-colors"
                          onMouseDown={(e) => handleRoundDragStart(e, round.id, 'start')}
                          title="Σύρετε για αλλαγή αρχής"
                        />
                        
                        {/* Center - click to seek */}
                        <div 
                          className="absolute left-2 right-6 top-0 h-full cursor-pointer hover:bg-blue-500/20 flex flex-col justify-center"
                          onClick={() => seek(round.startTime)}
                        >
                          <div className="text-[10px] font-bold text-blue-700 leading-tight">
                            R{round.roundNumber}
                          </div>
                          <div className="text-[9px] text-blue-600 leading-tight">
                            {durationText}
                          </div>
                        </div>
                        
                        {/* Delete button */}
                        <button
                          className="absolute top-0.5 right-3 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRound(round.id);
                          }}
                          title="Διαγραφή Round"
                        >
                          ×
                        </button>
                        
                        {/* End edge drag handle - only show if round is closed */}
                        {!isOpen && (
                          <div 
                            className="absolute right-0 top-0 w-2 h-full bg-blue-600 cursor-ew-resize hover:bg-blue-700 transition-colors"
                            onMouseDown={(e) => handleRoundDragStart(e, round.id, 'end')}
                            title="Σύρετε για αλλαγή τέλους"
                          />
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Current position indicator */}
                  <div 
                    className="absolute w-0.5 h-full bg-black z-10"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                
                {/* Action Flags Timeline */}
                <div className="relative h-8 bg-gray-100 rounded-none border border-gray-200 mt-1">
                  {/* Action flag markers */}
                  {actionFlags.map((flag) => {
                    const isOpen = flag.endTime === null;
                    // For open flags, use the max of currentTime and startTime to prevent backwards jumping
                    const effectiveEndTime = isOpen 
                      ? Math.max(currentTime, flag.startTime + 0.1) 
                      : flag.endTime!;
                    const flagWidth = Math.max(0, ((effectiveEndTime - flag.startTime) / duration) * 100);
                    const isDraggingThis = draggingFlag?.id === flag.id;
                    
                    const getColors = (type: ActionType) => {
                      if (type === 'attack') return { bg: 'bg-[#00ffba]/60', dark: 'bg-[#00997a]', hover: 'hover:bg-[#00b894]', text: 'text-[#00997a]', label: 'ΕΠ', title: 'Επίθεση' };
                      if (type === 'clinch') return { bg: 'bg-purple-500/60', dark: 'bg-purple-700', hover: 'hover:bg-purple-600', text: 'text-purple-700', label: 'CL', title: 'Clinch' };
                      return { bg: 'bg-red-500/60', dark: 'bg-red-700', hover: 'hover:bg-red-600', text: 'text-red-700', label: 'ΑΜ', title: 'Άμυνα' };
                    };
                    const colors = getColors(flag.type);
                    
                    return (
                      <div
                        key={flag.id}
                        className={`absolute h-full transition-opacity group ${colors.bg} ${isOpen ? 'animate-pulse' : ''} ${isDraggingThis ? 'z-20' : ''}`}
                        style={{ 
                          left: `${(flag.startTime / duration) * 100}%`,
                          width: `${flagWidth}%`,
                          minWidth: '20px'
                        }}
                        title={`${colors.title}: ${formatTime(flag.startTime)} - ${flag.endTime ? formatTime(flag.endTime) : 'σε εξέλιξη'}`}
                      >
                        {/* Start edge drag handle */}
                        <div 
                          className={`absolute left-0 top-0 w-2 h-full cursor-ew-resize transition-colors ${colors.dark} ${colors.hover}`}
                          onMouseDown={(e) => handleFlagDragStart(e, flag.id, 'start')}
                          title="Σύρετε για αλλαγή αρχής"
                        />
                        
                        {/* Center - click to seek */}
                        <div 
                          className="absolute left-2 right-2 top-0 h-full cursor-pointer hover:opacity-80 flex items-center"
                          onClick={() => seek(flag.startTime)}
                        >
                          <Flag className={`w-3 h-3 ${colors.text}`} />
                          <span className={`ml-1 text-[8px] font-medium ${colors.text}`}>
                            {colors.label}
                          </span>
                        </div>
                        
                        {/* Delete button - appears on hover, positioned above the flag */}
                        <button
                          className={`absolute -top-5 left-1/2 -translate-x-1/2 w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-bold z-20 opacity-0 group-hover:opacity-100 transition-opacity shadow-md ${colors.dark} ${colors.hover}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeActionFlag(flag.id);
                          }}
                          title={`Διαγραφή ${colors.title}`}
                        >
                          ×
                        </button>
                        
                        {/* End edge drag handle - only show if flag is closed */}
                        {!isOpen && (
                          <div 
                            className={`absolute right-0 top-0 w-2 h-full cursor-ew-resize transition-colors ${colors.dark} ${colors.hover}`}
                            onMouseDown={(e) => handleFlagDragStart(e, flag.id, 'end')}
                            title="Σύρετε για αλλαγή τέλους"
                          />
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Current position indicator */}
                  <div 
                    className="absolute w-0.5 h-full bg-black z-10"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                
                {/* Strike Markers on Timeline - Dots with combo stacking */}
                {(() => {
                  // Group strikes by second for combo stacking
                  const groupedBySecond: { [key: number]: typeof strikeMarkers } = {};
                  strikeMarkers.forEach(marker => {
                    const second = Math.floor(marker.time);
                    if (!groupedBySecond[second]) groupedBySecond[second] = [];
                    groupedBySecond[second].push(marker);
                  });
                  
                  // Calculate max combo size to determine row count
                  const maxCombo = Math.max(1, ...Object.values(groupedBySecond).map(g => g.length));
                  const rowHeight = 10; // pixels per row
                  const totalHeight = Math.max(20, maxCombo * rowHeight + 4);
                  
                  return (
                    <div className="relative bg-gray-50 rounded-none border border-gray-200 mt-1" style={{ height: `${totalHeight}px` }}>
                      {Object.entries(groupedBySecond).map(([second, markers]) => {
                        const isCombo = markers.length >= 2;
                        
                        return markers.map((marker, indexInCombo) => {
                          // Color based on owner and state
                          let dotColor = '';
                          if (marker.owner === 'athlete') {
                            dotColor = marker.hitTarget ? 'bg-[#00ffba]' : 'bg-gray-300';
                          } else {
                            if (marker.blocked) {
                              dotColor = 'bg-blue-500';
                            } else if (marker.hitTarget) {
                              dotColor = 'bg-red-500';
                            } else {
                              dotColor = 'bg-gray-300';
                            }
                          }
                          
                          // Vertical position - stack from top
                          const topOffset = 2 + (indexInCombo * rowHeight);
                          
                          return (
                            <div
                              key={marker.id}
                              className={`absolute w-2.5 h-2.5 rounded-full cursor-pointer hover:scale-125 transition-all ${dotColor} ${isCombo ? 'ring-1 ring-white shadow-sm' : ''}`}
                              style={{ 
                                left: `${(marker.time / duration) * 100}%`,
                                top: `${topOffset}px`,
                                transform: 'translateX(-50%)'
                              }}
                              onClick={() => toggleStrikeState(marker.id)}
                              title={`${marker.strikeTypeName} - ${marker.owner === 'athlete' ? 'ΕΓΩ' : 'ΑΝΤ'}${isCombo ? ` (Combo ${indexInCombo + 1}/${markers.length})` : ''}`}
                            />
                          );
                        });
                      })}
                      
                      {/* Current position indicator */}
                      <div 
                        className="absolute w-0.5 h-full bg-black z-10"
                        style={{ left: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                  );
                })()}

                {/* Trim markers on timeline */}
                <div className="relative h-2 bg-gray-200 rounded-none mt-1">
                  {/* Playback progress */}
                  <div 
                    className="absolute h-full bg-[#00ffba] rounded-none"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  
                  {/* Trim range indicator */}
                  <div 
                    className="absolute h-full bg-blue-500/30"
                    style={{ 
                      left: `${(trimStart / duration) * 100}%`,
                      width: `${((trimEnd - trimStart) / duration) * 100}%`
                    }}
                  />
                  
                  {/* Clip markers */}
                  {clips.map((clip, i) => (
                    <div
                      key={clip.id}
                      className="absolute h-full bg-purple-500/50 border-l-2 border-r-2 border-purple-600"
                      style={{ 
                        left: `${(clip.startTime / duration) * 100}%`,
                        width: `${((clip.endTime - clip.startTime) / duration) * 100}%`
                      }}
                      title={clip.label}
                    />
                  ))}
                </div>
                
                {/* Time markers */}
                {timelineZoom > 1 && (
                  <div className="relative h-3 flex">
                    {Array.from({ length: Math.ceil(duration / (timelineZoom > 5 ? 1 : 5)) + 1 }).map((_, i) => {
                      const time = i * (timelineZoom > 5 ? 1 : 5);
                      if (time > duration) return null;
                      return (
                        <div
                          key={i}
                          className="absolute text-[8px] text-gray-400 transform -translate-x-1/2"
                          style={{ left: `${(time / duration) * 100}%` }}
                        >
                          {formatTime(time)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Strike Boxes - List of strikes below timeline */}
              {strikeMarkers.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-none bg-gray-50">
                  <div className="p-2 space-y-1">
                    {strikeMarkers.map((marker, index) => {
                      const roundText = marker.roundNumber 
                        ? `R${marker.roundNumber}` 
                        : '';
                      
                      // Status and styling based on owner and state
                      let statusText = '';
                      let statusColor = '';
                      let bgColor = '';
                      
                      if (marker.owner === 'athlete') {
                        statusText = marker.hitTarget ? 'Ορθό' : 'Λάθος';
                        statusColor = marker.hitTarget ? 'text-[#00ffba]' : 'text-gray-400';
                        bgColor = marker.hitTarget ? 'bg-[#00ffba]/10 border-[#00ffba]/30' : 'bg-gray-100 border-gray-200';
                      } else {
                        if (marker.blocked) {
                          statusText = 'Μπλοκ';
                          statusColor = 'text-blue-500';
                          bgColor = 'bg-blue-50 border-blue-200';
                        } else if (marker.hitTarget) {
                          statusText = 'Χτύπησε';
                          statusColor = 'text-red-500';
                          bgColor = 'bg-red-50 border-red-200';
                        } else {
                          statusText = 'Άστοχο';
                          statusColor = 'text-gray-400';
                          bgColor = 'bg-gray-100 border-gray-200';
                        }
                      }
                      
                      return (
                        <div
                          key={marker.id}
                          onClick={() => toggleStrikeState(marker.id)}
                          className={`flex items-center justify-between p-2 border rounded-none cursor-pointer hover:opacity-80 transition-all ${bgColor}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500 w-8">{formatTime(marker.time)}</span>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-none ${
                              marker.owner === 'athlete' 
                                ? 'bg-[#00ffba]/20 text-[#00997a]' 
                                : 'bg-[#cb8954]/20 text-[#a06b3d]'
                            }`}>
                              {marker.owner === 'athlete' ? 'ΕΓΩ' : 'ΑΝΤ'}
                            </span>
                            <span className="text-xs font-medium">{marker.strikeTypeName}</span>
                            {roundText && (
                              <span className="text-[10px] text-gray-400">{roundText}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${statusColor}`}>
                              {statusText}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStrikeMarkers(prev => prev.filter(m => m.id !== marker.id));
                              }}
                              className="text-gray-400 hover:text-red-500 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Seek slider - outside zoom container */}
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.01}
              onValueChange={(value) => seek(value[0])}
              className="cursor-pointer"
            />
            
            {/* Time display */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Tools Row - All in one line */}
          <div className="mt-4 flex flex-wrap items-stretch gap-2">
            {/* Round Controls */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-none flex items-center gap-3 min-w-[160px]">
              <div className="flex items-center gap-1.5">
                <CircleDot className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Γύροι</span>
                {roundMarkers.length > 0 && (
                  <Badge variant="outline" className="rounded-none bg-blue-100 text-blue-700 text-xs px-1.5">
                    {roundMarkers.length}
                  </Badge>
                )}
              </div>
              
              {activeRound ? (
                <Button
                  size="sm"
                  className="rounded-none bg-blue-500 text-white animate-pulse h-8 text-xs"
                  onClick={closeActiveRound}
                >
                  <Timer className="w-3.5 h-3.5 mr-1" />
                  Τέλος R{activeRound.roundNumber}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white h-8 text-xs"
                  onClick={startRound}
                >
                  <CircleDot className="w-3.5 h-3.5 mr-1" />
                  R{roundMarkers.length + 1}
                </Button>
              )}
            </div>
            
            {/* Action Flags Controls */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-none flex items-center gap-3 min-w-[180px]">
              <div className="flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Σήμανση</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {activeFlag?.type === 'attack' ? (
                  <Button
                    size="sm"
                    className="rounded-none bg-[#00ffba] text-black animate-pulse h-8 text-xs"
                    onClick={closeActiveFlag}
                  >
                    <Swords className="w-3.5 h-3.5 mr-1" />
                    Τέλος
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba] hover:text-black h-8 text-xs px-2.5"
                    onClick={() => startActionFlag('attack')}
                    disabled={activeFlag !== null}
                  >
                    <Swords className="w-3.5 h-3.5" />
                  </Button>
                )}
                
                {activeFlag?.type === 'defense' ? (
                  <Button
                    size="sm"
                    className="rounded-none bg-red-500 text-white animate-pulse h-8 text-xs"
                    onClick={closeActiveFlag}
                  >
                    <Shield className="w-3.5 h-3.5 mr-1" />
                    Τέλος
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none border-red-500 text-red-500 hover:bg-red-500 hover:text-white h-8 text-xs px-2.5"
                    onClick={() => startActionFlag('defense')}
                    disabled={activeFlag !== null}
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </Button>
                )}
                
                {activeFlag?.type === 'clinch' ? (
                  <Button
                    size="sm"
                    className="rounded-none bg-purple-500 text-white animate-pulse h-8 text-xs"
                    onClick={closeActiveFlag}
                  >
                    <Users className="w-3.5 h-3.5 mr-1" />
                    Τέλος
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white h-8 text-xs px-2.5"
                    onClick={() => startActionFlag('clinch')}
                    disabled={activeFlag !== null}
                    title="Clinch"
                  >
                    Clinch
                  </Button>
                )}
              </div>
            </div>
            
            {/* Trim Controls */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-none flex items-center gap-3 min-w-[200px]">
              <div className="flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Κοπή</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none h-8 text-xs px-2.5"
                  onClick={setTrimStartToCurrent}
                  title="Ορισμός αρχής"
                >
                  [
                </Button>
                <Badge variant="outline" className="rounded-none font-mono text-xs px-1.5">
                  {formatTime(trimEnd - trimStart)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none h-8 text-xs px-2.5"
                  onClick={setTrimEndToCurrent}
                  title="Ορισμός τέλους"
                >
                  ]
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none h-8 text-xs"
                  onClick={previewTrim}
                >
                  <Play className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-8 text-xs"
                  onClick={() => setIsAddingClip(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            
            {/* Export Controls */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-none flex items-center gap-3 min-w-[180px]">
              <div className="flex items-center gap-1.5">
                <Download className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Εξαγωγή</span>
              </div>
              
              {isExporting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs text-gray-600">{exportProgress}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none h-8 text-xs"
                    onClick={async () => {
                      if (!videoFile) return;
                      if (trimStart >= trimEnd) {
                        toast.error('Ορίστε έγκυρο εύρος κοπής');
                        return;
                      }
                      
                      if (!isFFmpegReady) {
                        toast.info('Φόρτωση FFmpeg...');
                        await loadFFmpeg();
                      }
                      
                      const blob = await exportTrimmedVideo(videoFile, {
                        startTime: trimStart,
                        endTime: trimEnd,
                        filename: `trimmed_${videoFile.name}`
                      });
                      
                      if (blob) {
                        const ext = videoFile.name.split('.').pop() || 'mp4';
                        downloadBlob(blob, `trimmed_${Date.now()}.${ext}`);
                      }
                    }}
                    disabled={isFFmpegLoading || !videoFile}
                  >
                    {isFFmpegLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Trim
                      </>
                    )}
                  </Button>
                  
                  {clips.length > 0 && (
                    <Button
                      size="sm"
                      className="rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white h-8 text-xs"
                      onClick={async () => {
                        if (!videoFile) return;
                        
                        if (!isFFmpegReady) {
                          toast.info('Φόρτωση FFmpeg...');
                          await loadFFmpeg();
                        }
                        
                        const blob = await exportMergedClips(videoFile, clips);
                        
                        if (blob) {
                          const ext = videoFile.name.split('.').pop() || 'mp4';
                          downloadBlob(blob, `merged_clips_${Date.now()}.${ext}`);
                        }
                      }}
                      disabled={isFFmpegLoading}
                    >
                      <FileVideo className="w-3.5 h-3.5 mr-1" />
                      ({clips.length})
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Strike Stats Compact */}
            <div className="p-2 bg-gray-50 border border-gray-200 rounded-none flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-gray-600 flex items-center gap-0.5">
                  <User className="w-2 h-2" />
                </span>
                <span className="font-bold text-[#00997a]">{strikeStats.athleteHits}/{strikeStats.athleteTotal}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-gray-600 flex items-center gap-0.5">
                  <Users className="w-2 h-2" />
                </span>
                <span className="font-bold text-[#cb8954]">{strikeStats.opponentHits}/{strikeStats.opponentTotal}</span>
              </div>
            </div>
          </div>
          
          {/* Playback Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" className="rounded-none" onClick={frameBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-none" onClick={skipBack}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black px-6"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" className="rounded-none" onClick={skipForward}>
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-none" onClick={frameForward}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2 ml-4">
              <Button variant="outline" size="sm" className="rounded-none" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={changeVolume}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-4">
              {[0.25, 0.5, 1, 1.5, 2].map(rate => (
                <Button
                  key={rate}
                  variant={playbackRate === rate ? "default" : "outline"}
                  size="sm"
                  className={`rounded-none text-xs px-2 ${playbackRate === rate ? 'bg-[#00ffba] text-black' : ''}`}
                  onClick={() => changePlaybackRate(rate)}
                >
                  {rate}x
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clip adding modal */}
      {isAddingClip && (
        <Card className="rounded-none">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ονομασία clip..."
                value={clipLabel}
                onChange={(e) => setClipLabel(e.target.value)}
                className="flex-1 rounded-none h-9"
              />
              <Button
                className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                onClick={addClip}
              >
                Αποθήκευση
              </Button>
              <Button
                variant="outline"
                className="rounded-none"
                onClick={() => setIsAddingClip(false)}
              >
                Ακύρωση
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clips List */}
      {clips.length > 0 && (
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Film className="w-5 h-5" />
                Clips ({clips.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none"
                onClick={exportClipsInfo}
              >
                <Download className="w-4 h-4 mr-2" />
                Εξαγωγή
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clips.map((clip, index) => (
                <div 
                  key={clip.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-none hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="rounded-none">
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{clip.label}</p>
                      <p className="text-xs text-gray-500">
                        {formatTime(clip.startTime)} → {formatTime(clip.endTime)} 
                        <span className="ml-2 text-[#00ffba]">
                          ({formatTime(clip.endTime - clip.startTime)})
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none"
                      onClick={() => playClip(clip)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none text-red-500 hover:text-red-700"
                      onClick={() => removeClip(clip.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Flags Stats & List */}
      {actionFlags.length > 0 && (
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Στατιστικά Δράσης
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none text-red-500"
                onClick={() => {
                  setActionFlags([]);
                  setActiveFlag(null);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Καθαρισμός
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#00ffba]/10 border border-[#00ffba]/30 rounded-none text-center">
                <Swords className="w-5 h-5 mx-auto text-[#00ffba] mb-1" />
                <p className="text-xs text-gray-600">Επιθέσεις</p>
                <p className="text-lg font-bold text-[#00997a]">{actionStats.attackCount}</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-none text-center">
                <Shield className="w-5 h-5 mx-auto text-red-500 mb-1" />
                <p className="text-xs text-gray-600">Άμυνες</p>
                <p className="text-lg font-bold text-red-600">{actionStats.defenseCount}</p>
              </div>
              <div className="p-3 bg-[#00ffba]/10 border border-[#00ffba]/30 rounded-none text-center">
                <Clock className="w-5 h-5 mx-auto text-[#00ffba] mb-1" />
                <p className="text-xs text-gray-600">Χρόνος Επίθεσης</p>
                <p className="text-lg font-bold text-[#00997a]">{formatTime(actionStats.attackTime)}</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-none text-center">
                <Clock className="w-5 h-5 mx-auto text-red-500 mb-1" />
                <p className="text-xs text-gray-600">Χρόνος Άμυνας</p>
                <p className="text-lg font-bold text-red-600">{formatTime(actionStats.defenseTime)}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Συνολικός Χρόνος Δράσης: {formatTime(actionStats.totalActionTime)}</span>
                <span>
                  Επίθεση {actionStats.attackPercentage.toFixed(1)}% / Άμυνα {actionStats.defensePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 bg-gray-200 rounded-none overflow-hidden flex">
                <div 
                  className="h-full bg-[#00ffba]"
                  style={{ width: `${actionStats.attackPercentage}%` }}
                />
                <div 
                  className="h-full bg-red-500"
                  style={{ width: `${actionStats.defensePercentage}%` }}
                />
              </div>
            </div>

            {/* Flags List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {actionFlags.map((flag, index) => (
                <div 
                  key={flag.id}
                  className={`flex items-center justify-between p-2 rounded-none ${
                    flag.type === 'attack' 
                      ? 'bg-[#00ffba]/10 border border-[#00ffba]/30' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {flag.type === 'attack' ? (
                      <Swords className="w-4 h-4 text-[#00ffba]" />
                    ) : (
                      <Shield className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {flag.type === 'attack' ? 'Επίθεση' : 'Άμυνα'} #{index + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(flag.startTime)} → {flag.endTime ? formatTime(flag.endTime) : '...'}
                      {flag.endTime && (
                        <span className={`ml-2 font-medium ${
                          flag.type === 'attack' ? 'text-[#00997a]' : 'text-red-600'
                        }`}>
                          ({formatTime(flag.endTime - flag.startTime)})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none h-7 w-7 p-0"
                      onClick={() => seek(flag.startTime)}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      onClick={() => removeActionFlag(flag.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save & New Video Buttons */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-none"
          onClick={() => {
            if (videoUrl) URL.revokeObjectURL(videoUrl);
            setVideoFile(null);
            setVideoUrl(null);
            setClips([]);
            setActionFlags([]);
            setActiveFlag(null);
            setRoundMarkers([]);
            setActiveRound(null);
            setStrikeMarkers([]);
          }}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Νέο
        </Button>
        <Button
          onClick={saveFight}
          size="sm"
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Download className="w-4 h-4 mr-1" />
          Αποθήκευση Αγώνα
        </Button>
      </div>
    </div>
  );
};

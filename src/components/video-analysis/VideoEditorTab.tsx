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
  Users
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

type ActionType = 'attack' | 'defense';

interface ActionFlag {
  id: string;
  type: ActionType;
  startTime: number;
  endTime: number | null; // null αν δεν έχει κλείσει ακόμα
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
}

interface VideoEditorTabProps {
  userId: string;
}

export const VideoEditorTab: React.FC<VideoEditorTabProps> = ({ userId }) => {
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
  
  // Strike markers state
  const [strikeMarkers, setStrikeMarkers] = useState<StrikeMarker[]>([]);
  const [isStrikePopoverOpen, setIsStrikePopoverOpen] = useState(false);
  
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
    toast.success(`${type === 'attack' ? 'Επίθεση' : 'Άμυνα'} ξεκίνησε στο ${formatTime(currentTime)}`);
  };

  const closeActiveFlag = () => {
    if (!activeFlag) return;
    
    setActionFlags(prev => prev.map(flag => 
      flag.id === activeFlag.id 
        ? { ...flag, endTime: currentTime }
        : flag
    ));
    
    toast.success(`${activeFlag.type === 'attack' ? 'Επίθεση' : 'Άμυνα'} τελείωσε στο ${formatTime(currentTime)}`);
    setActiveFlag(null);
  };

  const removeActionFlag = (id: string) => {
    if (activeFlag?.id === id) {
      setActiveFlag(null);
    }
    setActionFlags(prev => prev.filter(f => f.id !== id));
  };

  // Calculate total action times
  const actionStats = useMemo(() => {
    const completedFlags = actionFlags.filter(f => f.endTime !== null);
    
    const attackFlags = completedFlags.filter(f => f.type === 'attack');
    const defenseFlags = completedFlags.filter(f => f.type === 'defense');
    
    const attackTime = attackFlags.reduce((sum, f) => sum + (f.endTime! - f.startTime), 0);
    const defenseTime = defenseFlags.reduce((sum, f) => sum + (f.endTime! - f.startTime), 0);
    const totalActionTime = attackTime + defenseTime;
    
    return {
      attackCount: attackFlags.length,
      defenseCount: defenseFlags.length,
      attackTime,
      defenseTime,
      totalActionTime,
      attackPercentage: totalActionTime > 0 ? (attackTime / totalActionTime) * 100 : 0,
      defensePercentage: totalActionTime > 0 ? (defenseTime / totalActionTime) * 100 : 0
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

  // Add strike marker at current time
  const addStrikeMarker = (strikeType: StrikeType) => {
    const owner = determineStrikeOwner(currentTime);
    
    const newMarker: StrikeMarker = {
      id: crypto.randomUUID(),
      strikeTypeId: strikeType.id,
      strikeTypeName: strikeType.name,
      strikeCategory: strikeType.category,
      strikeSide: strikeType.side,
      time: currentTime,
      owner
    };
    
    setStrikeMarkers(prev => [...prev, newMarker].sort((a, b) => a.time - b.time));
    setIsStrikePopoverOpen(false);
    toast.success(`${strikeType.name} (${owner === 'athlete' ? 'Αθλητής' : 'Αντίπαλος'}) στο ${formatTime(currentTime)}`);
  };

  // Remove strike marker
  const removeStrikeMarker = (id: string) => {
    setStrikeMarkers(prev => prev.filter(m => m.id !== id));
  };

  // Strike statistics
  const strikeStats = useMemo(() => {
    const athleteStrikes = strikeMarkers.filter(m => m.owner === 'athlete');
    const opponentStrikes = strikeMarkers.filter(m => m.owner === 'opponent');
    
    return {
      athleteTotal: athleteStrikes.length,
      opponentTotal: opponentStrikes.length,
      athleteByCategory: athleteStrikes.reduce((acc, m) => {
        acc[m.strikeCategory] = (acc[m.strikeCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      opponentByCategory: opponentStrikes.reduce((acc, m) => {
        acc[m.strikeCategory] = (acc[m.strikeCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
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

  if (!videoUrl) {
    return (
      <Card className="rounded-none">
        <CardContent className="py-12">
          <div className="text-center">
            <Film className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Video Editor</h3>
            <p className="text-gray-500 mb-6">
              Ανεβάστε ένα βίντεο για επεξεργασία και δημιουργία clips
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
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Upload className="w-4 h-4 mr-2" />
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
              className="w-full max-h-[50vh] object-contain"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onClick={togglePlay}
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
          
          {/* Timeline */}
          <div className="mt-4 space-y-2">
            {/* Action Flags Timeline */}
            <div className="relative h-6 bg-gray-100 rounded-none border border-gray-200">
              {/* Action flag markers */}
              {actionFlags.map((flag) => {
                const endTime = flag.endTime ?? currentTime;
                const isOpen = flag.endTime === null;
                return (
                  <div
                    key={flag.id}
                    className={`absolute h-full cursor-pointer transition-opacity hover:opacity-80 ${
                      flag.type === 'attack' 
                        ? 'bg-[#00ffba]/60 border-l-2 border-r-2 border-[#00ffba]' 
                        : 'bg-red-500/60 border-l-2 border-r-2 border-red-500'
                    } ${isOpen ? 'animate-pulse' : ''}`}
                    style={{ 
                      left: `${(flag.startTime / duration) * 100}%`,
                      width: `${((endTime - flag.startTime) / duration) * 100}%`,
                      minWidth: '4px'
                    }}
                    title={`${flag.type === 'attack' ? 'Επίθεση' : 'Άμυνα'}: ${formatTime(flag.startTime)} - ${flag.endTime ? formatTime(flag.endTime) : 'σε εξέλιξη'}`}
                    onClick={() => seek(flag.startTime)}
                  >
                    <Flag className={`w-3 h-3 absolute -top-0.5 -left-1.5 ${
                      flag.type === 'attack' ? 'text-[#00ffba]' : 'text-red-500'
                    }`} />
                  </div>
                );
              })}
              
              {/* Strike markers */}
              {strikeMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className={`absolute w-2 h-2 rounded-full cursor-pointer z-20 transform -translate-x-1/2 top-1/2 -translate-y-1/2 ${
                    marker.owner === 'athlete' ? 'bg-[#00ffba] border border-[#00997a]' : 'bg-[#cb8954] border border-[#a06b3d]'
                  }`}
                  style={{ left: `${(marker.time / duration) * 100}%` }}
                  title={`${marker.strikeTypeName} (${marker.owner === 'athlete' ? 'Αθλητής' : 'Αντίπαλος'}) - ${formatTime(marker.time)}`}
                  onClick={() => seek(marker.time)}
                />
              ))}
              
              {/* Current position indicator */}
              <div 
                className="absolute w-0.5 h-full bg-black z-10"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            {/* Trim markers on timeline */}
            <div className="relative h-2 bg-gray-200 rounded-none">
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
            
            {/* Seek slider */}
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
          
          {/* Action Flags Controls */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Σήμανση Δράσης</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Attack button */}
                {activeFlag?.type === 'attack' ? (
                  <Button
                    size="sm"
                    className="rounded-none bg-[#00ffba] text-black animate-pulse"
                    onClick={closeActiveFlag}
                  >
                    <Swords className="w-4 h-4 mr-2" />
                    Τέλος Επίθεσης
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba] hover:text-black"
                    onClick={() => startActionFlag('attack')}
                    disabled={activeFlag !== null}
                  >
                    <Swords className="w-4 h-4 mr-2" />
                    Επίθεση
                  </Button>
                )}
                
                {/* Defense button */}
                {activeFlag?.type === 'defense' ? (
                  <Button
                    size="sm"
                    className="rounded-none bg-red-500 text-white animate-pulse"
                    onClick={closeActiveFlag}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Τέλος Άμυνας
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    onClick={() => startActionFlag('defense')}
                    disabled={activeFlag !== null}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Άμυνα
                  </Button>
                )}
              </div>
            </div>
            
            {/* Active flag indicator */}
            {activeFlag && (
              <div className={`mt-2 p-2 text-sm ${
                activeFlag.type === 'attack' ? 'bg-[#00ffba]/20 text-[#00997a]' : 'bg-red-100 text-red-700'
              }`}>
                ⏱️ {activeFlag.type === 'attack' ? 'Επίθεση' : 'Άμυνα'} σε εξέλιξη... 
                Πάτησε "{activeFlag.type === 'attack' ? 'Τέλος Επίθεσης' : 'Τέλος Άμυνας'}" για να κλείσεις.
              </div>
            )}
          </div>
          
          {/* Strike Controls */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Χτυπήματα</span>
                <div className="flex items-center gap-1 text-xs">
                  <Badge variant="outline" className="rounded-none bg-[#00ffba]/10 text-[#00997a]">
                    <User className="w-3 h-3 mr-1" />
                    Αθλητής: {strikeStats.athleteTotal}
                  </Badge>
                  <Badge variant="outline" className="rounded-none bg-[#cb8954]/10 text-[#cb8954]">
                    <Users className="w-3 h-3 mr-1" />
                    Αντίπαλος: {strikeStats.opponentTotal}
                  </Badge>
                </div>
              </div>
              
              <Popover open={isStrikePopoverOpen} onOpenChange={setIsStrikePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    className="rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white"
                    disabled={strikeTypes.length === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Προσθήκη Χτυπήματος
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 rounded-none" align="end">
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {strikeTypesLoading ? (
                      <p className="text-sm text-gray-500 p-2">Φόρτωση...</p>
                    ) : strikeTypes.length === 0 ? (
                      <p className="text-sm text-gray-500 p-2">Δεν υπάρχουν χτυπήματα. Δημιουργήστε από τις ρυθμίσεις.</p>
                    ) : (
                      strikeTypes.map((strike) => (
                        <Button
                          key={strike.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start rounded-none text-left"
                          onClick={() => addStrikeMarker(strike)}
                        >
                          <Target className="w-3 h-3 mr-2" />
                          <span className="truncate">{strike.name}</span>
                          <span className="ml-auto text-xs text-gray-400">
                            {categoryLabels[strike.category]}
                          </span>
                        </Button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Legend */}
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#00ffba]" />
                Επίθεση = Χτύπημα Αθλητή
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#cb8954]" />
                Άμυνα = Χτύπημα Αντιπάλου
              </span>
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

      {/* Trim Controls */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scissors className="w-5 h-5" />
            Κοπή & Clips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trim Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-sm text-gray-500">Αρχή</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-none font-mono">
                    {formatTime(trimStart)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    onClick={setTrimStartToCurrent}
                  >
                    Τρέχον
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-sm text-gray-500">Τέλος</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-none font-mono">
                    {formatTime(trimEnd)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    onClick={setTrimEndToCurrent}
                  >
                    Τρέχον
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trim Range Slider */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-500">Εύρος κοπής</Label>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 w-12">{formatTime(trimStart)}</span>
              <Slider
                value={[trimStart, trimEnd]}
                min={0}
                max={duration || 100}
                step={0.01}
                onValueChange={(values) => {
                  setTrimStart(values[0]);
                  setTrimEnd(values[1]);
                }}
                className="flex-1"
              />
              <span className="text-xs text-gray-400 w-12">{formatTime(trimEnd)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              Διάρκεια: {formatTime(trimEnd - trimStart)}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-none"
              onClick={previewTrim}
            >
              <Play className="w-4 h-4 mr-2" />
              Προεπισκόπηση
            </Button>
            
            {!isAddingClip ? (
              <Button
                className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                onClick={() => setIsAddingClip(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Προσθήκη Clip
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ονομασία clip..."
                  value={clipLabel}
                  onChange={(e) => setClipLabel(e.target.value)}
                  className="w-40 rounded-none h-9"
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
            )}
            
            <Button
              variant="outline"
              className="rounded-none"
              onClick={() => {
                setTrimStart(0);
                setTrimEnd(duration);
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Export Section */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <Label className="text-sm font-medium">Εξαγωγή Βίντεο</Label>
            
            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Επεξεργασία βίντεο...</span>
                </div>
                <Progress value={exportProgress} className="h-2" />
                <p className="text-xs text-gray-500">{exportProgress}% ολοκληρώθηκε</p>
              </div>
            )}

            {!isExporting && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-none"
                  onClick={async () => {
                    if (!videoFile) return;
                    if (trimStart >= trimEnd) {
                      toast.error('Ορίστε έγκυρο εύρος κοπής');
                      return;
                    }
                    
                    if (!isFFmpegReady) {
                      toast.info('Φόρτωση FFmpeg... Περιμένετε');
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Κατέβασμα Trim
                </Button>

                {clips.length > 0 && (
                  <Button
                    className="rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white"
                    onClick={async () => {
                      if (!videoFile) return;
                      
                      if (!isFFmpegReady) {
                        toast.info('Φόρτωση FFmpeg... Περιμένετε');
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
                    {isFFmpegLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileVideo className="w-4 h-4 mr-2" />
                    )}
                    Συγχώνευση Clips ({clips.length})
                  </Button>
                )}
              </div>
            )}

            {!isFFmpegReady && !isFFmpegLoading && (
              <p className="text-xs text-gray-400">
                💡 Το FFmpeg θα φορτωθεί αυτόματα κατά την πρώτη εξαγωγή (~25MB)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* New Video Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          className="rounded-none"
          onClick={() => {
            if (videoUrl) URL.revokeObjectURL(videoUrl);
            setVideoFile(null);
            setVideoUrl(null);
            setClips([]);
            setActionFlags([]);
            setActiveFlag(null);
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Νέο Βίντεο
        </Button>
      </div>
    </div>
  );
};

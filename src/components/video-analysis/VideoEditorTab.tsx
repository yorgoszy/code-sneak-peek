import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  FileVideo
} from 'lucide-react';
import { toast } from 'sonner';
import { useVideoExport } from '@/hooks/useVideoExport';

interface TrimClip {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
}

interface VideoEditorTabProps {
  userId: string;
}

export const VideoEditorTab: React.FC<VideoEditorTabProps> = ({ userId }) => {
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
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
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
              accept="video/*"
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
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Νέο Βίντεο
        </Button>
      </div>
    </div>
  );
};

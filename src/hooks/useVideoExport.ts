import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { toast } from 'sonner';

interface ExportOptions {
  startTime: number;
  endTime: number;
  filename?: string;
}

export const useVideoExport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Load FFmpeg
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current && isReady) return true;
    
    setIsLoading(true);
    try {
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      // Load FFmpeg core from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setIsReady(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      toast.error('Αποτυχία φόρτωσης FFmpeg');
      setIsLoading(false);
      return false;
    }
  }, [isReady]);

  // Export trimmed video
  const exportTrimmedVideo = useCallback(async (
    videoFile: File,
    options: ExportOptions
  ): Promise<Blob | null> => {
    const { startTime, endTime, filename } = options;
    
    if (!ffmpegRef.current) {
      const loaded = await loadFFmpeg();
      if (!loaded) return null;
    }

    const ffmpeg = ffmpegRef.current!;
    setIsExporting(true);
    setProgress(0);

    try {
      // Get file extension
      const ext = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
      const inputName = `input.${ext}`;
      const outputName = filename || `trimmed_${Date.now()}.${ext}`;

      // Write input file to FFmpeg filesystem
      const fileData = await fetchFile(videoFile);
      await ffmpeg.writeFile(inputName, fileData);

      // Calculate duration
      const duration = endTime - startTime;

      // Run FFmpeg trim command
      // Using -ss before -i for faster seeking, -t for duration
      await ffmpeg.exec([
        '-ss', startTime.toFixed(3),
        '-i', inputName,
        '-t', duration.toFixed(3),
        '-c', 'copy', // Copy streams without re-encoding (fast)
        '-avoid_negative_ts', 'make_zero',
        outputName
      ]);

      // Read output file
      const data = await ffmpeg.readFile(outputName);
      
      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      // Create blob - handle Uint8Array properly
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: videoFile.type || 'video/mp4' });
      
      setIsExporting(false);
      setProgress(100);
      
      return blob;
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Αποτυχία εξαγωγής βίντεο');
      setIsExporting(false);
      return null;
    }
  }, [loadFFmpeg]);

  // Export multiple clips and merge them
  const exportMergedClips = useCallback(async (
    videoFile: File,
    clips: Array<{ startTime: number; endTime: number; label: string }>
  ): Promise<Blob | null> => {
    if (clips.length === 0) {
      toast.error('Δεν υπάρχουν clips για εξαγωγή');
      return null;
    }

    if (!ffmpegRef.current) {
      const loaded = await loadFFmpeg();
      if (!loaded) return null;
    }

    const ffmpeg = ffmpegRef.current!;
    setIsExporting(true);
    setProgress(0);

    try {
      const ext = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
      const inputName = `input.${ext}`;
      const outputName = `merged_${Date.now()}.${ext}`;

      // Write input file
      const fileData = await fetchFile(videoFile);
      await ffmpeg.writeFile(inputName, fileData);

      // Create individual clip files
      const clipFiles: string[] = [];
      
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const clipName = `clip_${i}.${ext}`;
        const duration = clip.endTime - clip.startTime;

        await ffmpeg.exec([
          '-ss', clip.startTime.toFixed(3),
          '-i', inputName,
          '-t', duration.toFixed(3),
          '-c', 'copy',
          '-avoid_negative_ts', 'make_zero',
          clipName
        ]);

        clipFiles.push(clipName);
        setProgress(Math.round((i + 1) / clips.length * 50)); // First 50% for trimming
      }

      // Create concat file list
      const concatList = clipFiles.map(f => `file '${f}'`).join('\n');
      await ffmpeg.writeFile('concat.txt', concatList);

      // Merge clips
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        outputName
      ]);

      setProgress(90);

      // Read output
      const data = await ffmpeg.readFile(outputName);

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile('concat.txt');
      for (const clipFile of clipFiles) {
        await ffmpeg.deleteFile(clipFile);
      }
      await ffmpeg.deleteFile(outputName);

      // Create blob - handle Uint8Array properly
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: videoFile.type || 'video/mp4' });
      
      setIsExporting(false);
      setProgress(100);
      
      return blob;
    } catch (error) {
      console.error('Merge export failed:', error);
      toast.error('Αποτυχία συγχώνευσης clips');
      setIsExporting(false);
      return null;
    }
  }, [loadFFmpeg]);

  // Merge multiple video FILES into one blob (for multi-video playback fix)
  const mergeVideoFiles = useCallback(async (
    videoFiles: File[]
  ): Promise<Blob | null> => {
    if (videoFiles.length === 0) {
      return null;
    }
    if (videoFiles.length === 1) {
      // Single file, just return it as blob
      return videoFiles[0];
    }

    // Load FFmpeg if not already loaded
    if (!ffmpegRef.current) {
      const loaded = await loadFFmpeg();
      if (!loaded) {
        console.error('[mergeVideoFiles] Failed to load FFmpeg');
        return null;
      }
    }

    const ffmpeg = ffmpegRef.current!;
    setIsExporting(true);
    setProgress(0);

    try {
      const inputNames: string[] = [];

      // Write all input files
      for (let i = 0; i < videoFiles.length; i++) {
        const file = videoFiles[i];
        const inputName = `input_${i}.mp4`; // Force mp4 extension for consistency
        const fileData = await fetchFile(file);
        await ffmpeg.writeFile(inputName, fileData);
        inputNames.push(inputName);
        setProgress(Math.round((i + 1) / videoFiles.length * 20));
      }

      // Re-encode each to ensure compatible streams with explicit settings
      const intermediateNames: string[] = [];
      for (let i = 0; i < inputNames.length; i++) {
        const intermediateName = `intermediate_${i}.mp4`;
        
        // Force consistent resolution, framerate, and codec for browser compatibility
        await ffmpeg.exec([
          '-i', inputNames[i],
          '-c:v', 'libx264',
          '-profile:v', 'baseline', // Most compatible H.264 profile
          '-level', '3.0',
          '-pix_fmt', 'yuv420p', // Required for browser playback
          '-preset', 'ultrafast',
          '-crf', '23',
          '-r', '30', // Force 30fps for consistency
          '-c:a', 'aac',
          '-ar', '44100', // Consistent audio sample rate
          '-ac', '2', // Stereo audio
          '-b:a', '128k',
          '-movflags', '+faststart',
          '-y', // Overwrite if exists
          intermediateName
        ]);
        
        intermediateNames.push(intermediateName);
        setProgress(20 + Math.round((i + 1) / inputNames.length * 50));
      }

      // Create concat list
      const concatList = intermediateNames.map(f => `file '${f}'`).join('\n');
      await ffmpeg.writeFile('concat.txt', concatList);

      const outputName = `merged_${Date.now()}.mp4`;

      // Concat with stream copy since we've normalized everything
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        '-movflags', '+faststart', // Important for web playback
        '-y',
        outputName
      ]);

      setProgress(90);

      const data = await ffmpeg.readFile(outputName);
      
      // Validate output size
      if (!data || (data as Uint8Array).length === 0) {
        throw new Error('FFmpeg produced empty output');
      }

      console.log('[mergeVideoFiles] Success, output size:', (data as Uint8Array).length);

      // Cleanup
      for (const name of inputNames) {
        try { await ffmpeg.deleteFile(name); } catch { /* ignore */ }
      }
      for (const name of intermediateNames) {
        try { await ffmpeg.deleteFile(name); } catch { /* ignore */ }
      }
      try { await ffmpeg.deleteFile('concat.txt'); } catch { /* ignore */ }
      try { await ffmpeg.deleteFile(outputName); } catch { /* ignore */ }

      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });

      setIsExporting(false);
      setProgress(100);

      return blob;
    } catch (error) {
      console.error('[mergeVideoFiles] Failed:', error);
      toast.error('Αποτυχία ένωσης βίντεο - δοκίμασε MP4 (H.264)');
      setIsExporting(false);
      return null;
    }
  }, [loadFFmpeg]);

  // Download blob as file
  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Το βίντεο αποθηκεύτηκε');
  }, []);

  return {
    isLoading,
    isExporting,
    progress,
    isReady,
    loadFFmpeg,
    exportTrimmedVideo,
    exportMergedClips,
    mergeVideoFiles,
    downloadBlob,
  };
};

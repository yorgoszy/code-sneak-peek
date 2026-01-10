import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseVideoRecordingOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
}

export const useVideoRecording = (options: UseVideoRecordingOptions = {}) => {
  const {
    mimeType = 'video/webm;codecs=vp9',
    videoBitsPerSecond = 2500000, // 2.5 Mbps
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check if recording is supported
  const isSupported = useCallback(() => {
    return typeof MediaRecorder !== 'undefined' && 
           MediaRecorder.isTypeSupported(mimeType);
  }, [mimeType]);

  // Start recording from a video element or canvas
  const startRecording = useCallback((source: HTMLVideoElement | HTMLCanvasElement) => {
    if (!isSupported()) {
      toast.error('Η εγγραφή βίντεο δεν υποστηρίζεται σε αυτόν τον browser');
      return false;
    }

    try {
      let stream: MediaStream;

      if (source instanceof HTMLCanvasElement) {
        // Record from canvas
        stream = source.captureStream(30); // 30 fps
      } else {
        // Record from video element
        const videoStream = (source as any).srcObject as MediaStream;
        if (!videoStream) {
          toast.error('Δεν βρέθηκε stream βίντεο');
          return false;
        }
        stream = videoStream;
      }

      // Reset state
      chunksRef.current = [];
      setRecordedBlob(null);
      setPreviewUrl(null);
      setRecordingDuration(0);

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond,
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        
        // Create preview URL
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        // Clear duration interval
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      recorder.onerror = (event: any) => {
        console.error('Recording error:', event.error);
        toast.error('Σφάλμα εγγραφής');
        setIsRecording(false);
      };

      // Start recording
      recorder.start(1000); // Collect data every second
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Track duration
      durationIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Αποτυχία έναρξης εγγραφής');
      return false;
    }
  }, [isSupported, mimeType, videoBitsPerSecond]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return true;
    }
    return false;
  }, [isRecording]);

  // Download recorded video
  const downloadRecording = useCallback((filename: string = 'workout-recording') => {
    if (!recordedBlob) {
      toast.error('Δεν υπάρχει εγγραφή για λήψη');
      return false;
    }

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Η εγγραφή αποθηκεύτηκε');
    return true;
  }, [recordedBlob]);

  // Clear recording
  const clearRecording = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingDuration(0);
    chunksRef.current = [];
  }, [previewUrl]);

  // Get recording size in MB
  const getRecordingSize = useCallback(() => {
    if (!recordedBlob) return 0;
    return (recordedBlob.size / (1024 * 1024)).toFixed(2);
  }, [recordedBlob]);

  // Format duration as MM:SS
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording,
    recordedBlob,
    recordingDuration,
    previewUrl,
    isSupported,
    startRecording,
    stopRecording,
    downloadRecording,
    clearRecording,
    getRecordingSize,
    formatDuration,
  };
};

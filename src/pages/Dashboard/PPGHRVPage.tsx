import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Camera, Play, Square, RotateCcw, Menu, Activity, TrendingUp, Zap, AlertCircle, Lightbulb, Info } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { CoachSidebar } from '@/components/CoachSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeartbeatData {
  timestamp: number;
  redValue: number;
}

interface PPGResult {
  id: string;
  bpm: number;
  hrv: number; // RMSSD in ms
  confidence: number;
  timestamp: Date;
}

// Moving average filter
const movingAverage = (data: number[], windowSize: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    result.push(window.reduce((a, b) => a + b, 0) / window.length);
  }
  return result;
};

// Peak detection algorithm
const findPeaks = (data: number[], minDistance: number = 15): number[] => {
  const peaks: number[] = [];
  
  for (let i = 2; i < data.length - 2; i++) {
    // Check if it's a local maximum
    if (data[i] > data[i - 1] && 
        data[i] > data[i + 1] && 
        data[i] > data[i - 2] && 
        data[i] > data[i + 2]) {
      
      // Check minimum distance from last peak
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
        peaks.push(i);
      }
    }
  }
  
  return peaks;
};

// Calculate RMSSD for HRV
const calculateRMSSD = (rrIntervals: number[]): number => {
  if (rrIntervals.length < 2) return 0;
  
  let sumSquaredDiffs = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    const diff = rrIntervals[i] - rrIntervals[i - 1];
    sumSquaredDiffs += diff * diff;
  }
  
  return Math.sqrt(sumSquaredDiffs / (rrIntervals.length - 1));
};

const PPGHRVPage = () => {
  const { isAdmin } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Camera and canvas refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // State
  const [isActive, setIsActive] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [measurementProgress, setMeasurementProgress] = useState(0);
  const [currentBPM, setCurrentBPM] = useState<number | null>(null);
  const [currentHRV, setCurrentHRV] = useState<number | null>(null);
  const [signalQuality, setSignalQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('poor');
  const [results, setResults] = useState<PPGResult[]>([]);
  const [fingerDetected, setFingerDetected] = useState(false);
  
  // Data collection
  const dataBuffer = useRef<HeartbeatData[]>([]);
  const measurementStartTime = useRef<number>(0);
  const MEASUREMENT_DURATION = 30000; // 30 seconds
  const SAMPLE_RATE = 30; // fps target
  
  // Enable flash/torch for better signal
  const enableFlash = async (stream: MediaStream) => {
    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: true } as any]
        });
        setFlashEnabled(true);
        console.log('📸 Flash enabled');
      } else {
        console.log('⚠️ Flash not available on this device');
        toast.info('Το flash δεν είναι διαθέσιμο. Χρησιμοποιήστε καλό φωτισμό.');
      }
    } catch (error) {
      console.error('Flash error:', error);
    }
  };
  
  // Start camera
  const startCamera = async () => {
    try {
      // Request rear camera for finger placement
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 60 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        streamRef.current = stream;
        setIsActive(true);
        
        // Try to enable flash
        await enableFlash(stream);
        
        toast.success('Κάμερα ενεργοποιήθηκε. Τοποθετήστε το δάχτυλο στον φακό.');
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Σφάλμα κάμερας. Βεβαιωθείτε ότι έχετε δώσει άδεια.');
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsActive(false);
    setIsMeasuring(false);
    setFlashEnabled(false);
  };
  
  // Extract red channel average from frame
  const extractRedChannel = (canvas: HTMLCanvasElement, video: HTMLVideoElement): number => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0;
    
    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data from center region (where finger should be)
    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);
    const regionSize = Math.min(canvas.width, canvas.height) / 3;
    
    const startX = Math.floor(centerX - regionSize / 2);
    const startY = Math.floor(centerY - regionSize / 2);
    
    const imageData = ctx.getImageData(startX, startY, regionSize, regionSize);
    const data = imageData.data;
    
    let redSum = 0;
    let greenSum = 0;
    let blueSum = 0;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      redSum += data[i];
      greenSum += data[i + 1];
      blueSum += data[i + 2];
    }
    
    const avgRed = redSum / pixelCount;
    const avgGreen = greenSum / pixelCount;
    const avgBlue = blueSum / pixelCount;
    
    // Finger detection: high red, low blue, sufficient brightness
    const isFingerPresent = avgRed > 100 && avgRed > avgBlue * 1.5 && avgRed > avgGreen * 1.2;
    setFingerDetected(isFingerPresent);
    
    // Calculate signal quality based on color ratio
    if (!isFingerPresent) {
      setSignalQuality('poor');
    } else {
      const redRatio = avgRed / (avgGreen + avgBlue + 1);
      if (redRatio > 2.5) setSignalQuality('excellent');
      else if (redRatio > 2.0) setSignalQuality('good');
      else if (redRatio > 1.5) setSignalQuality('fair');
      else setSignalQuality('poor');
    }
    
    return avgRed;
  };
  
  // Draw PPG waveform
  const drawWaveform = (canvas: HTMLCanvasElement, data: HeartbeatData[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || data.length < 2) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Get last 200 samples for display
    const displayData = data.slice(-200);
    if (displayData.length < 2) return;
    
    // Normalize data
    const values = displayData.map(d => d.redValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw waveform
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    displayData.forEach((point, index) => {
      const x = (index / (displayData.length - 1)) * width;
      const y = height - ((point.redValue - min) / range) * height * 0.8 - height * 0.1;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  };
  
  // Process collected data and calculate HR/HRV
  const processData = useCallback(() => {
    if (dataBuffer.current.length < 60) {
      toast.error('Δεν συλλέχθηκαν αρκετά δεδομένα');
      return;
    }
    
    const data = dataBuffer.current;
    const values = data.map(d => d.redValue);
    const timestamps = data.map(d => d.timestamp);
    
    // Apply smoothing filter
    const smoothed = movingAverage(values, 5);
    
    // Detect peaks (heartbeats)
    const peaks = findPeaks(smoothed, 10);
    
    if (peaks.length < 3) {
      toast.error('Δεν εντοπίστηκαν αρκετοί καρδιακοί παλμοί. Δοκιμάστε ξανά.');
      return;
    }
    
    // Calculate RR intervals
    const rrIntervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = timestamps[peaks[i]] - timestamps[peaks[i - 1]];
      // Filter out unrealistic intervals (too fast or too slow)
      if (interval > 300 && interval < 2000) {
        rrIntervals.push(interval);
      }
    }
    
    if (rrIntervals.length < 2) {
      toast.error('Μη έγκυρα δεδομένα καρδιακού ρυθμού');
      return;
    }
    
    // Calculate BPM
    const avgRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
    const bpm = Math.round(60000 / avgRR);
    
    // Calculate HRV (RMSSD)
    const hrv = calculateRMSSD(rrIntervals);
    
    // Calculate confidence based on signal quality and consistency
    const rrStdDev = Math.sqrt(rrIntervals.reduce((sum, rr) => sum + Math.pow(rr - avgRR, 2), 0) / rrIntervals.length);
    const cvRR = (rrStdDev / avgRR) * 100;
    let confidence = Math.max(0, Math.min(100, 100 - cvRR * 2));
    
    // Validate results
    if (bpm < 40 || bpm > 200) {
      toast.error('Μη ρεαλιστικός καρδιακός ρυθμός. Δοκιμάστε ξανά.');
      return;
    }
    
    const result: PPGResult = {
      id: Date.now().toString(),
      bpm,
      hrv: Math.round(hrv),
      confidence: Math.round(confidence),
      timestamp: new Date()
    };
    
    setCurrentBPM(bpm);
    setCurrentHRV(Math.round(hrv));
    setResults(prev => [result, ...prev]);
    
    toast.success(`HR: ${bpm} bpm | HRV: ${Math.round(hrv)} ms`);
  }, []);
  
  // Start measurement
  const startMeasurement = useCallback(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) {
      toast.error('Η κάμερα δεν είναι ενεργή');
      return;
    }
    
    if (!fingerDetected) {
      toast.warning('Τοποθετήστε το δάχτυλο στον φακό της κάμερας');
      return;
    }
    
    setIsMeasuring(true);
    dataBuffer.current = [];
    measurementStartTime.current = performance.now();
    setMeasurementProgress(0);
    setCurrentBPM(null);
    setCurrentHRV(null);
    
    toast.info('Κρατήστε το δάχτυλο σταθερά για 30 δευτερόλεπτα...');
    
    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const elapsed = performance.now() - measurementStartTime.current;
      const progress = Math.min(100, (elapsed / MEASUREMENT_DURATION) * 100);
      setMeasurementProgress(progress);
      
      // Extract red channel value
      const redValue = extractRedChannel(canvasRef.current, videoRef.current);
      
      dataBuffer.current.push({
        timestamp: performance.now(),
        redValue
      });
      
      // Draw waveform
      if (overlayCanvasRef.current) {
        drawWaveform(overlayCanvasRef.current, dataBuffer.current);
      }
      
      // Check if measurement is complete
      if (elapsed >= MEASUREMENT_DURATION) {
        setIsMeasuring(false);
        processData();
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };
    
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isActive, fingerDetected, processData]);
  
  // Stop measurement
  const stopMeasurement = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsMeasuring(false);
    setMeasurementProgress(0);
    
    // Process whatever data we have
    if (dataBuffer.current.length > 60) {
      processData();
    }
  };
  
  // Reset
  const handleReset = () => {
    stopMeasurement();
    dataBuffer.current = [];
    setCurrentBPM(null);
    setCurrentHRV(null);
    setMeasurementProgress(0);
    setResults([]);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  // Render sidebar
  const renderSidebar = () => {
    if (isAdmin) {
      return (
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
      );
    }
    return (
      <CoachSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
    );
  };
  
  // Get signal quality color
  const getSignalColor = () => {
    switch (signalQuality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-green-400';
      case 'fair': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };
  
  // Get HRV interpretation
  const getHRVInterpretation = (hrv: number | null) => {
    if (!hrv) return null;
    if (hrv > 100) return { text: 'Εξαιρετική ανάκαμψη', color: 'text-green-500' };
    if (hrv > 60) return { text: 'Καλή ανάκαμψη', color: 'text-green-400' };
    if (hrv > 30) return { text: 'Μέτρια ανάκαμψη', color: 'text-yellow-500' };
    return { text: 'Χαμηλή ανάκαμψη', color: 'text-red-500' };
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          {renderSidebar()}
        </div>
        
        {/* Mobile/Tablet sidebar overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative w-64 h-full">
              {renderSidebar()}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobileOpen(true)}
                  className="rounded-none"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  PPG HRV
                </h1>
              </div>
              {currentBPM && (
                <div className="flex items-center gap-2 text-red-500">
                  <Heart className="h-4 w-4 animate-pulse" />
                  <span className="font-bold">{currentBPM} bpm</span>
                </div>
              )}
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
              {/* Header - Desktop */}
              <div className="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                    <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                    PPG Heart Rate & HRV
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Μέτρηση καρδιακού παλμού και μεταβλητότητας με την κάμερα
                  </p>
                </div>
                
                {currentBPM && (
                  <Card className="rounded-none bg-red-500/10 border-red-500/30">
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                      <Heart className="h-5 w-5 text-red-500 animate-pulse" />
                      <div>
                        <p className="text-xs text-muted-foreground">Καρδιακός Παλμός</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-500">{currentBPM} bpm</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Instructions Card */}
              <Card className="rounded-none bg-amber-500/10 border-amber-500/30">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-600">Οδηγίες χρήσης:</p>
                      <ol className="list-decimal list-inside mt-1 space-y-1 text-muted-foreground">
                        <li>Τοποθετήστε το δάχτυλο στον φακό της πίσω κάμερας</li>
                        <li>Καλύψτε εντελώς τον φακό και το flash</li>
                        <li>Κρατήστε σταθερά για 30 δευτερόλεπτα</li>
                        <li>Αποφύγετε κινήσεις κατά τη μέτρηση</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Camera View */}
                <div className="lg:col-span-2">
                  <Card className="rounded-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                        <span className="flex items-center gap-2">
                          <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                          Κάμερα PPG
                        </span>
                        {flashEnabled && (
                          <Badge className="rounded-none bg-yellow-500">
                            <Lightbulb className="h-3 w-3 mr-1" />
                            Flash On
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-4">
                      <div className="relative bg-black rounded-none overflow-hidden mx-auto" style={{ aspectRatio: '4/3', maxHeight: '50vh' }}>
                        <video
                          ref={videoRef}
                          className="absolute inset-0 w-full h-full object-cover"
                          playsInline
                          muted
                        />
                        
                        <canvas
                          ref={canvasRef}
                          className="hidden"
                          width={320}
                          height={240}
                        />
                        
                        {/* Waveform overlay */}
                        {isMeasuring && (
                          <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/80">
                            <canvas
                              ref={overlayCanvasRef}
                              className="w-full h-full"
                              width={400}
                              height={100}
                            />
                          </div>
                        )}

                        {!isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                            <Button
                              onClick={startCamera}
                              className="rounded-none bg-red-500 text-white hover:bg-red-600"
                              size="lg"
                            >
                              <Camera className="mr-2 h-5 w-5" />
                              Ενεργοποίηση Κάμερας
                            </Button>
                          </div>
                        )}

                        {/* Status badges */}
                        {isActive && (
                          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge className={`rounded-none ${fingerDetected ? 'bg-green-500' : 'bg-red-500'}`}>
                                {fingerDetected ? '✓ Δάχτυλο' : '✗ Τοποθετήστε δάχτυλο'}
                              </Badge>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge className={`rounded-none ${getSignalColor()}`}>
                                      {signalQuality.toUpperCase()}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ποιότητα σήματος PPG</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            
                            {isMeasuring && (
                              <Badge className="rounded-none bg-red-500 animate-pulse">
                                <Heart className="h-3 w-3 mr-1" />
                                Μέτρηση...
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Progress bar */}
                        {isMeasuring && (
                          <div className="absolute bottom-28 left-4 right-4">
                            <Progress value={measurementProgress} className="h-2 rounded-none" />
                            <p className="text-white text-xs text-center mt-1">
                              {Math.round(measurementProgress)}% - {Math.round((100 - measurementProgress) * 0.3)} δευτ.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {isActive && !isMeasuring && (
                          <Button
                            onClick={startMeasurement}
                            className="rounded-none bg-red-500 text-white hover:bg-red-600 flex-1"
                            disabled={!fingerDetected || signalQuality === 'poor'}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Έναρξη Μέτρησης
                          </Button>
                        )}
                        
                        {isMeasuring && (
                          <Button
                            onClick={stopMeasurement}
                            variant="destructive"
                            className="rounded-none flex-1"
                          >
                            <Square className="mr-2 h-4 w-4" />
                            Διακοπή
                          </Button>
                        )}
                        
                        {isActive && (
                          <Button
                            onClick={handleReset}
                            variant="outline"
                            className="rounded-none"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {isActive && (
                          <Button
                            onClick={stopCamera}
                            variant="outline"
                            className="rounded-none"
                          >
                            Κλείσιμο
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Results Panel */}
                <div className="space-y-4">
                  {/* Current Results */}
                  <Card className="rounded-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Τρέχουσα Μέτρηση
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Heart Rate */}
                      <div className="text-center p-4 bg-red-500/10 rounded-none">
                        <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-4xl font-bold text-red-500">
                          {currentBPM ?? '--'}
                        </p>
                        <p className="text-xs text-muted-foreground">BPM</p>
                      </div>
                      
                      {/* HRV */}
                      <div className="text-center p-4 bg-primary/10 rounded-none">
                        <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-4xl font-bold text-primary">
                          {currentHRV ?? '--'}
                        </p>
                        <p className="text-xs text-muted-foreground">HRV (RMSSD ms)</p>
                        {currentHRV && (
                          <p className={`text-xs mt-1 ${getHRVInterpretation(currentHRV)?.color}`}>
                            {getHRVInterpretation(currentHRV)?.text}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* History */}
                  <Card className="rounded-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Ιστορικό
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {results.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Δεν υπάρχουν μετρήσεις
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {results.map((result) => (
                            <div
                              key={result.id}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded-none text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span className="font-medium">{result.bpm} bpm</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{result.hrv} ms</span>
                                <Badge variant="outline" className="rounded-none text-xs">
                                  {result.confidence}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Info Card */}
                  <Card className="rounded-none bg-blue-500/10 border-blue-500/30">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2 text-xs">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div className="text-muted-foreground">
                          <p className="font-medium text-blue-500 mb-1">Τι είναι το HRV;</p>
                          <p>
                            Η Μεταβλητότητα Καρδιακού Ρυθμού (HRV) μετρά τη διακύμανση 
                            μεταξύ διαδοχικών καρδιακών παλμών. Υψηλότερο HRV συνήθως 
                            υποδεικνύει καλύτερη ανάκαμψη και προσαρμοστικότητα.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PPGHRVPage;

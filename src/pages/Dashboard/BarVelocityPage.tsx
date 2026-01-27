import { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Camera, Play, Square, RotateCcw, Activity, TrendingUp, Zap, Target, Ruler, Check, X, Menu } from "lucide-react";
import { CameraZoomControl } from "@/components/CameraZoomControl";
import { toast } from "sonner";

interface VelocityResult {
  id: number;
  peakVelocity: number; // m/s
  avgVelocity: number; // m/s
  displacement: number; // cm
  timestamp: Date;
}

interface MarkerPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface CalibrationPoint {
  x: number;
  y: number;
}

const BarVelocityPage = () => {
  const { isAdmin } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const calibrationCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const positionsRef = useRef<MarkerPosition[]>([]);
  
  const [isActive, setIsActive] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [markerColor, setMarkerColor] = useState<'red' | 'green' | 'blue' | 'yellow'>('red');
  const [zoom, setZoom] = useState(1);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [results, setResults] = useState<VelocityResult[]>([]);
  const [currentVelocity, setCurrentVelocity] = useState<number | null>(null);
  const [pixelsPerCm, setPixelsPerCm] = useState(5); // Default estimate
  
  // Calibration state
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([]);
  const [knownDistanceCm, setKnownDistanceCm] = useState<string>('220');

  // Color ranges for detection (HSV-like thresholds)
  const colorRanges: Record<string, { hMin: number; hMax: number; sMin: number; sMax: number; vMin: number; vMax: number; hMin2?: number; hMax2?: number }> = {
    red: { hMin: 0, hMax: 10, sMin: 100, sMax: 255, vMin: 100, vMax: 255, hMin2: 160, hMax2: 180 },
    green: { hMin: 35, hMax: 85, sMin: 100, sMax: 255, vMin: 100, vMax: 255 },
    blue: { hMin: 100, hMax: 130, sMin: 100, sMax: 255, vMin: 100, vMax: 255 },
    yellow: { hMin: 20, hMax: 35, sMin: 100, sMax: 255, vMin: 100, vMax: 255 }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 60 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        streamRef.current = stream;
        setIsActive(true);
        toast.success('Κάμερα ενεργοποιήθηκε');
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Σφάλμα κάμερας');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsActive(false);
    setIsTracking(false);
  };

  const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 180, s: s * 255, v: v * 255 };
  };

  const detectMarker = useCallback((imageData: ImageData): { x: number; y: number } | null => {
    const { data, width, height } = imageData;
    const range = colorRanges[markerColor];
    
    let sumX = 0, sumY = 0, count = 0;
    
    // Sample every 4th pixel for performance
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const hsv = rgbToHsv(r, g, b);
        
        let isMatch = false;
        
        if (markerColor === 'red') {
          // Red wraps around in HSV
          isMatch = ((hsv.h >= range.hMin && hsv.h <= range.hMax) || 
                     (hsv.h >= range.hMin2! && hsv.h <= range.hMax2!)) &&
                    hsv.s >= range.sMin && hsv.s <= range.sMax &&
                    hsv.v >= range.vMin && hsv.v <= range.vMax;
        } else {
          isMatch = hsv.h >= range.hMin && hsv.h <= range.hMax &&
                    hsv.s >= range.sMin && hsv.s <= range.sMax &&
                    hsv.v >= range.vMin && hsv.v <= range.vMax;
        }
        
        if (isMatch) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }
    
    if (count < 50) return null; // Minimum pixel threshold
    
    return { x: sumX / count, y: sumY / count };
  }, [markerColor]);

  const calculateVelocity = (positions: MarkerPosition[]): { peak: number; avg: number; displacement: number } => {
    if (positions.length < 2) return { peak: 0, avg: 0, displacement: 0 };
    
    const velocities: number[] = [];
    let totalDisplacement = 0;
    
    for (let i = 1; i < positions.length; i++) {
      const dx = positions[i].x - positions[i - 1].x;
      const dy = positions[i].y - positions[i - 1].y;
      const dt = (positions[i].timestamp - positions[i - 1].timestamp) / 1000; // seconds
      
      if (dt > 0) {
        const distancePixels = Math.sqrt(dx * dx + dy * dy);
        const distanceCm = distancePixels / pixelsPerCm;
        const velocity = (distanceCm / 100) / dt; // m/s
        velocities.push(velocity);
        totalDisplacement += distanceCm;
      }
    }
    
    const peak = Math.max(...velocities);
    const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    
    return { peak, avg, displacement: totalDisplacement };
  };

  const trackFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !overlayCanvasRef.current || !isTracking) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const overlayCtx = overlay.getContext('2d');
    
    if (!ctx || !overlayCtx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const markerPos = detectMarker(imageData);
    
    // Clear overlay
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    
    if (markerPos) {
      // Draw marker indicator
      overlayCtx.beginPath();
      overlayCtx.arc(markerPos.x, markerPos.y, 15, 0, Math.PI * 2);
      overlayCtx.strokeStyle = '#00ffba';
      overlayCtx.lineWidth = 3;
      overlayCtx.stroke();
      
      // Draw crosshair
      overlayCtx.beginPath();
      overlayCtx.moveTo(markerPos.x - 25, markerPos.y);
      overlayCtx.lineTo(markerPos.x + 25, markerPos.y);
      overlayCtx.moveTo(markerPos.x, markerPos.y - 25);
      overlayCtx.lineTo(markerPos.x, markerPos.y + 25);
      overlayCtx.strokeStyle = '#00ffba';
      overlayCtx.lineWidth = 2;
      overlayCtx.stroke();
      
      // Store position
      positionsRef.current.push({
        x: markerPos.x,
        y: markerPos.y,
        timestamp: performance.now()
      });
      
      // Calculate real-time velocity (last 5 frames)
      if (positionsRef.current.length >= 5) {
        const recentPositions = positionsRef.current.slice(-5);
        const { peak } = calculateVelocity(recentPositions);
        setCurrentVelocity(peak);
      }
      
      // Draw trail
      if (positionsRef.current.length > 1) {
        overlayCtx.beginPath();
        overlayCtx.moveTo(positionsRef.current[0].x, positionsRef.current[0].y);
        for (let i = 1; i < positionsRef.current.length; i++) {
          overlayCtx.lineTo(positionsRef.current[i].x, positionsRef.current[i].y);
        }
        overlayCtx.strokeStyle = 'rgba(0, 255, 186, 0.5)';
        overlayCtx.lineWidth = 2;
        overlayCtx.stroke();
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(trackFrame);
  }, [isTracking, detectMarker, pixelsPerCm]);

  const startTracking = () => {
    positionsRef.current = [];
    setCurrentVelocity(null);
    setIsTracking(true);
    toast.info('Tracking ξεκίνησε - κάνε την άρση!');
  };

  const stopTracking = () => {
    setIsTracking(false);
    
    if (positionsRef.current.length > 10) {
      const { peak, avg, displacement } = calculateVelocity(positionsRef.current);
      
      const newResult: VelocityResult = {
        id: results.length + 1,
        peakVelocity: peak,
        avgVelocity: avg,
        displacement,
        timestamp: new Date()
      };
      
      setResults(prev => [...prev, newResult]);
      toast.success(`Peak: ${peak.toFixed(2)} m/s`);
    } else {
      toast.warning('Δεν εντοπίστηκε αρκετή κίνηση');
    }
    
    positionsRef.current = [];
    setCurrentVelocity(null);
  };

  const resetResults = () => {
    setResults([]);
    toast.info('Αποτελέσματα διαγράφηκαν');
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(startCamera, 100);
  };

  // Calibration functions
  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationPoints([]);
    toast.info('Κάνε κλικ σε 2 σημεία γνωστής απόστασης (π.χ. άκρες μπάρας)');
  };

  const cancelCalibration = () => {
    setIsCalibrating(false);
    setCalibrationPoints([]);
    drawCalibrationOverlay([]);
  };

  const handleCalibrationClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCalibrating || !videoRef.current || !calibrationCanvasRef.current) return;
    
    const canvas = calibrationCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const newPoints = [...calibrationPoints, { x, y }];
    setCalibrationPoints(newPoints);
    
    drawCalibrationOverlay(newPoints);
    
    if (newPoints.length === 1) {
      toast.info('Κάνε κλικ στο 2ο σημείο');
    }
  };

  const drawCalibrationOverlay = (points: CalibrationPoint[]) => {
    if (!calibrationCanvasRef.current || !videoRef.current) return;
    
    const canvas = calibrationCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw points
    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffba';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
      ctx.strokeStyle = '#00ffba';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${index + 1}`, point.x + 20, point.y + 5);
    });
    
    // Draw line between points
    if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.strokeStyle = '#00ffba';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Calculate and display pixel distance
      const pixelDistance = Math.sqrt(
        Math.pow(points[1].x - points[0].x, 2) + 
        Math.pow(points[1].y - points[0].y, 2)
      );
      
      const midX = (points[0].x + points[1].x) / 2;
      const midY = (points[0].y + points[1].y) / 2;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(midX - 50, midY - 25, 100, 30);
      ctx.fillStyle = '#00ffba';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pixelDistance.toFixed(0)} px`, midX, midY);
    }
  };

  const confirmCalibration = () => {
    if (calibrationPoints.length !== 2) return;
    
    const pixelDistance = Math.sqrt(
      Math.pow(calibrationPoints[1].x - calibrationPoints[0].x, 2) + 
      Math.pow(calibrationPoints[1].y - calibrationPoints[0].y, 2)
    );
    
    const cmDistance = parseFloat(knownDistanceCm);
    if (cmDistance <= 0 || isNaN(cmDistance)) {
      toast.error('Εισάγετε έγκυρη απόσταση σε cm');
      return;
    }
    
    const newPixelsPerCm = pixelDistance / cmDistance;
    setPixelsPerCm(parseFloat(newPixelsPerCm.toFixed(2)));
    
    setIsCalibrating(false);
    setCalibrationPoints([]);
    drawCalibrationOverlay([]);
    
    toast.success(`Βαθμονόμηση: ${newPixelsPerCm.toFixed(2)} pixels/cm`);
  };

  useEffect(() => {
    if (isTracking) {
      animationFrameRef.current = requestAnimationFrame(trackFrame);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTracking, trackFrame]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const bestResult = results.length > 0 
    ? results.reduce((best, r) => r.peakVelocity > best.peakVelocity ? r : best, results[0])
    : null;

  const avgPeakVelocity = results.length > 0
    ? results.reduce((sum, r) => sum + r.peakVelocity, 0) / results.length
    : 0;

  // Render sidebar based on role
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          {renderSidebar()}
        </div>
        
        {/* Mobile/Tablet menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden rounded-none bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile/Tablet sidebar overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full">
              {renderSidebar()}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pl-12 lg:pl-0">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  Bar Velocity
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Μέτρηση ταχύτητας μπάρας με color tracking
                </p>
              </div>
              {results.length > 0 && (
                <Button variant="outline" size="sm" onClick={resetResults} className="rounded-none">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Camera View */}
            <Card className="lg:col-span-2 rounded-none">
              <CardContent className="p-2">
                <div className="relative bg-black overflow-hidden mx-auto" style={{ aspectRatio: '9/16', maxHeight: '60vh' }}>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    style={{ transform: `scale(${zoom})` }}
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <canvas 
                    ref={overlayCanvasRef} 
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ transform: `scale(${zoom})` }}
                  />
                  
                  {/* Calibration canvas - clickable */}
                  <canvas 
                    ref={calibrationCanvasRef} 
                    className={`absolute inset-0 w-full h-full ${isCalibrating ? 'cursor-crosshair' : 'pointer-events-none'}`}
                    style={{ transform: `scale(${zoom})` }}
                    onClick={handleCalibrationClick}
                  />
                  
                  {!isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <Button onClick={startCamera} size="lg" className="rounded-none">
                        <Camera className="h-5 w-5 mr-2" />
                        Ενεργοποίηση Κάμερας
                      </Button>
                    </div>
                  )}
                  
                  {/* Calibration mode overlay */}
                  {isCalibrating && (
                    <div className="absolute top-4 left-4 right-4 bg-black/80 p-3 rounded-none">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-primary" />
                          <span className="text-white text-sm">
                            Βαθμονόμηση: {calibrationPoints.length}/2 σημεία
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={knownDistanceCm}
                            onChange={(e) => setKnownDistanceCm(e.target.value)}
                            placeholder="cm"
                            className="w-20 h-7 rounded-none text-sm"
                          />
                          <span className="text-white text-sm">cm</span>
                          {calibrationPoints.length === 2 && (
                            <Button 
                              size="sm" 
                              onClick={confirmCalibration}
                              className="rounded-none h-7 bg-primary"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              OK
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={cancelCalibration}
                            className="rounded-none h-7 text-white hover:text-white hover:bg-white/20"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Real-time velocity display */}
                  {isTracking && currentVelocity !== null && (
                    <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded-none">
                      <div className="text-3xl font-bold text-primary">
                        {currentVelocity.toFixed(2)} m/s
                      </div>
                    </div>
                  )}

                  {/* Controls overlay */}
                  {isActive && (
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                      <CameraZoomControl zoom={zoom} onZoomChange={setZoom} />
                      
                      <div className="flex gap-2">
                        {!isTracking ? (
                          <Button 
                            onClick={startTracking} 
                            className="rounded-none bg-primary hover:bg-primary/90"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start
                          </Button>
                        ) : (
                          <Button 
                            onClick={stopTracking}
                            variant="destructive"
                            className="rounded-none"
                          >
                            <Square className="h-4 w-4 mr-2" />
                            Stop
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={switchCamera}
                          className="rounded-none bg-black/50"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Settings */}
                <div className="flex items-center gap-4 mt-3 p-2 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Χρώμα Marker:</span>
                    <Select value={markerColor} onValueChange={(v: any) => setMarkerColor(v)}>
                      <SelectTrigger className="w-24 rounded-none h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="red">🔴 Κόκκινο</SelectItem>
                        <SelectItem value="green">🟢 Πράσινο</SelectItem>
                        <SelectItem value="blue">🔵 Μπλε</SelectItem>
                        <SelectItem value="yellow">🟡 Κίτρινο</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Pixels/cm:</span>
                    <input
                      type="number"
                      value={pixelsPerCm}
                      onChange={(e) => setPixelsPerCm(Number(e.target.value))}
                      className="w-16 h-8 px-2 bg-background border rounded-none text-sm"
                      disabled={isCalibrating}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startCalibration}
                      disabled={!isActive || isTracking || isCalibrating}
                      className="rounded-none h-8"
                    >
                      <Ruler className="h-3 w-3 mr-1" />
                      Βαθμονόμηση
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Panel */}
            <div className="space-y-4">
              {/* Current Attempt */}
              <Card className={`rounded-none border-2 transition-all duration-300 ${
                isTracking
                  ? 'border-primary bg-primary/5 animate-pulse'
                  : results.length > 0
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-muted'
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Τρέχουσα Μέτρηση
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isTracking ? (
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {currentVelocity ? `${currentVelocity.toFixed(2)}` : '--'}
                      </div>
                      <div className="text-sm text-muted-foreground">m/s</div>
                      <Badge variant="secondary" className="mt-2 rounded-none animate-pulse">
                        Tracking...
                      </Badge>
                    </div>
                  ) : results.length > 0 ? (
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {results[results.length - 1].peakVelocity.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">m/s (peak)</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Avg: {results[results.length - 1].avgVelocity.toFixed(2)} m/s
                      </div>
                      {results[results.length - 1].peakVelocity === bestResult?.peakVelocity && (
                        <Badge className="mt-2 rounded-none bg-[hsl(var(--auth-gold))]">
                          🏆 Best!
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <div className="text-4xl font-bold">--</div>
                      <div className="text-sm">Έτοιμο για μέτρηση</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card className="rounded-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Στατιστικά
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Προσπάθειες</span>
                    <Badge variant="outline" className="rounded-none">{results.length}</Badge>
                  </div>
                  {bestResult && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Best Peak</span>
                        <span className="font-semibold text-primary">
                          {bestResult.peakVelocity.toFixed(2)} m/s
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Μ.Ο. Peak</span>
                        <span className="font-medium">{avgPeakVelocity.toFixed(2)} m/s</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Results List */}
              {results.length > 0 && (
                <Card className="rounded-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Ιστορικό
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {results.slice().reverse().map((r) => (
                        <div 
                          key={r.id}
                          className={`flex justify-between items-center p-2 text-sm ${
                            r.id === bestResult?.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'
                          }`}
                        >
                          <span className="text-muted-foreground">#{r.id}</span>
                          <div className="text-right">
                            <span className="font-semibold">{r.peakVelocity.toFixed(2)} m/s</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({r.displacement.toFixed(0)}cm)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default BarVelocityPage;

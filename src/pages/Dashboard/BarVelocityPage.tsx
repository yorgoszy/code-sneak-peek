import { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Camera, Play, Square, RotateCcw, Activity, TrendingUp, Zap, Target, Ruler, Check, X, Menu } from "lucide-react";
import { CameraZoomControl } from "@/components/CameraZoomControl";
import { toast } from "sonner";
import { BarVelocityFileAnalyzer } from "@/components/bar-velocity/BarVelocityFileAnalyzer";

import { findSelectedMarker, sampleSelectedMarker, type SelectedMarker } from "@/components/bar-velocity/selectedMarker";

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
  const [sourceMode, setSourceMode] = useState<'file' | 'live'>('file');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const calibrationCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const positionsRef = useRef<MarkerPosition[]>([]);
  
  const [isActive, setIsActive] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const selectedMarkerRef = useRef<SelectedMarker | null>(null);
  const [hasSelectedMarker, setHasSelectedMarker] = useState(false);
  const [isSelectingMarker, setIsSelectingMarker] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [results, setResults] = useState<VelocityResult[]>([]);
  const [currentVelocity, setCurrentVelocity] = useState<number | null>(null);
  const [pixelsPerCm, setPixelsPerCm] = useState(5); // Default estimate
  
  // Calibration state
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([]);
  const [knownDistanceCm, setKnownDistanceCm] = useState<string>('220');

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
    selectedMarkerRef.current = null;
    setHasSelectedMarker(false);
    setIsSelectingMarker(false);
  };

  const detectMarker = useCallback((imageData: ImageData) => {
    const marker = selectedMarkerRef.current;
    if (!marker) return null;
    const position = findSelectedMarker(imageData, marker);
    if (position) selectedMarkerRef.current = { ...marker, position };
    return position;
  }, []);

  const selectMarker = (event: React.MouseEvent<HTMLVideoElement>) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!isSelectingMarker || !video || !canvas || !video.videoWidth) return;
    const rect = video.getBoundingClientRect();
    // object-cover may crop the source; invert that mapping before sampling.
    const scale = Math.max(rect.width / video.videoWidth, rect.height / video.videoHeight);
    const x = Math.min(video.videoWidth - 1, Math.max(0, Math.round((event.clientX - rect.left + (video.videoWidth * scale - rect.width) / 2) / scale)));
    const y = Math.min(video.videoHeight - 1, Math.max(0, Math.round((event.clientY - rect.top + (video.videoHeight * scale - rect.height) / 2) / scale)));
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const sampled = sampleSelectedMarker(image, { x, y });
    const lockedPosition = sampled ? findSelectedMarker(image, sampled) : null;
    if (!sampled || !lockedPosition) {
      toast.warning('Δεν κλείδωσε στόχος. Πάτησε στο κέντρο ενός έντονου χρωματιστού σημαδιού.');
      return;
    }
    selectedMarkerRef.current = { ...sampled, position: lockedPosition };
    setHasSelectedMarker(true);
    setIsSelectingMarker(false);
    positionsRef.current = [];
    setCurrentVelocity(null);
    const overlay = overlayCanvasRef.current;
    const overlayCtx = overlay?.getContext('2d');
    if (overlay && overlayCtx) {
      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;
      overlayCtx.strokeStyle = '#ffffff';
      overlayCtx.lineWidth = 3;
      overlayCtx.strokeRect(lockedPosition.x - 16, lockedPosition.y - 16, 32, 32);
    }
    toast.success('Ο στόχος επιλέχθηκε');
  };

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
    } else {
      setCurrentVelocity(null);
      setIsTracking(false);
      positionsRef.current = [];
      selectedMarkerRef.current = null;
      setHasSelectedMarker(false);
      toast.warning('Ο στόχος χάθηκε — επίλεξέ τον ξανά');
      return;
    }
    
    animationFrameRef.current = requestAnimationFrame(trackFrame);
  }, [isTracking, detectMarker, pixelsPerCm]);

  const startTracking = () => {
    if (!selectedMarkerRef.current || isSelectingMarker) {
      toast.info('Επίλεξε πρώτα στόχο στην εικόνα');
      return;
    }
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
          {/* Mobile/Tablet Header with menu button */}
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
                  <Activity className="h-5 w-5 text-primary" />
                  Bar Velocity
                </h1>
              </div>
              {results.length > 0 && (
                <Button variant="outline" size="sm" onClick={resetResults} className="rounded-none">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-4">
              {/* Header - Desktop only */}
              <div className="hidden lg:flex items-center justify-between">
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

          <div className="flex gap-2">
            <Button size="sm" variant={sourceMode === 'file' ? 'default' : 'outline'} className="rounded-none" onClick={() => setSourceMode('file')}>
              Ανάλυση αρχείου (high fps)
            </Button>
            <Button size="sm" variant={sourceMode === 'live' ? 'default' : 'outline'} className="rounded-none" onClick={() => setSourceMode('live')}>
              Ζωντανή κάμερα
            </Button>
          </div>

          {sourceMode === 'file' && <BarVelocityFileAnalyzer />}

          <div className={sourceMode === 'file' ? 'hidden' : 'grid grid-cols-1 lg:grid-cols-3 gap-4'}>
            {/* Camera View */}
            <Card className="lg:col-span-2 rounded-none">
              <CardContent className="p-2">
                <div className="relative aspect-video w-full bg-black overflow-hidden mx-auto">
                  <video
                    ref={videoRef}
                    className={`w-full h-full object-cover ${isSelectingMarker ? 'cursor-crosshair' : ''}`}
                    onClick={selectMarker}
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
                            disabled={!hasSelectedMarker || isSelectingMarker || isCalibrating}
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
                <div className="flex flex-wrap items-center gap-4 mt-3 p-2 bg-muted/50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none h-8"
                    disabled={!isActive || isTracking || isCalibrating}
                    onClick={() => {
                      setIsSelectingMarker(true);
                      selectedMarkerRef.current = null;
                      setHasSelectedMarker(false);
                      toast.info('Πάτησε πάνω στο σημάδι που θέλεις να παρακολουθείς');
                    }}
                  >
                    <Target className="h-4 w-4 mr-1" />
                    {isSelectingMarker ? 'Επιλογή…' : hasSelectedMarker ? 'Αλλαγή στόχου' : 'Επιλογή στόχου'}
                  </Button>
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
                      disabled={!isActive || isTracking || isCalibrating || isSelectingMarker}
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
      </div>
    </SidebarProvider>
  );
};

export default BarVelocityPage;

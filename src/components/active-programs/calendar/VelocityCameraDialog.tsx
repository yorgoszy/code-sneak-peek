import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Square, RotateCcw, Save, Trash2, Ruler, Settings2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { initializeCamera, stopCamera } from "@/utils/motionDetection";
import { BarVelocityTracker, type RepMetrics, type TrackerCalibration } from "@/utils/barVelocityTracker";
import { saveRepVelocity } from "@/hooks/useWorkoutCompletions/repVelocityService";
import { supabase } from "@/integrations/supabase/client";

interface VelocityCameraDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  userId: string;
  loadKg: number;
  setNumber: number;
  totalReps: number;
  /** το exercise_result_id όπου θα αποθηκευτούν οι μετρήσεις (αν υπάρχει ήδη) */
  exerciseResultId?: string;
}

type MarkerColor = 'green' | 'red' | 'yellow' | 'blue' | 'orange' | 'purple' | 'white' | 'black' | 'custom';

const COLOR_PRESETS: Record<Exclude<MarkerColor, 'custom'>, { label: string; emoji: string; lower: [number, number, number]; upper: [number, number, number] }> = {
  green:  { label: 'Πράσινο',  emoji: '🟢', lower: [35, 100, 100], upper: [85, 255, 255] },
  red:    { label: 'Κόκκινο',  emoji: '🔴', lower: [0, 120, 70],   upper: [10, 255, 255] },
  yellow: { label: 'Κίτρινο',  emoji: '🟡', lower: [20, 100, 100], upper: [35, 255, 255] },
  blue:   { label: 'Μπλε',     emoji: '🔵', lower: [100, 150, 0],  upper: [140, 255, 255] },
  orange: { label: 'Πορτοκαλί',emoji: '🟠', lower: [10, 150, 150], upper: [20, 255, 255] },
  purple: { label: 'Μωβ',      emoji: '🟣', lower: [140, 100, 100],upper: [170, 255, 255] },
  white:  { label: 'Άσπρο',    emoji: '⚪', lower: [0, 0, 200],    upper: [180, 30, 255] },
  black:  { label: 'Μαύρο',    emoji: '⚫', lower: [0, 0, 0],      upper: [180, 255, 50] },
};

const DEFAULT_CALIBRATION: TrackerCalibration = {
  pixels_per_meter: 800,
  hsv_lower: COLOR_PRESETS.green.lower,
  hsv_upper: COLOR_PRESETS.green.upper,
};

function detectColorFromHsv(lower: [number, number, number], upper: [number, number, number]): MarkerColor {
  for (const [key, p] of Object.entries(COLOR_PRESETS)) {
    if (p.lower[0] === lower[0] && p.upper[0] === upper[0]) return key as MarkerColor;
  }
  return 'custom';
}

export const VelocityCameraDialog: React.FC<VelocityCameraDialogProps> = ({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
  userId,
  loadKg,
  setNumber,
  totalReps,
  exerciseResultId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<BarVelocityTracker | null>(null);

  const [tracking, setTracking] = useState(false);
  const [reps, setReps] = useState<RepMetrics[]>([]);
  const [calibration, setCalibration] = useState<TrackerCalibration>(DEFAULT_CALIBRATION);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [calibratingPpm, setCalibratingPpm] = useState(false);
  const [calibPoints, setCalibPoints] = useState<{ x: number; y: number }[]>([]);
  const selectedColor = detectColorFromHsv(calibration.hsv_lower, calibration.hsv_upper);

  const setColor = (c: MarkerColor) => {
    if (c === 'custom') return;
    const p = COLOR_PRESETS[c];
    setCalibration(prev => ({ ...prev, hsv_lower: p.lower, hsv_upper: p.upper }));
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!calibratingPpm) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const video = videoRef.current;
    if (!video) return;
    const scaleX = (video.videoWidth || rect.width) / rect.width;
    const scaleY = (video.videoHeight || rect.height) / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const next = [...calibPoints, { x, y }];
    if (next.length === 2) {
      const dx = next[1].x - next[0].x;
      const dy = next[1].y - next[0].y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      if (distPx < 20) {
        toast.error('Πολύ κοντινά σημεία — δοκίμασε ξανά');
        setCalibPoints([]);
        return;
      }
      setCalibration(prev => ({ ...prev, pixels_per_meter: Math.round(distPx) }));
      toast.success(`Calibration: ${Math.round(distPx)} px = 1m`);
      setCalibPoints([]);
      setCalibratingPpm(false);
    } else {
      setCalibPoints(next);
      toast.info('Τώρα κάνε κλικ στο 2ο άκρο (1 μέτρο μακριά)');
    }
  };

  // Φόρτωση αποθηκευμένης calibration για το συγκεκριμένο exercise/user
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const { data } = await supabase
        .from('exercise_camera_calibration')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .maybeSingle();
      if (data) {
        const ppm = data.pixels_per_meter ?? DEFAULT_CALIBRATION.pixels_per_meter;
        setCalibration({
          pixels_per_meter: ppm,
          hsv_lower: (data.hsv_lower as number[] as [number, number, number]) ?? DEFAULT_CALIBRATION.hsv_lower,
          hsv_upper: (data.hsv_upper as number[] as [number, number, number]) ?? DEFAULT_CALIBRATION.hsv_upper,
        });
      }
    })();
  }, [isOpen, userId, exerciseId]);

  // Άνοιγμα/κλείσιμο κάμερας
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        if (!videoRef.current) return;
        const stream = await initializeCamera(videoRef.current, 'environment');
        if (cancelled) {
          stopCamera(stream);
          return;
        }
        streamRef.current = stream;
      } catch (e) {
        console.error(e);
        toast.error('Δεν μπόρεσε να ανοίξει η κάμερα');
      }
    })();
    return () => {
      cancelled = true;
      handleStop();
      if (streamRef.current) {
        stopCamera(streamRef.current);
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleStart = () => {
    if (!videoRef.current) return;
    const tracker = new BarVelocityTracker(videoRef.current, {
      loadKg,
      setNumber,
      calibration,
    });
    tracker.start((rep) => {
      setReps(prev => {
        const next = [...prev, rep];
        toast.success(`Rep ${rep.rep_number}: ${rep.mean_velocity_ms} m/s`);
        if (next.length >= totalReps) {
          tracker.stop();
          setTracking(false);
        }
        return next;
      });
    });
    trackerRef.current = tracker;
    setTracking(true);
  };

  const handleStop = () => {
    trackerRef.current?.stop();
    trackerRef.current = null;
    setTracking(false);
  };

  const handleReset = () => {
    handleStop();
    setReps([]);
  };

  const handleSave = async () => {
    if (!exerciseResultId) {
      toast.error('Πρέπει πρώτα να ολοκληρωθεί το set για να αποθηκευτούν οι μετρήσεις');
      return;
    }
    if (reps.length === 0) {
      toast.error('Δεν υπάρχουν επαναλήψεις προς αποθήκευση');
      return;
    }
    setLoading(true);
    try {
      for (const rep of reps) {
        await saveRepVelocity(
          { exercise_result_id: exerciseResultId, exercise_id: exerciseId, user_id: userId },
          rep,
        );
      }
      toast.success(`Αποθηκεύτηκαν ${reps.length} επαναλήψεις`);
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? 'Σφάλμα αποθήκευσης');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Bar Velocity — {exerciseName} (Set {setNumber})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div
            className={`relative bg-black aspect-video ${calibratingPpm ? 'cursor-crosshair ring-2 ring-[#00ffba]' : ''}`}
            onClick={handleVideoClick}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain pointer-events-none"
              playsInline
              muted
              autoPlay
            />
            <div className="absolute top-2 left-2 flex gap-2">
              <Badge variant="outline" className="rounded-none bg-background/80">
                {loadKg} kg
              </Badge>
              <Badge variant="outline" className="rounded-none bg-background/80">
                {reps.length} / {totalReps} reps
              </Badge>
              {tracking && (
                <Badge className="rounded-none bg-[#00ffba] text-black animate-pulse">
                  ● REC
                </Badge>
              )}
            </div>
            {calibratingPpm && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                <div className="bg-background/90 px-4 py-2 text-sm">
                  {calibPoints.length === 0
                    ? '👉 Κάνε κλικ στο 1ο άκρο μιας απόστασης 1 μέτρου'
                    : '👉 Κάνε κλικ στο 2ο άκρο (1 μέτρο μακριά)'}
                </div>
              </div>
            )}
          </div>

          {/* Friendly calibration controls */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Χρώμα marker στη μπάρα</Label>
              <Select value={selectedColor === 'custom' ? '' : selectedColor} onValueChange={(v) => setColor(v as MarkerColor)}>
                <SelectTrigger className="h-9 rounded-none">
                  <SelectValue placeholder="Διάλεξε χρώμα..." />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {Object.entries(COLOR_PRESETS).map(([key, p]) => (
                    <SelectItem key={key} value={key}>
                      {p.emoji} {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Calibration απόστασης</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCalibPoints([]); setCalibratingPpm(true); toast.info('Κάνε κλικ στα 2 άκρα μιας απόστασης 1 μέτρου'); }}
                className="h-9 w-full rounded-none justify-start"
              >
                <Ruler className="w-4 h-4 mr-2" />
                {calibration.pixels_per_meter} px = 1m · Επανα-calibrate
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(s => !s)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="w-3 h-3" />
            {showAdvanced ? 'Απόκρυψη' : 'Εμφάνιση'} προηγμένων (HSV)
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-3 gap-2 p-2 border border-border bg-muted/30">
              <div>
                <Label className="text-xs">Pixels / meter</Label>
                <Input
                  type="number"
                  value={calibration.pixels_per_meter}
                  onChange={(e) => setCalibration(c => ({ ...c, pixels_per_meter: Number(e.target.value) || 1 }))}
                  className="h-8 rounded-none"
                />
              </div>
              <div>
                <Label className="text-xs">HSV Lower (H,S,V)</Label>
                <Input
                  value={calibration.hsv_lower.join(',')}
                  onChange={(e) => {
                    const parts = e.target.value.split(',').map(n => Number(n.trim()) || 0);
                    if (parts.length === 3) setCalibration(c => ({ ...c, hsv_lower: parts as [number, number, number] }));
                  }}
                  className="h-8 rounded-none"
                />
              </div>
              <div>
                <Label className="text-xs">HSV Upper (H,S,V)</Label>
                <Input
                  value={calibration.hsv_upper.join(',')}
                  onChange={(e) => {
                    const parts = e.target.value.split(',').map(n => Number(n.trim()) || 0);
                    if (parts.length === 3) setCalibration(c => ({ ...c, hsv_upper: parts as [number, number, number] }));
                  }}
                  className="h-8 rounded-none"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!tracking ? (
              <Button onClick={handleStart} className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90">
                <Camera className="w-4 h-4 mr-2" /> Έναρξη
              </Button>
            ) : (
              <Button onClick={handleStop} variant="destructive" className="rounded-none">
                <Square className="w-4 h-4 mr-2" /> Stop
              </Button>
            )}
            <Button onClick={handleReset} variant="outline" className="rounded-none">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
            <Button onClick={handleSave} variant="outline" disabled={loading || reps.length === 0} className="rounded-none ml-auto">
              <Save className="w-4 h-4 mr-2" /> Αποθήκευση
            </Button>
          </div>

          {reps.length > 0 && (
            <div className="border border-border max-h-64 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-1 text-left">#</th>
                    <th className="p-1">Mean V</th>
                    <th className="p-1">Peak V</th>
                    <th className="p-1">Mean Ecc</th>
                    <th className="p-1">Peak Ecc</th>
                    <th className="p-1">Mean P</th>
                    <th className="p-1">Peak P</th>
                    <th className="p-1">ROM</th>
                    <th className="p-1">Move</th>
                    <th className="p-1">Total</th>
                    <th className="p-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {reps.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-1">{r.rep_number}</td>
                      <td className="p-1 text-center">{r.mean_velocity_ms}</td>
                      <td className="p-1 text-center">{r.peak_velocity_ms}</td>
                      <td className="p-1 text-center">{r.mean_eccentric_velocity_ms}</td>
                      <td className="p-1 text-center">{r.peak_eccentric_velocity_ms}</td>
                      <td className="p-1 text-center">{r.mean_power_w}W</td>
                      <td className="p-1 text-center">{r.peak_power_w}W</td>
                      <td className="p-1 text-center">{r.range_of_motion_cm}cm</td>
                      <td className="p-1 text-center">{r.bar_movement_duration_ms}ms</td>
                      <td className="p-1 text-center">{r.rep_total_duration_ms}ms</td>
                      <td className="p-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 rounded-none"
                          onClick={() => setReps(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

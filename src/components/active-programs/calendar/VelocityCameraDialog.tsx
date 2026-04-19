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

type MarkerColor = 'green' | 'red' | 'yellow' | 'blue' | 'orange' | 'pink' | 'custom';

const COLOR_PRESETS: Record<Exclude<MarkerColor, 'custom'>, { label: string; emoji: string; lower: [number, number, number]; upper: [number, number, number] }> = {
  green:  { label: 'Πράσινο',  emoji: '🟢', lower: [35, 100, 100], upper: [85, 255, 255] },
  red:    { label: 'Κόκκινο',  emoji: '🔴', lower: [0, 120, 70],   upper: [10, 255, 255] },
  yellow: { label: 'Κίτρινο',  emoji: '🟡', lower: [20, 100, 100], upper: [35, 255, 255] },
  blue:   { label: 'Μπλε',     emoji: '🔵', lower: [100, 150, 0],  upper: [140, 255, 255] },
  orange: { label: 'Πορτοκαλί',emoji: '🟠', lower: [10, 150, 150], upper: [20, 255, 255] },
  pink:   { label: 'Ροζ',      emoji: '🩷', lower: [140, 100, 100],upper: [170, 255, 255] },
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
          <div className="relative bg-black aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
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
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Pixels / meter (calibration)</Label>
              <Input
                type="number"
                value={calibration.pixels_per_meter}
                onChange={(e) =>
                  setCalibration(c => ({ ...c, pixels_per_meter: Number(e.target.value) || 1 }))
                }
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

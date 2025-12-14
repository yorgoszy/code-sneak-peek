import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Save, RotateCcw, Target, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Muscle {
  id: string;
  name: string;
  muscle_group: string | null;
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
}

interface ClickPosition {
  x: number;
  y: number;
  z: number;
}

// Lazy load the 3D canvas
const Muscle3DCanvas = React.lazy(() => import('./Muscle3DCanvas'));

// Loading fallback
function Canvas3DFallback() {
  return (
    <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center bg-black/95">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00ffba] mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Φόρτωση 3D Model...</p>
      </div>
    </div>
  );
}

// Error fallback
function Canvas3DError() {
  return (
    <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center bg-black/95">
      <div className="text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Σφάλμα φόρτωσης 3D</p>
        <p className="text-xs text-muted-foreground mt-1">Δοκίμασε να ανανεώσεις τη σελίδα</p>
      </div>
    </div>
  );
}

// Error boundary
class Canvas3DErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Canvas Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Canvas3DError />;
    }
    return this.props.children;
  }
}

export const MusclePositionMapper: React.FC = () => {
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [selectedMuscleId, setSelectedMuscleId] = useState<string>('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<ClickPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMuscles();
  }, []);

  const fetchMuscles = async () => {
    try {
      const { data, error } = await supabase
        .from('muscles')
        .select('id, name, muscle_group, position_x, position_y, position_z')
        .order('name');
      
      if (error) throw error;
      setMuscles(data || []);
    } catch (error) {
      console.error('Error fetching muscles:', error);
      toast.error('Σφάλμα φόρτωσης μυών');
    } finally {
      setLoading(false);
    }
  };

  const handlePositionClick = (pos: ClickPosition) => {
    if (!selectedMuscleId) {
      toast.error('Επέλεξε πρώτα έναν μυ');
      return;
    }
    setPendingPosition(pos);
    setIsSelecting(false);
  };

  const handleSavePosition = async () => {
    if (!selectedMuscleId || !pendingPosition) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('muscles')
        .update({
          position_x: pendingPosition.x,
          position_y: pendingPosition.y,
          position_z: pendingPosition.z
        })
        .eq('id', selectedMuscleId);
      
      if (error) throw error;
      
      setMuscles(prev => prev.map(m => 
        m.id === selectedMuscleId 
          ? { ...m, position_x: pendingPosition.x, position_y: pendingPosition.y, position_z: pendingPosition.z }
          : m
      ));
      
      toast.success('Η θέση αποθηκεύτηκε!');
      setPendingPosition(null);
      setSelectedMuscleId('');
    } catch (error) {
      console.error('Error saving position:', error);
      toast.error('Σφάλμα αποθήκευσης');
    } finally {
      setSaving(false);
    }
  };

  const handleClearPosition = async (muscleId: string) => {
    try {
      const { error } = await supabase
        .from('muscles')
        .update({
          position_x: null,
          position_y: null,
          position_z: null
        })
        .eq('id', muscleId);
      
      if (error) throw error;
      
      setMuscles(prev => prev.map(m => 
        m.id === muscleId 
          ? { ...m, position_x: null, position_y: null, position_z: null }
          : m
      ));
      
      toast.success('Η θέση διαγράφηκε');
    } catch (error) {
      console.error('Error clearing position:', error);
      toast.error('Σφάλμα διαγραφής');
    }
  };

  const placedMuscles = muscles
    .filter(m => m.position_x !== null && m.position_y !== null && m.position_z !== null)
    .map(m => ({
      position: [m.position_x!, m.position_y!, m.position_z!] as [number, number, number],
      name: m.name
    }));

  const selectedMuscle = muscles.find(m => m.id === selectedMuscleId);
  const mappedCount = muscles.filter(m => m.position_x !== null).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Φόρτωση...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Controls Panel - Mobile first */}
      <Card className="rounded-none order-1 lg:order-2">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            <span>Επιλογή Μυός</span>
            <Badge variant="outline" className="rounded-none text-xs lg:hidden">
              {mappedCount}/{muscles.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4">
          {/* Muscle selector */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm text-muted-foreground">Μυς</label>
            <Select value={selectedMuscleId} onValueChange={setSelectedMuscleId}>
              <SelectTrigger className="rounded-none text-sm">
                <SelectValue placeholder="Επέλεξε μυ..." />
              </SelectTrigger>
              <SelectContent className="rounded-none max-h-[250px] sm:max-h-[300px]">
                {muscles.map(muscle => (
                  <SelectItem key={muscle.id} value={muscle.id} className="rounded-none text-sm">
                    <span className="flex items-center gap-2">
                      <span className="truncate max-w-[200px]">{muscle.name}</span>
                      {muscle.position_x !== null && (
                        <Check className="w-3 h-3 text-[#00ffba] flex-shrink-0" />
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => setIsSelecting(true)}
              disabled={!selectedMuscleId || isSelecting}
              className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black text-sm"
            >
              <Target className="w-4 h-4 mr-2" />
              {isSelecting ? 'Κάνε click στο model...' : 'Τοποθέτηση στο Model'}
            </Button>

            {isSelecting && (
              <Button
                onClick={() => setIsSelecting(false)}
                variant="outline"
                className="w-full rounded-none text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Ακύρωση
              </Button>
            )}
          </div>

          {/* Pending position */}
          {pendingPosition && selectedMuscle && (
            <div className="space-y-2 p-2 sm:p-3 bg-muted/50 border">
              <div className="text-xs sm:text-sm font-medium truncate">{selectedMuscle.name}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-mono">
                X: {pendingPosition.x} | Y: {pendingPosition.y} | Z: {pendingPosition.z}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSavePosition}
                  disabled={saving}
                  size="sm"
                  className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black text-xs sm:text-sm"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Αποθήκευση
                </Button>
                <Button
                  onClick={() => setPendingPosition(null)}
                  variant="outline"
                  size="sm"
                  className="rounded-none"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Mapped muscles list */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-medium">Τοποθετημένοι Μύες ({mappedCount})</div>
            <div className="max-h-[150px] sm:max-h-[200px] overflow-y-auto space-y-1">
              {muscles.filter(m => m.position_x !== null).map(muscle => (
                <div 
                  key={muscle.id} 
                  className="flex items-center justify-between p-1.5 sm:p-2 bg-muted/30 text-[10px] sm:text-xs"
                >
                  <span className="truncate flex-1 mr-2">{muscle.name}</span>
                  <Button
                    onClick={() => handleClearPosition(muscle.id)}
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 rounded-none hover:bg-destructive/20 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3D Model */}
      <Card className="rounded-none lg:col-span-2 order-2 lg:order-1">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            <span>3D Body Model</span>
            <Badge variant="outline" className="rounded-none text-xs hidden lg:inline-flex">
              {mappedCount}/{muscles.length} μύες
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <Canvas3DErrorBoundary>
            <Suspense fallback={<Canvas3DFallback />}>
              <Muscle3DCanvas
                placedMuscles={placedMuscles}
                pendingPosition={pendingPosition}
                isSelecting={isSelecting}
                selectedMuscleName={selectedMuscle?.name}
                onClickPosition={handlePositionClick}
              />
            </Suspense>
          </Canvas3DErrorBoundary>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
              <span className="text-muted-foreground">Τοποθετημένοι</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500"></div>
              <span className="text-muted-foreground">Εκκρεμότητα</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

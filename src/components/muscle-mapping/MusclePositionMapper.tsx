import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { supabase } from "@/integrations/supabase/client";
import { Save, RotateCcw, Target, Check, X } from "lucide-react";
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

const MODEL_URL = 'https://dicwdviufetibnafzipa.supabase.co/storage/v1/object/public/models/Male.OBJ';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-[#00ffba] text-xs">
        {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

// Marker component for placed muscles
function MuscleMarker({ position, color, name }: { position: [number, number, number]; color: string; name: string }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// Interactive Human Model
function InteractiveHumanModel({ 
  onClickPosition, 
  isSelecting,
  placedMuscles 
}: { 
  onClickPosition: (pos: ClickPosition) => void;
  isSelecting: boolean;
  placedMuscles: Array<{ position: [number, number, number]; name: string }>;
}) {
  const obj = useLoader(OBJLoader, MODEL_URL);
  const { raycaster, camera, pointer, gl } = useThree();
  
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
    
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#00ffba',
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        });
      }
    });
  }, [obj]);

  const handleClick = useCallback((event: THREE.Event) => {
    if (!isSelecting) return;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(obj, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      onClickPosition({
        x: parseFloat(point.x.toFixed(4)),
        y: parseFloat(point.y.toFixed(4)),
        z: parseFloat(point.z.toFixed(4))
      });
    }
  }, [isSelecting, raycaster, camera, pointer, obj, onClickPosition]);

  return (
    <group>
      <primitive 
        object={obj} 
        scale={0.54} 
        rotation={[0, 0, 0]}
        onClick={handleClick}
      />
      {placedMuscles.map((muscle, index) => (
        <MuscleMarker 
          key={index} 
          position={muscle.position} 
          color="#ff4444"
          name={muscle.name}
        />
      ))}
    </group>
  );
}

// Pending marker for current selection
function PendingMarker({ position }: { position: [number, number, number] | null }) {
  if (!position) return null;
  
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.8} transparent opacity={0.8} />
    </mesh>
  );
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
      
      // Update local state
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
    return <div className="flex justify-center p-8">Φόρτωση...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 3D Model */}
      <Card className="rounded-none lg:col-span-2">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>3D Body Model</span>
            <Badge variant="outline" className="rounded-none">
              {mappedCount}/{muscles.length} μύες
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="w-full h-[500px] bg-black/95 relative">
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              style={{ background: 'transparent' }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <directionalLight position={[-10, -10, -5]} intensity={0.5} />
              <Suspense fallback={<Loader />}>
                <InteractiveHumanModel 
                  onClickPosition={handlePositionClick}
                  isSelecting={isSelecting}
                  placedMuscles={placedMuscles}
                />
                <PendingMarker 
                  position={pendingPosition ? [pendingPosition.x, pendingPosition.y, pendingPosition.z] : null} 
                />
              </Suspense>
              <OrbitControls 
                enableZoom={true}
                enablePan={true}
                minDistance={2}
                maxDistance={10}
              />
            </Canvas>
            
            {/* Overlay instructions */}
            {isSelecting && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#00ffba] text-black px-4 py-2 rounded-none text-sm font-medium">
                Κάνε click στο σημείο του μυός: {selectedMuscle?.name}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-muted-foreground">Τοποθετημένοι μύες</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-muted-foreground">Επιλογή σε εκκρεμότητα</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls Panel */}
      <Card className="rounded-none">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg">Επιλογή Μυός</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          {/* Muscle selector */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Μυς</label>
            <Select value={selectedMuscleId} onValueChange={setSelectedMuscleId}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επέλεξε μυ..." />
              </SelectTrigger>
              <SelectContent className="rounded-none max-h-[300px]">
                {muscles.map(muscle => (
                  <SelectItem key={muscle.id} value={muscle.id} className="rounded-none">
                    <span className="flex items-center gap-2">
                      {muscle.name}
                      {muscle.position_x !== null && (
                        <Check className="w-3 h-3 text-[#00ffba]" />
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
              className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              <Target className="w-4 h-4 mr-2" />
              {isSelecting ? 'Κάνε click στο model...' : 'Τοποθέτηση στο Model'}
            </Button>

            {isSelecting && (
              <Button
                onClick={() => setIsSelecting(false)}
                variant="outline"
                className="w-full rounded-none"
              >
                <X className="w-4 h-4 mr-2" />
                Ακύρωση
              </Button>
            )}
          </div>

          {/* Pending position */}
          {pendingPosition && selectedMuscle && (
            <div className="space-y-2 p-3 bg-muted/50 border">
              <div className="text-sm font-medium">{selectedMuscle.name}</div>
              <div className="text-xs text-muted-foreground font-mono">
                X: {pendingPosition.x} | Y: {pendingPosition.y} | Z: {pendingPosition.z}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSavePosition}
                  disabled={saving}
                  size="sm"
                  className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
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
            <div className="text-sm font-medium">Τοποθετημένοι Μύες ({mappedCount})</div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {muscles.filter(m => m.position_x !== null).map(muscle => (
                <div 
                  key={muscle.id} 
                  className="flex items-center justify-between p-2 bg-muted/30 text-xs"
                >
                  <span className="truncate flex-1">{muscle.name}</span>
                  <Button
                    onClick={() => handleClearPosition(muscle.id)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-none hover:bg-destructive/20"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

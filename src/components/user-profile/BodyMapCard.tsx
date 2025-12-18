import React, { useState, useEffect, Suspense, useMemo } from 'react';

import { supabase } from "@/integrations/supabase/client";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BodyMapCardProps {
  userId: string;
}

const MODEL_URL = 'https://dicwdviufetibnafzipa.supabase.co/storage/v1/object/public/models/Ecorche_by_AlexLashko_ShrunkenView.obj';

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

interface DesignSettings {
  backgroundColor: string;
  objectColor: string;
  stretchColor: string;
  strengthenColor: string;
  wireframeOpacity: number;
}

const DEFAULT_DESIGN: DesignSettings = {
  backgroundColor: '#ffffff',
  objectColor: '#000000',
  stretchColor: '#ffbb38',
  strengthenColor: '#f80000',
  wireframeOpacity: 0.25,
};

interface MuscleData {
  // DB value (kept as fallback)
  meshName: string;
  actionType: 'stretch' | 'strengthen';
  // Greek name from muscles table
  displayName?: string;
  // Preferred matching input (from muscles table)
  position?: { x: number; y: number; z: number };
}

// Helper to get base muscle name (without _Left/_Right suffix and sub-parts for Trapezius)
const getBaseName = (name: string) => {
  // For multi-part muscles like Trapezius_Upper_Left, extract just the main muscle name
  if (name.startsWith('Trapezius_')) {
    return 'Trapezius';
  }
  return name.replace(/_Left$|_Right$|_left$|_right$/i, '');
};

// Helper to check if a mesh name has Left or Right side
const hasSide = (name: string, side: 'Left' | 'Right') => {
  // Check for standard suffix
  if (name.endsWith(`_${side}`)) return true;
  // Check for multi-part format like Trapezius_Upper_Left
  if (name.includes(`_${side}`)) return true;
  return false;
};

// Helper to get Trapezius part from mesh name
const getTrapeziusPart = (name: string): { part: 'Upper' | 'Middle_Lower' | null; side: 'Left' | 'Right' | null } => {
  if (!name.startsWith('Trapezius_')) return { part: null, side: null };
  
  const isUpper = name.includes('Upper');
  const isMiddleLower = name.includes('Middle_Lower');
  const isLeft = name.includes('Left');
  const isRight = name.includes('Right');
  
  return {
    part: isUpper ? 'Upper' : isMiddleLower ? 'Middle_Lower' : null,
    side: isLeft ? 'Left' : isRight ? 'Right' : null
  };
};

// Trapezius Y boundary (same as in Muscle3DCanvas)
const TRAPEZIUS_UPPER_BOUNDARY = 0.88;

function HumanModelWithMuscles({ musclesToHighlight, designSettings }: { musclesToHighlight: MuscleData[]; designSettings: DesignSettings }) {
  const obj = useLoader(OBJLoader, MODEL_URL);

  const cleanName = (s: string) =>
    (s || '')
      .trim()
      // common exporter suffixes
      .replace(/\.(\d+)$/, '')
      .replace(/_(\d+)$/, '')
      .replace(/\s+/g, '');

  const norm = (s: string) => cleanName(s).toLowerCase();

  // Build match sets from DB mesh names (fallback)
  const strengthenExact = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'strengthen')
      .forEach(m => set.add(norm(m.meshName)));
    return set;
  }, [musclesToHighlight]);

  const stretchExact = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch')
      .forEach(m => set.add(norm(m.meshName)));
    return set;
  }, [musclesToHighlight]);

  // Also build base-name sets per side, in case the OBJ mesh names differ slightly
  const strengthenLeftBase = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'strengthen' && hasSide(m.meshName, 'Left'))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const strengthenRightBase = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'strengthen' && hasSide(m.meshName, 'Right'))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const stretchLeftBase = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch' && hasSide(m.meshName, 'Left'))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const stretchRightBase = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch' && hasSide(m.meshName, 'Right'))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  // Fallback base sets (when we can't reliably infer side from OBJ names)
  const strengthenBaseAll = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'strengthen')
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const stretchBaseAll = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch')
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  // Trapezius-specific parts tracking
  const trapeziusParts = useMemo(() => {
    const parts: {
      strengthen: { upperLeft: boolean; upperRight: boolean; middleLower: boolean };
      stretch: { upperLeft: boolean; upperRight: boolean; middleLower: boolean };
    } = {
      strengthen: { upperLeft: false, upperRight: false, middleLower: false },
      stretch: { upperLeft: false, upperRight: false, middleLower: false }
    };
    
    musclesToHighlight.forEach(m => {
      const trapPart = getTrapeziusPart(m.meshName);
      if (!trapPart.part) return;
      
      const action = m.actionType;
      if (trapPart.part === 'Upper') {
        if (trapPart.side === 'Left') parts[action].upperLeft = true;
        else if (trapPart.side === 'Right') parts[action].upperRight = true;
      } else if (trapPart.part === 'Middle_Lower') {
        parts[action].middleLower = true;
      }
    });
    
    return parts;
  }, [musclesToHighlight]);

  const hasSidedData = useMemo(
    () => musclesToHighlight.some(m => hasSide(m.meshName, 'Left') || hasSide(m.meshName, 'Right')),
    [musclesToHighlight]
  );

  const hasPositionData = useMemo(
    () => musclesToHighlight.some(m => !!m.position),
    [musclesToHighlight]
  );

  // IMPORTANT (per /dashboard/muscle-mapping/3d-mapper mapping):
  // "Αριστερά" should highlight meshes with X > 0
  // "Δεξιά" should highlight meshes with X < 0
  // So, compared to the common convention (Left = X < 0), our model/mapping is mirrored.
  const flipSides = true;

  // Clipping planes (THREE.Plane keeps points where normal.dot(point) + constant >= 0)
  // With flipSides=true: "Left" side corresponds to +X, "Right" corresponds to -X
  const leftClipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
    []
  );
  const rightClipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
    []
  );

  // Note: Trapezius clipping is handled via vertex coloring inside clonedObj

  // Build sets per side from DB mesh_name
  const strengthenLeft = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'strengthen' && hasSide(m.meshName, 'Left'))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const strengthenRight = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'strengthen' && hasSide(m.meshName, 'Right'))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const stretchLeft = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch' && hasSide(m.meshName, 'Left'))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const stretchRight = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch' && hasSide(m.meshName, 'Right'))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const clonedObj = useMemo(() => {
    const clone = obj.clone(true);

    // Center the model by subtracting its bounding box center.
    clone.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    clone.updateWorldMatrix(true, true);

    // Calculate the ACTUAL Y boundary for trapezius upper after centering
    const trapeziusUpperClipPlane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      -(TRAPEZIUS_UPPER_BOUNDARY)
    );

    const sideFromX = (x: number): 'Left' | 'Right' => {
      // Default convention: Left is x<=0, Right is x>0. flipSides swaps these.
      const side: 'Left' | 'Right' = x <= 0 ? 'Left' : 'Right';
      return flipSides ? (side === 'Left' ? 'Right' : 'Left') : side;
    };

    // Determine if we should render ONLY one side (based on provided labels/targets)
    const allowedSide: 'Left' | 'Right' | null = (() => {
      const sides = new Set<'Left' | 'Right'>();

      // Prefer position-derived side
      musclesToHighlight
        .filter(m => !!m.position)
        .forEach(m => {
          const x = Number(m.position!.x);
          if (Number.isFinite(x)) sides.add(sideFromX(x - center.x));
        });

      // Fallback to mesh name suffix
      if (sides.size === 0) {
        musclesToHighlight.forEach(m => {
          if (hasSide(m.meshName, 'Left')) sides.add('Left');
          if (hasSide(m.meshName, 'Right')) sides.add('Right');
        });
      }

      return sides.size === 1 ? Array.from(sides)[0] : null;
    })();

    const strengthenTargets = musclesToHighlight
      .filter(m => m.actionType === 'strengthen' && m.position)
      .map(m => ({
        pos: new THREE.Vector3(m.position!.x, m.position!.y, m.position!.z).sub(center),
        // Side comes from the sign of X in /dashboard/muscle-mapping/3d-mapper
        side: sideFromX(m.position!.x - center.x),
      }));

    const stretchTargets = musclesToHighlight
      .filter(m => m.actionType === 'stretch' && m.position)
      .map(m => ({
        pos: new THREE.Vector3(m.position!.x, m.position!.y, m.position!.z).sub(center),
        side: sideFromX(m.position!.x - center.x),
      }));

    // Tweakable: distance threshold for matching DB point -> mesh.
    const MATCH_EPS = 0.25;

    const matchByPosition = (meshCenter: THREE.Vector3) => {
      let best: { type: 'strengthen' | 'stretch'; dist: number; side: 'Left' | 'Right' } | null = null;

      for (const t of strengthenTargets) {
        const d = t.pos.distanceTo(meshCenter);
        if (d <= MATCH_EPS && (!best || d < best.dist)) best = { type: 'strengthen', dist: d, side: t.side };
      }

      for (const t of stretchTargets) {
        const d = t.pos.distanceTo(meshCenter);
        if (d <= MATCH_EPS && (!best || d < best.dist)) best = { type: 'stretch', dist: d, side: t.side };
      }

      return best;
    };

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      child.updateWorldMatrix(true, false);

      const meshNameRaw = (child.name || '').trim();
      const meshName = norm(meshNameRaw);
      const meshBase = norm(getBaseName(cleanName(meshNameRaw)));

      // Special handling for Trapezius - use vertex coloring for all parts
      if (meshNameRaw === 'Trapezius') {
        const hasTrapData = trapeziusParts.strengthen.upperLeft || trapeziusParts.strengthen.upperRight ||
          trapeziusParts.strengthen.middleLower || trapeziusParts.stretch.upperLeft ||
          trapeziusParts.stretch.upperRight || trapeziusParts.stretch.middleLower;

        if (hasTrapData) {
          // Use vertex coloring for all trapezius parts
          const geometry = child.geometry;
          const positionAttribute = geometry.getAttribute('position');
          const colors = new Float32Array(positionAttribute.count * 3);

          const strengthenColor = new THREE.Color(designSettings.strengthenColor);
          const stretchColor = new THREE.Color(designSettings.stretchColor);
          const defaultColor = new THREE.Color(designSettings.objectColor);

          let hasHighlightedVertices = false;

          for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            let color: THREE.Color = defaultColor;
            let isHighlighted = false;

             // Upper Trapezius region (Y >= 0.88)
             if (y >= TRAPEZIUS_UPPER_BOUNDARY) {
               const logicalSide: 'Left' | 'Right' = x <= 0 ? 'Left' : 'Right';
               const side: 'Left' | 'Right' = flipSides ? (logicalSide === 'Left' ? 'Right' : 'Left') : logicalSide;
               const isLeftSide = side === 'Left';
               const isRightSide = side === 'Right';

              // Check if this vertex should be highlighted based on selected parts
              if (isLeftSide && trapeziusParts.strengthen.upperLeft) {
                color = strengthenColor;
                isHighlighted = true;
              } else if (isLeftSide && trapeziusParts.stretch.upperLeft) {
                color = stretchColor;
                isHighlighted = true;
              } else if (isRightSide && trapeziusParts.strengthen.upperRight) {
                color = strengthenColor;
                isHighlighted = true;
              } else if (isRightSide && trapeziusParts.stretch.upperRight) {
                color = stretchColor;
                isHighlighted = true;
              }
            }
            // Middle/Lower Trapezius region (Y < 0.88)
            else {
              if (trapeziusParts.strengthen.middleLower) {
                color = strengthenColor;
                isHighlighted = true;
              } else if (trapeziusParts.stretch.middleLower) {
                color = stretchColor;
                isHighlighted = true;
              }
            }

            if (isHighlighted) hasHighlightedVertices = true;

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
          }

          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

           if (hasHighlightedVertices) {
             child.material = new THREE.MeshStandardMaterial({
               vertexColors: true,
               roughness: 0.3,
               metalness: 0.2,
               emissive: '#333333',
               emissiveIntensity: 0.3,
             });
             child.visible = true;
           } else {
             // Keep full model visible as wireframe when this muscle isn't in labels
             child.material = new THREE.MeshStandardMaterial({
               color: designSettings.objectColor,
               wireframe: true,
               transparent: true,
               opacity: designSettings.wireframeOpacity,
             });
             child.visible = true;
           }
           return;
        }
      }
      // Use mesh bounding box center (in the clone's local space after centering)
      const meshBox = new THREE.Box3().setFromObject(child);
      const meshCenter = meshBox.getCenter(new THREE.Vector3());

      const meshSide: 'Left' | 'Right' = (() => {
        const side: 'Left' | 'Right' = meshCenter.x <= 0 ? 'Left' : 'Right';
        return flipSides ? (side === 'Left' ? 'Right' : 'Left') : side;
      })();

      // Keep full model visible; we only limit which side can be highlighted (not rendered).

      // Preferred: coordinate matching (uses the X sign mapping from /dashboard/muscle-mapping/3d-mapper)
      const matchedByPosition = hasPositionData ? matchByPosition(meshCenter) : null;
      const isStrengthenByPos = matchedByPosition?.type === 'strengthen' && matchedByPosition.side === meshSide;
      const isStretchByPos = matchedByPosition?.type === 'stretch' && matchedByPosition.side === meshSide;

      // Fallback: name-based matching
      // If we have sided DB names but no positions, apply only on the correct half by meshCenter.x.
      // Exclude Trapezius from general matching since we handle it above.
      const isStrengthenByName = meshBase !== 'trapezius' && (
        strengthenExact.has(meshName) ||
        (hasSidedData
          ? (strengthenLeft.has(meshBase) && meshSide === 'Left') || (strengthenRight.has(meshBase) && meshSide === 'Right')
          : strengthenBaseAll.has(meshBase))
      );
      const isStretchByName = meshBase !== 'trapezius' && (
        stretchExact.has(meshName) ||
        (hasSidedData
          ? (stretchLeft.has(meshBase) && meshSide === 'Left') || (stretchRight.has(meshBase) && meshSide === 'Right')
          : stretchBaseAll.has(meshBase))
      );

      const isStrengthen = isStrengthenByPos || isStrengthenByName;
      const isStretch = isStretchByPos || isStretchByName;

      // Clip everything to the chosen side (when a single side is selected)
      const clippingPlanes: THREE.Plane[] = allowedSide
        ? [allowedSide === 'Left' ? leftClipPlane : rightClipPlane]
        : [];

      if (isStrengthen) {
        child.material = new THREE.MeshStandardMaterial({
          color: designSettings.strengthenColor,
          roughness: 0.3,
          metalness: 0.2,
          emissive: designSettings.strengthenColor,
          emissiveIntensity: 0.4,
          clippingPlanes,
          clipShadows: true,
        });
        child.visible = true;
        return;
      }

      if (isStretch) {
        child.material = new THREE.MeshStandardMaterial({
          color: designSettings.stretchColor,
          roughness: 0.3,
          metalness: 0.2,
          emissive: designSettings.stretchColor,
          emissiveIntensity: 0.4,
          clippingPlanes,
          clipShadows: true,
        });
        child.visible = true;
        return;
      }

      // Keep full model visible as wireframe for non-highlighted meshes
      child.material = new THREE.MeshStandardMaterial({
        color: designSettings.objectColor,
        wireframe: true,
        transparent: true,
        opacity: designSettings.wireframeOpacity,
      });
      child.visible = true;
    });

    return clone;
  }, [
    obj,
    musclesToHighlight,
    strengthenExact,
    stretchExact,
    strengthenBaseAll,
    stretchBaseAll,
    strengthenLeft,
    strengthenRight,
    stretchLeft,
    stretchRight,
    hasPositionData,
    leftClipPlane,
    rightClipPlane,
    trapeziusParts,
    designSettings,
  ]);

  return (
    <primitive
      object={clonedObj}
      scale={1.43}
      rotation={[0, 0, 0]}
      position={[0, 1.7, 0]}
    />
  );
}


export const BodyMapCard: React.FC<BodyMapCardProps> = ({ userId }) => {
  
  const [musclesToHighlight, setMusclesToHighlight] = useState<MuscleData[]>([]);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [strengthenDialogOpen, setStrengthenDialogOpen] = useState(false);
  const [stretchDialogOpen, setStretchDialogOpen] = useState(false);
  const [designSettings, setDesignSettings] = useState<DesignSettings>(DEFAULT_DESIGN);

  // Load design settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bodyMapDesign');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.settings) {
          setDesignSettings(parsed.settings);
        }
      }
    } catch (e) {
      console.error('Error loading design settings:', e);
    }
  }, []);

  // Get unique muscle names by type - use the DB muscle.name (includes Αριστερά/Δεξιά when applicable)
  const strengthenMuscles = useMemo(() => {
    const names = musclesToHighlight
      .filter(m => m.actionType === 'strengthen')
      .map(m => (m.displayName || m.meshName.replace(/_/g, ' ')).trim())
      .filter(Boolean);
    return [...new Set(names)];
  }, [musclesToHighlight]);

  const stretchMuscles = useMemo(() => {
    const names = musclesToHighlight
      .filter(m => m.actionType === 'stretch')
      .map(m => (m.displayName || m.meshName.replace(/_/g, ' ')).trim())
      .filter(Boolean);
    return [...new Set(names)];
  }, [musclesToHighlight]);

  useEffect(() => {
    fetchMuscleData();
  }, [userId]);

  const fetchMuscleData = async () => {
    try {
      setLoading(true);

      // 1. Get latest functional test session with data
      const { data: sessionData, error: sessionError } = await supabase
        .from('functional_test_sessions')
        .select(`
          id,
          test_date,
          functional_test_data (
            muscles_need_strengthening,
            muscles_need_stretching
          )
        `)
        .eq('user_id', userId)
        .order('test_date', { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;

      if (!sessionData || sessionData.length === 0) {
        setHasData(false);
        return;
      }

      const functionalData = Array.isArray(sessionData[0].functional_test_data)
        ? sessionData[0].functional_test_data[0]
        : sessionData[0].functional_test_data;

      if (!functionalData) {
        setHasData(false);
        return;
      }

      const needStrengthening: string[] = functionalData.muscles_need_strengthening || [];
      const needStretching: string[] = functionalData.muscles_need_stretching || [];

      if (needStrengthening.length === 0 && needStretching.length === 0) {
        setHasData(false);
        return;
      }

      // 2. Fetch muscles from muscles table based on the final saved lists
      const allMuscleNames = Array.from(new Set([...needStrengthening, ...needStretching]));

      const { data: muscles, error: musclesError } = await supabase
        .from('muscles')
        .select('name, mesh_name, position_x, position_y, position_z')
        .in('name', allMuscleNames);

      if (musclesError) throw musclesError;

      if (!muscles || muscles.length === 0) {
        setHasData(false);
        return;
      }

      const strengthenSet = new Set(needStrengthening);
      const stretchSet = new Set(needStretching);

      const muscleDataMap = new Map<string, MuscleData>();

      muscles.forEach((muscle: any) => {
        if (!muscle?.mesh_name) return;

        const posValid =
          muscle.position_x !== null &&
          muscle.position_y !== null &&
          muscle.position_z !== null;

        const actionType: 'strengthen' | 'stretch' =
          strengthenSet.has(muscle.name) ? 'strengthen' : 'stretch';

        // Strengthen takes priority if a muscle appears in both arrays
        if (!muscleDataMap.has(muscle.mesh_name) || actionType === 'strengthen') {
          muscleDataMap.set(muscle.mesh_name, {
            meshName: muscle.mesh_name,
            actionType,
            displayName: muscle.name,
            position: posValid
              ? {
                  x: Number(muscle.position_x),
                  y: Number(muscle.position_y),
                  z: Number(muscle.position_z),
                }
              : undefined,
          });
        }
      });

      const muscleArray = Array.from(muscleDataMap.values());
      setMusclesToHighlight(muscleArray);
      setHasData(muscleArray.length > 0);
    } catch (error) {
      console.error('Error fetching muscle data:', error);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!hasData) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-2xl h-[300px] rounded-none border border-gray-200 relative" style={{ backgroundColor: designSettings.backgroundColor }}>
        {/* Labels - Clickable */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
          <button 
            onClick={() => setStrengthenDialogOpen(true)}
            className="flex items-center gap-1.5 hover:opacity-80 px-1 py-0.5 transition-colors cursor-pointer"
          >
            <div className="w-3 h-3 rounded-none" style={{ backgroundColor: designSettings.strengthenColor }}></div>
            <span className="text-[10px] text-gray-700">Ενδυνάμωση ({strengthenMuscles.length})</span>
          </button>
          <button 
            onClick={() => setStretchDialogOpen(true)}
            className="flex items-center gap-1.5 hover:opacity-80 px-1 py-0.5 transition-colors cursor-pointer"
          >
            <div className="w-3 h-3 rounded-none" style={{ backgroundColor: designSettings.stretchColor }}></div>
            <span className="text-[10px] text-gray-700">Διάταση ({stretchMuscles.length})</span>
          </button>
        </div>
        
        <Canvas
          camera={{ position: [3, 4, 4], fov: 50 }}
          style={{ background: 'transparent' }}
          gl={{ localClippingEnabled: true }}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} />
          <directionalLight position={[-10, -10, 5]} intensity={0.6} />
          <Suspense fallback={<Loader />}>
            <HumanModelWithMuscles musclesToHighlight={musclesToHighlight} designSettings={designSettings} />
          </Suspense>
          <OrbitControls 
            target={[0, 3, 0]}
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={10}
          />
        </Canvas>
      </div>

      {/* Strengthen Muscles Dialog */}
      <Dialog open={strengthenDialogOpen} onOpenChange={setStrengthenDialogOpen}>
        <DialogContent className="max-w-sm rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-none" style={{ backgroundColor: designSettings.strengthenColor }}></div>
              Μύες για Ενδυνάμωση
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {strengthenMuscles.length > 0 ? (
              strengthenMuscles.map((muscle, index) => (
                <div key={index} className="py-2 px-3 text-sm" style={{ backgroundColor: `${designSettings.strengthenColor}20`, borderLeft: `2px solid ${designSettings.strengthenColor}` }}>
                  {muscle}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Δεν υπάρχουν μύες για ενδυνάμωση</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Stretch Muscles Dialog */}
      <Dialog open={stretchDialogOpen} onOpenChange={setStretchDialogOpen}>
        <DialogContent className="max-w-sm rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-none" style={{ backgroundColor: designSettings.stretchColor }}></div>
              Μύες για Διάταση
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {stretchMuscles.length > 0 ? (
              stretchMuscles.map((muscle, index) => (
                <div key={index} className="py-2 px-3 text-sm" style={{ backgroundColor: `${designSettings.stretchColor}20`, borderLeft: `2px solid ${designSettings.stretchColor}` }}>
                  {muscle}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Δεν υπάρχουν μύες για διάταση</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

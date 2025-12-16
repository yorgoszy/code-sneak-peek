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


interface MuscleData {
  // DB value (kept as fallback)
  meshName: string;
  actionType: 'stretch' | 'strengthen';
  // Preferred matching input (from muscles table)
  position?: { x: number; y: number; z: number };
}

// Helper to get base muscle name (without _Left/_Right suffix)
const getBaseName = (name: string) => {
  return name.replace(/_Left$|_Right$|_left$|_right$/i, '');
};

function HumanModelWithMuscles({ musclesToHighlight }: { musclesToHighlight: MuscleData[] }) {
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
      .filter(m => m.actionType === 'strengthen' && /_Left$/i.test(m.meshName))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const strengthenRightBase = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'strengthen' && /_Right$/i.test(m.meshName))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const stretchLeftBase = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch' && /_Left$/i.test(m.meshName))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const stretchRightBase = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch' && /_Right$/i.test(m.meshName))
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

  const hasSidedData = useMemo(
    () => musclesToHighlight.some(m => /_Left$|_Right$/i.test(m.meshName)),
    [musclesToHighlight]
  );

  const hasPositionData = useMemo(
    () => musclesToHighlight.some(m => !!m.position),
    [musclesToHighlight]
  );

  // Auto-detect if model X axis is mirrored vs our "Left = x<=0" assumption.
  // If the avg X of "_Left" targets is actually > avg X of "_Right" targets, we flip the clipping planes.
  const flipSides = useMemo(() => {
    if (!hasPositionData) return false;

    const leftXs = musclesToHighlight
      .filter(m => /_Left$/i.test(m.meshName) && m.position)
      .map(m => Number(m.position!.x))
      .filter(n => Number.isFinite(n));

    const rightXs = musclesToHighlight
      .filter(m => /_Right$/i.test(m.meshName) && m.position)
      .map(m => Number(m.position!.x))
      .filter(n => Number.isFinite(n));

    if (leftXs.length < 2 || rightXs.length < 2) return false;

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const leftAvg = avg(leftXs);
    const rightAvg = avg(rightXs);

    // Expected: leftAvg < rightAvg. If not, our notion of left/right for X is reversed.
    return leftAvg > rightAvg;
  }, [hasPositionData, musclesToHighlight]);

  // Clipping planes (THREE.Plane keeps points where normal.dot(point) + constant >= 0)
  const leftClipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(flipSides ? 1 : -1, 0, 0), 0),
    [flipSides]
  ); // keeps left half
  const rightClipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(flipSides ? -1 : 1, 0, 0), 0),
    [flipSides]
  ); // keeps right half

  // Build sets per side from DB mesh_name
  const strengthenLeft = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'strengthen' && /_Left$/i.test(m.meshName))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const strengthenRight = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'strengthen' && /_Right$/i.test(m.meshName))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const stretchLeft = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch' && /_Left$/i.test(m.meshName))
      .forEach(m => set.add(norm(getBaseName(m.meshName))));
    return set;
  }, [musclesToHighlight]);

  const stretchRight = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch' && /_Right$/i.test(m.meshName))
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

    const strengthenTargets = musclesToHighlight
      .filter(m => m.actionType === 'strengthen' && m.position)
      .map(m => ({
        pos: new THREE.Vector3(m.position!.x, m.position!.y, m.position!.z).sub(center),
        isLeft: /_Left$/i.test(m.meshName),
        isRight: /_Right$/i.test(m.meshName),
      }));

    const stretchTargets = musclesToHighlight
      .filter(m => m.actionType === 'stretch' && m.position)
      .map(m => ({
        pos: new THREE.Vector3(m.position!.x, m.position!.y, m.position!.z).sub(center),
        isLeft: /_Left$/i.test(m.meshName),
        isRight: /_Right$/i.test(m.meshName),
      }));

    // Tweakable: distance threshold for matching DB point -> mesh.
    const MATCH_EPS = 0.25;

    const matchByPosition = (meshCenter: THREE.Vector3) => {
      let best: { type: 'strengthen' | 'stretch'; dist: number; isLeft: boolean; isRight: boolean } | null = null;

      for (const t of strengthenTargets) {
        const d = t.pos.distanceTo(meshCenter);
        if (d <= MATCH_EPS && (!best || d < best.dist)) best = { type: 'strengthen', dist: d, isLeft: t.isLeft, isRight: t.isRight };
      }

      for (const t of stretchTargets) {
        const d = t.pos.distanceTo(meshCenter);
        if (d <= MATCH_EPS && (!best || d < best.dist)) best = { type: 'stretch', dist: d, isLeft: t.isLeft, isRight: t.isRight };
      }

      return best;
    };

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      child.updateWorldMatrix(true, false);

      const meshNameRaw = (child.name || '').trim();
      const meshName = norm(meshNameRaw);
      const meshBase = norm(getBaseName(cleanName(meshNameRaw)));

      // Use mesh bounding box center (in the clone's local space after centering)
      const meshBox = new THREE.Box3().setFromObject(child);
      const meshCenter = meshBox.getCenter(new THREE.Vector3());

      // Preferred: coordinate matching (ignores Left/Right naming completely)
      const matchedByPosition = hasPositionData ? matchByPosition(meshCenter) : null;
      const isStrengthenByPos = matchedByPosition?.type === 'strengthen';
      const isStretchByPos = matchedByPosition?.type === 'stretch';

      // Fallback: name-based matching (base-name only; no side splitting)
      const isStrengthenByName = strengthenExact.has(meshName) || strengthenBaseAll.has(meshBase);
      const isStretchByName = stretchExact.has(meshName) || stretchBaseAll.has(meshBase);

      const isStrengthen = isStrengthenByPos || isStrengthenByName;
      const isStretch = isStretchByPos || isStretchByName;

      // Determine if we should clip to show only left or right half
      let clipSide: 'left' | 'right' | null = null;
      if (matchedByPosition) {
        if (matchedByPosition.isLeft) clipSide = 'left';
        else if (matchedByPosition.isRight) clipSide = 'right';
      } else if (isStrengthenByName) {
        if (strengthenLeft.has(meshBase)) clipSide = 'left';
        else if (strengthenRight.has(meshBase)) clipSide = 'right';
      } else if (isStretchByName) {
        if (stretchLeft.has(meshBase)) clipSide = 'left';
        else if (stretchRight.has(meshBase)) clipSide = 'right';
      }

      const clippingPlanes: THREE.Plane[] = 
        clipSide === 'left' ? [leftClipPlane] : 
        clipSide === 'right' ? [rightClipPlane] : 
        [];

      if (isStrengthen) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#ef4444',
          roughness: 0.5,
          metalness: 0.1,
          clippingPlanes,
          clipShadows: true,
        });
        child.visible = true;
        return;
      }

      if (isStretch) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#f59e0b',
          roughness: 0.5,
          metalness: 0.1,
          clippingPlanes,
          clipShadows: true,
        });
        child.visible = true;
        return;
      }

      // No clipping for background wireframe - show full model
      child.material = new THREE.MeshStandardMaterial({
        color: '#d1d5db',
        wireframe: true,
        transparent: true,
        opacity: 0.25,
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

  // Get unique muscle names by type
  const strengthenMuscles = useMemo(() => {
    return [...new Set(musclesToHighlight
      .filter(m => m.actionType === 'strengthen')
      .map(m => m.meshName.replace(/_Left$|_Right$/i, '').replace(/_/g, ' ')))];
  }, [musclesToHighlight]);

  const stretchMuscles = useMemo(() => {
    return [...new Set(musclesToHighlight
      .filter(m => m.actionType === 'stretch')
      .map(m => m.meshName.replace(/_Left$|_Right$/i, '').replace(/_/g, ' ')))];
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
            posture_issues,
            squat_issues,
            single_leg_squat_issues
          )
        `)
        .eq('user_id', userId)
        .order('test_date', { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;

      if (!sessionData || sessionData.length === 0) {
        setHasData(false);
        setLoading(false);
        return;
      }

      const functionalData = Array.isArray(sessionData[0].functional_test_data) 
        ? sessionData[0].functional_test_data[0] 
        : sessionData[0].functional_test_data;

      if (!functionalData) {
        setHasData(false);
        setLoading(false);
        return;
      }

      // 2. Collect all issues
      const allIssues: { name: string; category: string }[] = [];
      
      if (functionalData.posture_issues) {
        functionalData.posture_issues.forEach((issue: string) => {
          allIssues.push({ name: issue, category: 'posture' });
        });
      }
      
      if (functionalData.squat_issues) {
        functionalData.squat_issues.forEach((issue: string) => {
          allIssues.push({ name: issue, category: 'squat' });
        });
      }
      
      if (functionalData.single_leg_squat_issues) {
        functionalData.single_leg_squat_issues.forEach((issue: string) => {
          allIssues.push({ name: issue, category: 'single_leg_squat' });
        });
      }

      if (allIssues.length === 0) {
        setHasData(false);
        setLoading(false);
        return;
      }

      // 3. Get muscle mappings for all issues
      const issueNames = allIssues.map(i => i.name);
      
      const { data: mappings, error: mappingsError } = await supabase
        .from('functional_issue_muscle_mappings')
        .select(`
          muscle_id,
          action_type,
          issue_name,
          muscles (
            id,
            name,
            mesh_name,
            position_x,
            position_y,
            position_z
          )
        `)
        .in('issue_name', issueNames);

      if (mappingsError) throw mappingsError;

      if (!mappings || mappings.length === 0) {
        setHasData(false);
        setLoading(false);
        return;
      }

      // 4. Create muscle data for highlighting
      const muscleDataMap = new Map<string, MuscleData>();
      
      mappings.forEach((mapping: any) => {
        const muscle = mapping.muscles;
        if (!muscle || !muscle.mesh_name) return;

        const posValid =
          muscle.position_x !== null &&
          muscle.position_y !== null &&
          muscle.position_z !== null;

        // Strengthen takes priority over stretch
        if (!muscleDataMap.has(muscle.mesh_name) || mapping.action_type === 'strengthen') {
          muscleDataMap.set(muscle.mesh_name, {
            meshName: muscle.mesh_name,
            actionType: mapping.action_type as 'stretch' | 'strengthen',
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

      console.log('[BodyMapCard] highlight muscles:', muscleArray.map(m => m.meshName));

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
      <div className="w-full max-w-2xl h-[300px] rounded-none bg-white border border-gray-200 relative">
        {/* Labels - Clickable */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
          <button 
            onClick={() => setStrengthenDialogOpen(true)}
            className="flex items-center gap-1.5 hover:bg-gray-100 px-1 py-0.5 transition-colors cursor-pointer"
          >
            <div className="w-3 h-3 bg-[#ef4444] rounded-none"></div>
            <span className="text-[10px] text-gray-700">Ενδυνάμωση ({strengthenMuscles.length})</span>
          </button>
          <button 
            onClick={() => setStretchDialogOpen(true)}
            className="flex items-center gap-1.5 hover:bg-gray-100 px-1 py-0.5 transition-colors cursor-pointer"
          >
            <div className="w-3 h-3 bg-[#f59e0b] rounded-none"></div>
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
            <HumanModelWithMuscles musclesToHighlight={musclesToHighlight} />
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
              <div className="w-4 h-4 bg-[#ef4444] rounded-none"></div>
              Μύες για Ενδυνάμωση
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {strengthenMuscles.length > 0 ? (
              strengthenMuscles.map((muscle, index) => (
                <div key={index} className="py-2 px-3 bg-red-50 border-l-2 border-[#ef4444] text-sm">
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
              <div className="w-4 h-4 bg-[#f59e0b] rounded-none"></div>
              Μύες για Διάταση
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {stretchMuscles.length > 0 ? (
              stretchMuscles.map((muscle, index) => (
                <div key={index} className="py-2 px-3 bg-amber-50 border-l-2 border-[#f59e0b] text-sm">
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

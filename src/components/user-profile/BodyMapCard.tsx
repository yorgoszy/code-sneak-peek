import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

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

// Midline muscles (κεντρικοί μύες χωρίς Left/Right)
const midlineMuscles = new Set([
  'Rectus_Abdominis',
  'rectus_abdominis',
  'Spinalis_Thoracis',
  'spinalis_thoracis',
  'Longissimus_Thoracis',
  'longissimus_thoracis',
  'Splenius_Cervicis',
  'splenius_cervicis',
]);

interface MuscleData {
  meshName: string;
  actionType: 'stretch' | 'strengthen';
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

  // Build match sets from DB mesh names
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

  // Strict split at x=0 so each side shows only its half
  const CLIP_EPS = 0.001;
  const leftClipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), -CLIP_EPS), []); // keep x < 0
  const rightClipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(1, 0, 0), -CLIP_EPS), []); // keep x > 0

  const clonedObj = useMemo(() => {
    const clone = obj.clone(true);

    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const meshNameRaw = (child.name || '').trim();
      const meshName = norm(meshNameRaw);
      const meshBase = norm(getBaseName(cleanName(meshNameRaw)));

      // Determine side:
      // Prefer explicit OBJ suffix, otherwise use world-space bounding-box center.
      const cleanRaw = cleanName(meshNameRaw);
      const nameLeft = /_Left$/i.test(cleanRaw);
      const nameRight = /_Right$/i.test(cleanRaw);

      const worldBox = new THREE.Box3().setFromObject(child);
      const worldCenter = worldBox.getCenter(new THREE.Vector3());
      const x = worldCenter.x;

      // Very small epsilon: only truly central meshes are treated as midline.
      const MID_EPS = 0.001;
      const isMidline = Math.abs(x) < MID_EPS;

      const side: 'left' | 'right' | 'mid' = nameLeft
        ? 'left'
        : nameRight
          ? 'right'
          : isMidline
            ? 'mid'
            : x < 0
              ? 'left'
              : 'right';

      const useSided = hasSidedData;

      // Match order: exact -> base(+side) -> base(all)
      const isStrengthen =
        strengthenExact.has(meshName) ||
        (useSided
          ? (side === 'left' && strengthenLeftBase.has(meshBase)) || (side === 'right' && strengthenRightBase.has(meshBase))
          : strengthenBaseAll.has(meshBase));

      const isStretch =
        stretchExact.has(meshName) ||
        (useSided
          ? (side === 'left' && stretchLeftBase.has(meshBase)) || (side === 'right' && stretchRightBase.has(meshBase))
          : stretchBaseAll.has(meshBase));

      // Apply clipping per-side
      const clippingPlanes: THREE.Plane[] = side === 'left' ? [leftClipPlane] : side === 'right' ? [rightClipPlane] : [];

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

      child.material = new THREE.MeshStandardMaterial({
        color: '#d1d5db',
        wireframe: true,
        transparent: true,
        opacity: 0.25,
        clippingPlanes,
        clipShadows: true,
      });
      child.visible = true;
    });

    return clone;
  }, [
    obj,
    strengthenExact,
    stretchExact,
    strengthenLeftBase,
    strengthenRightBase,
    stretchLeftBase,
    stretchRightBase,
    strengthenBaseAll,
    stretchBaseAll,
    hasSidedData,
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
  const { t } = useTranslation();
  const [musclesToHighlight, setMusclesToHighlight] = useState<MuscleData[]>([]);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);

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
            mesh_name
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
        if (muscle && muscle.mesh_name) {
          const key = `${muscle.mesh_name}-${mapping.action_type}`;
          // Strengthen takes priority over stretch
          if (!muscleDataMap.has(muscle.mesh_name) || mapping.action_type === 'strengthen') {
            muscleDataMap.set(muscle.mesh_name, {
              meshName: muscle.mesh_name,
              actionType: mapping.action_type as 'stretch' | 'strengthen'
            });
          }
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

  const strengthenCount = musclesToHighlight.filter(m => m.actionType === 'strengthen').length;
  const stretchCount = musclesToHighlight.filter(m => m.actionType === 'stretch').length;

  return (
    <div className="w-full max-w-2xl h-[300px] rounded-none bg-white border border-gray-200 relative">
      {/* Labels */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#ef4444] rounded-none"></div>
          <span className="text-[10px] text-gray-700">Ενδυνάμωση</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#f59e0b] rounded-none"></div>
          <span className="text-[10px] text-gray-700">Διάταση</span>
        </div>
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
  );
};

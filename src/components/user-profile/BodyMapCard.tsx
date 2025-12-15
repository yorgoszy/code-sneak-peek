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

function HumanModelWithMuscles({ musclesToHighlight, clippingPlane }: { musclesToHighlight: MuscleData[], clippingPlane?: THREE.Plane }) {
  const obj = useLoader(OBJLoader, MODEL_URL);
  
  // Create sets with base names for matching
  const strengthenBaseNames = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'strengthen')
      .forEach(m => {
        const baseName = getBaseName(m.meshName);
        set.add(baseName);
        set.add(baseName.toLowerCase());
      });
    return set;
  }, [musclesToHighlight]);

  const stretchBaseNames = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch')
      .forEach(m => {
        const baseName = getBaseName(m.meshName);
        set.add(baseName);
        set.add(baseName.toLowerCase());
      });
    return set;
  }, [musclesToHighlight]);

  const clonedObj = useMemo(() => {
    const clone = obj.clone(true);
    
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = (child.name || '').trim();
        const meshBaseName = getBaseName(meshName);
        const meshBaseNameLower = meshBaseName.toLowerCase();

        // Match by base name (ignores _Left/_Right)
        const isStrengthen = strengthenBaseNames.has(meshBaseName) || strengthenBaseNames.has(meshBaseNameLower);
        const isStretch = stretchBaseNames.has(meshBaseName) || stretchBaseNames.has(meshBaseNameLower);

        const clippingPlanes = clippingPlane ? [clippingPlane] : [];

        if (isStrengthen) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#ef4444',
            roughness: 0.5,
            metalness: 0.1,
            clippingPlanes,
            clipShadows: true,
          });
          child.visible = true;
        } else if (isStretch) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#f59e0b',
            roughness: 0.5,
            metalness: 0.1,
            clippingPlanes,
            clipShadows: true,
          });
          child.visible = true;
        } else {
          child.material = new THREE.MeshStandardMaterial({
            color: '#6b7280',
            wireframe: true,
            transparent: true,
            opacity: 0.25,
            clippingPlanes,
            clipShadows: true,
          });
          child.visible = true;
        }
      }
    });
    
    return clone;
  }, [obj, strengthenBaseNames, stretchBaseNames, clippingPlane]);

  return (
    <primitive 
      object={clonedObj} 
      scale={1.43} 
      rotation={[0, 0, 0]}
      position={[0, 5, 0]}
    />
  );
}

// Component that shows only half of the body using clipping
function HalfBodyClipped({ musclesToHighlight }: { musclesToHighlight: MuscleData[] }) {
  // Clipping plane at x=0, showing only x > 0 (right side of the body)
  const clippingPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), []);
  
  return <HumanModelWithMuscles musclesToHighlight={musclesToHighlight} clippingPlane={clippingPlane} />;
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
    <div className="w-[220px] h-[380px]">
      <Canvas
        camera={{ position: [3, 5, 5], fov: 50 }}
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
          target={[0, 6, 0]}
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
};

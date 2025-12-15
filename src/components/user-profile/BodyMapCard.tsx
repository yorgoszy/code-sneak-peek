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

function HumanModelWithMuscles({ musclesToHighlight }: { musclesToHighlight: MuscleData[] }) {
  const obj = useLoader(OBJLoader, MODEL_URL);
  
  // Create sets for quick lookup
  const strengthenMeshes = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'strengthen')
      .forEach(m => {
        set.add(m.meshName);
        set.add(m.meshName.toLowerCase());
        // Add Left/Right variants for midline muscles
        if (midlineMuscles.has(m.meshName)) {
          set.add(`${m.meshName}_Left`);
          set.add(`${m.meshName}_Right`);
        }
      });
    return set;
  }, [musclesToHighlight]);

  const stretchMeshes = useMemo(() => {
    const set = new Set<string>();
    musclesToHighlight
      .filter(m => m.actionType === 'stretch')
      .forEach(m => {
        set.add(m.meshName);
        set.add(m.meshName.toLowerCase());
        // Add Left/Right variants for midline muscles
        if (midlineMuscles.has(m.meshName)) {
          set.add(`${m.meshName}_Left`);
          set.add(`${m.meshName}_Right`);
        }
      });
    return set;
  }, [musclesToHighlight]);

  // Clone the object to avoid modifying the cached version
  const clonedObj = useMemo(() => {
    const clone = obj.clone(true);
    
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name || '';
        
        // Check if this mesh should be highlighted
        const isStrengthen = strengthenMeshes.has(meshName);
        const isStretch = stretchMeshes.has(meshName);
        
        if (isStrengthen) {
          // Red for strengthen
          child.material = new THREE.MeshStandardMaterial({
            color: '#ef4444',
            roughness: 0.5,
            metalness: 0.1,
            transparent: false,
            opacity: 1,
          });
          child.visible = true;
        } else if (isStretch) {
          // Yellow/Amber for stretch
          child.material = new THREE.MeshStandardMaterial({
            color: '#f59e0b',
            roughness: 0.5,
            metalness: 0.1,
            transparent: false,
            opacity: 1,
          });
          child.visible = true;
        } else {
          // Hide non-highlighted meshes or show as wireframe
          child.material = new THREE.MeshStandardMaterial({
            color: '#333333',
            wireframe: true,
            transparent: true,
            opacity: 0.1,
          });
          child.visible = true;
        }
      }
    });
    
    return clone;
  }, [obj, strengthenMeshes, stretchMeshes]);

  return (
    <primitive 
      object={clonedObj} 
      scale={0.65} 
      rotation={[0, 0, 0]}
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
    <Card className="rounded-none border-border bg-black/95 max-w-[200px]">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-xs font-medium text-[#00ffba]">
          {t('progress.bodyMap', 'Χάρτης Σώματος')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="w-full h-[200px]">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Suspense fallback={<Loader />}>
              <HumanModelWithMuscles musclesToHighlight={musclesToHighlight} />
            </Suspense>
            <OrbitControls 
              enableZoom={true}
              enablePan={false}
              minDistance={3}
              maxDistance={10}
            />
          </Canvas>
        </div>

        {/* Legend with counts */}
        <div className="flex justify-center gap-3 mt-1 text-[9px]">
          {strengthenCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-gray-400">Ενδ. ({strengthenCount})</span>
            </div>
          )}
          {stretchCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-gray-400">Διατ. ({stretchCount})</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

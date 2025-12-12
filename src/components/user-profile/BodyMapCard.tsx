import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

interface BodyMapCardProps {
  userId: string;
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

function HumanModel() {
  const obj = useLoader(OBJLoader, MODEL_URL);
  
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    obj.position.sub(center);
    
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry;
        const positionAttribute = geometry.getAttribute('position');
        
        if (positionAttribute) {
          const colors = new Float32Array(positionAttribute.count * 3);
          
          for (let i = 0; i < positionAttribute.count; i++) {
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
            
            // Normalize Y position (0 = feet, 1 = head)
            const normalizedY = (y - box.min.y) / size.y;
            const isBack = z < 0; // Back side
            
            // Default green
            let r = 0, g = 1, b = 0.73;
            
            // Gluteus maximus region: back side, hip level (roughly 45-55% height)
            if (isBack && normalizedY >= 0.42 && normalizedY <= 0.52) {
              r = 1; g = 0; b = 0; // Red
            }
            
            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;
          }
          
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        }
        
        child.material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          wireframe: true,
          transparent: true,
          opacity: 0.8,
        });
      }
    });
  }, [obj]);

  return (
    <primitive 
      object={obj} 
      scale={0.54} 
      rotation={[0, 0, 0]}
    />
  );
}

export const BodyMapCard: React.FC<BodyMapCardProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [strengthenMuscles, setStrengthenMuscles] = useState<string[]>([]);
  const [stretchMuscles, setStretchMuscles] = useState<string[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetchFunctionalData();
  }, [userId]);

  const fetchFunctionalData = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;

      if (data && data.length > 0) {
        setHasData(true);
        
        if (data[0].functional_test_data) {
          const functionalData = Array.isArray(data[0].functional_test_data) 
            ? data[0].functional_test_data[0] 
            : data[0].functional_test_data;
          
          const strengthening = functionalData?.muscles_need_strengthening || [];
          const stretching = functionalData?.muscles_need_stretching || [];
          
          setStrengthenMuscles(strengthening);
          setStretchMuscles(stretching);
        }
      }
    } catch (error) {
      console.error('Error fetching functional data:', error);
    }
  };

  if (!hasData) {
    return null;
  }

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
              <HumanModel />
            </Suspense>
            <OrbitControls 
              enableZoom={true}
              enablePan={false}
              minDistance={3}
              maxDistance={10}
            />
          </Canvas>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-3 mt-1 text-[9px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Ενδ.</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-gray-400">Διατ.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
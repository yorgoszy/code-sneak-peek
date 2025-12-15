import React, { useEffect, useCallback, Suspense, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const MODEL_URL = 'https://dicwdviufetibnafzipa.supabase.co/storage/v1/object/public/models/Ecorche_by_AlexLashko_ShrunkenView.obj';

interface ClickPosition {
  x: number;
  y: number;
  z: number;
}

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
function MuscleMarker({ position, color }: { position: [number, number, number]; color: string }) {
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
  placedMuscles,
  onMeshClick
}: { 
  onClickPosition: (pos: ClickPosition) => void;
  isSelecting: boolean;
  placedMuscles: Array<{ position: [number, number, number]; name: string }>;
  onMeshClick?: (meshName: string) => void;
}) {
  const obj = useLoader(OBJLoader, MODEL_URL);
  const { raycaster, camera, pointer } = useThree();
  const [hoveredMesh, setHoveredMesh] = useState<string | null>(null);
  
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
    
    // Store original materials and list all mesh names
    const meshNames: string[] = [];
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshNames.push(child.name || 'unnamed');
        child.userData.originalMaterial = new THREE.MeshStandardMaterial({
          color: '#cc8866',
          roughness: 0.7,
          metalness: 0.1,
        });
        child.material = child.userData.originalMaterial.clone();
      }
    });
    console.log('📋 Mesh names in model:', meshNames);
  }, [obj]);

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(obj, true);
    
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const baseMeshName = clickedObject.name || 'unnamed';
      const point = intersects[0].point;
      
      // Διαχωρισμός αριστερά/δεξιά βάσει θέσης x
      const side = point.x > 0 ? 'Right' : 'Left';
      const meshNameWithSide = `${baseMeshName}_${side}`;
      
      console.log('🎯 Clicked mesh:', baseMeshName, '| Side:', side, '| Full name:', meshNameWithSide);
      console.log('📍 Click position:', { x: point.x.toFixed(4), y: point.y.toFixed(4), z: point.z.toFixed(4) });
      
      if (onMeshClick) {
        onMeshClick(meshNameWithSide);
      }
      
      if (isSelecting) {
        onClickPosition({
          x: parseFloat(point.x.toFixed(4)),
          y: parseFloat(point.y.toFixed(4)),
          z: parseFloat(point.z.toFixed(4))
        });
      }
    }
  }, [isSelecting, raycaster, camera, pointer, obj, onClickPosition, onMeshClick]);

  const handlePointerMove = useCallback((event: any) => {
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(obj, true);
    
    // Reset all materials first
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.originalMaterial) {
        child.material = child.userData.originalMaterial.clone();
      }
    });
    
    if (intersects.length > 0) {
      const hoveredObject = intersects[0].object as THREE.Mesh;
      const meshName = hoveredObject.name || 'unnamed';
      setHoveredMesh(meshName);
      
      // Highlight hovered mesh
      hoveredObject.material = new THREE.MeshStandardMaterial({
        color: '#00ffba',
        roughness: 0.5,
        metalness: 0.2,
        emissive: '#00ffba',
        emissiveIntensity: 0.3,
      });
    } else {
      setHoveredMesh(null);
    }
  }, [raycaster, camera, pointer, obj]);

  return (
    <group>
      <primitive 
        object={obj} 
        scale={1.5}
        rotation={[0, 0, 0]}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
      />
      {placedMuscles.map((muscle, index) => (
        <MuscleMarker 
          key={index} 
          position={muscle.position} 
          color="#ff4444"
        />
      ))}
      {hoveredMesh && (
        <Html center position={[0, 2, 0]}>
          <div className="bg-black/80 text-[#00ffba] px-3 py-1 text-sm font-mono whitespace-nowrap">
            {hoveredMesh}
          </div>
        </Html>
      )}
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

interface Muscle3DCanvasProps {
  placedMuscles: Array<{ position: [number, number, number]; name: string }>;
  pendingPosition: { x: number; y: number; z: number } | null;
  isSelecting: boolean;
  selectedMuscleName?: string;
  onClickPosition: (pos: ClickPosition) => void;
  onMeshClick?: (meshName: string) => void;
}

const Muscle3DCanvas: React.FC<Muscle3DCanvasProps> = ({
  placedMuscles,
  pendingPosition,
  isSelecting,
  selectedMuscleName,
  onClickPosition,
  onMeshClick
}) => {
  return (
    <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] bg-black/95 relative touch-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <Suspense fallback={<Loader />}>
          <InteractiveHumanModel 
            onClickPosition={onClickPosition}
            isSelecting={isSelecting}
            placedMuscles={placedMuscles}
            onMeshClick={onMeshClick}
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
      {isSelecting && selectedMuscleName && (
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 bg-[#00ffba] text-black px-2 sm:px-4 py-1 sm:py-2 rounded-none text-xs sm:text-sm font-medium max-w-[90%] text-center">
          <span className="hidden sm:inline">Κάνε click στο σημείο του μυός: </span>
          <span className="sm:hidden">Click: </span>
          {selectedMuscleName}
        </div>
      )}
    </div>
  );
};

export default Muscle3DCanvas;

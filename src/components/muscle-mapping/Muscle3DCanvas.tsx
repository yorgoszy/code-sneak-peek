import React, { useEffect, useCallback, Suspense, useState, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

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

// Interactive Human Model
function InteractiveHumanModel({ 
  isSelecting,
  onMeshClick,
  searchQuery,
  mappedMeshNames
}: { 
  isSelecting: boolean;
  onMeshClick?: (meshName: string) => void;
  searchQuery: string;
  mappedMeshNames: string[];
}) {
  const obj = useLoader(OBJLoader, MODEL_URL);
  const { raycaster, camera, pointer } = useThree();
  const [hoveredMesh, setHoveredMesh] = useState<string | null>(null);
  const [allMeshNames, setAllMeshNames] = useState<string[]>([]);
  
  // Get base mesh name (without _Left/_Right)
  const getBaseMeshName = (fullName: string) => {
    return fullName.replace(/_Left$|_Right$/, '');
  };

  // Check if mesh matches search query
  const matchesSearch = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const query = searchQuery.toLowerCase();
    return new Set(
      allMeshNames.filter(name => name.toLowerCase().includes(query))
    );
  }, [searchQuery, allMeshNames]);

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
    setAllMeshNames(meshNames);
    console.log('📋 All mesh names:', meshNames);
  }, [obj]);

  // Highlight meshes based on search query and mapped status
  useEffect(() => {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name || 'unnamed';
        
        // Check if this mesh is mapped (either side)
        const isMapped = mappedMeshNames.some(mapped => 
          getBaseMeshName(mapped) === meshName
        );
        
        // Check if matches search
        const matchesSearchQuery = matchesSearch.has(meshName);
        
        if (matchesSearchQuery) {
          // Highlight search matches in cyan
          child.material = new THREE.MeshStandardMaterial({
            color: '#00ffba',
            roughness: 0.5,
            metalness: 0.2,
            emissive: '#00ffba',
            emissiveIntensity: 0.4,
          });
        } else if (isMapped) {
          // Show mapped muscles in gold
          child.material = new THREE.MeshStandardMaterial({
            color: '#cb8954',
            roughness: 0.5,
            metalness: 0.3,
            emissive: '#cb8954',
            emissiveIntensity: 0.2,
          });
        } else if (child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial.clone();
        }
      }
    });
  }, [obj, matchesSearch, mappedMeshNames]);

  // Μύες που δεν χρειάζονται διαχωρισμό Left/Right (κεντρικοί μύες)
  const midlineMuscles = useMemo(() => new Set([
    'Latissimus_Dorsi',
    'Trapezius',
    'Rectus_Abdominis',
    'Erector_Spinae',
    'Sternum',
    // Πρόσθεσε περισσότερους εδώ αν χρειάζεται
  ]), []);

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    
    if (!isSelecting) return;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(obj, true);
    
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const baseMeshName = clickedObject.name || 'unnamed';
      const point = intersects[0].point;
      
      // Διαχωρισμός αριστερά/δεξιά μόνο αν δεν είναι midline muscle
      let finalMeshName = baseMeshName;
      if (!midlineMuscles.has(baseMeshName)) {
        const side = point.x > 0 ? 'Right' : 'Left';
        finalMeshName = `${baseMeshName}_${side}`;
      }
      
      console.log('🎯 Clicked mesh:', baseMeshName, '| Final name:', finalMeshName);
      
      if (onMeshClick) {
        onMeshClick(finalMeshName);
      }
    }
  }, [isSelecting, raycaster, camera, pointer, obj, onMeshClick, midlineMuscles]);

  const handlePointerMove = useCallback((event: any) => {
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(obj, true);
    
    if (intersects.length > 0) {
      const hoveredObject = intersects[0].object as THREE.Mesh;
      const meshName = hoveredObject.name || 'unnamed';
      const point = intersects[0].point;
      const side = point.x > 0 ? 'Right' : 'Left';
      setHoveredMesh(`${meshName} (${side})`);
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

interface Muscle3DCanvasProps {
  isSelecting: boolean;
  selectedMuscleName?: string;
  onMeshClick?: (meshName: string) => void;
  searchQuery: string;
  mappedMeshNames: string[];
}

const Muscle3DCanvas: React.FC<Muscle3DCanvasProps> = ({
  isSelecting,
  selectedMuscleName,
  onMeshClick,
  searchQuery,
  mappedMeshNames
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
            isSelecting={isSelecting}
            onMeshClick={onMeshClick}
            searchQuery={searchQuery}
            mappedMeshNames={mappedMeshNames}
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
          <span className="hidden sm:inline">Κάνε click στον μυ: </span>
          <span className="sm:hidden">Click: </span>
          {selectedMuscleName}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1 text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#cb8954]"></div>
          <span className="text-white/80">Αντιστοιχισμένοι</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00ffba]"></div>
          <span className="text-white/80">Αποτελέσματα αναζήτησης</span>
        </div>
      </div>
    </div>
  );
};

export default Muscle3DCanvas;
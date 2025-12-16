import React, { useEffect, useCallback, Suspense, useState, useMemo, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const MODEL_URL = 'https://dicwdviufetibnafzipa.supabase.co/storage/v1/object/public/models/Ecorche_by_AlexLashko_ShrunkenView.obj';

// Helper to determine view side based on camera angle
type ViewSide = 'front' | 'back' | 'left' | 'right';

const getViewSide = (azimuthAngle: number): ViewSide => {
  // Normalize angle to 0-360
  const angle = ((azimuthAngle * 180 / Math.PI) % 360 + 360) % 360;
  
  // Front: 315-45° (looking at face)
  // Right side: 45-135°
  // Back: 135-225° (looking at back)
  // Left side: 225-315°
  if (angle >= 315 || angle < 45) return 'front';
  if (angle >= 45 && angle < 135) return 'right';
  if (angle >= 135 && angle < 225) return 'back';
  return 'left';
};

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

// Μύες που έχουν υπο-μέρη (sub-parts) - popup επιλογής
const musclesWithSubParts: Record<string, { name: string; parts: { id: string; label: string; isMidline: boolean }[] }> = {
  'Trapezius': {
    name: 'Τραπεζοειδής',
    parts: [
      { id: 'Upper', label: 'Άνω Μοίρα', isMidline: false },
      { id: 'Middle', label: 'Μεσαία Μοίρα', isMidline: true },
      { id: 'Lower', label: 'Κάτω Μοίρα', isMidline: true },
    ]
  }
};

// Interactive Human Model
function InteractiveHumanModel({ 
  isSelecting,
  onMeshClick,
  searchQuery,
  mappedMeshNames,
  onSearchResults,
  onMeshNamesLoaded,
  selectedSearchMesh,
  onShowSubPartSelector
}: { 
  isSelecting: boolean;
  onMeshClick?: (meshName: string) => void;
  searchQuery: string;
  mappedMeshNames: string[];
  onSearchResults?: (count: number, matches: string[]) => void;
  onMeshNamesLoaded?: (names: string[]) => void;
  selectedSearchMesh?: string | null;
  onShowSubPartSelector?: (meshName: string, side: 'Left' | 'Right') => void;
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
    const matches = allMeshNames.filter(name => name.toLowerCase().includes(query));
    return new Set(matches);
  }, [searchQuery, allMeshNames]);

  // Report search results count and matches
  useEffect(() => {
    if (onSearchResults) {
      onSearchResults(matchesSearch.size, Array.from(matchesSearch));
    }
  }, [matchesSearch, onSearchResults]);

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
    if (onMeshNamesLoaded) {
      onMeshNamesLoaded(meshNames);
    }
    console.log('📋 All mesh names:', meshNames);
  }, [obj, onMeshNamesLoaded]);

  // Highlight meshes based on selected mesh, search query and mapped status
  useEffect(() => {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name || 'unnamed';
        
        child.visible = true;
        
        // Check if this is the selected mesh from search
        const isSelectedMesh = selectedSearchMesh === meshName;
        
        // Check if this mesh is mapped
        const isMapped = mappedMeshNames.some(mapped => 
          getBaseMeshName(mapped) === meshName || mapped === meshName
        );
        
        // Check if matches search (but not selected)
        const matchesSearchQuery = matchesSearch.has(meshName);
        
        if (isSelectedMesh) {
          // Bright highlight for selected mesh - BRIGHT GREEN with strong glow
          child.material = new THREE.MeshStandardMaterial({
            color: '#00ff00',
            roughness: 0.3,
            metalness: 0.4,
            emissive: '#00ff00',
            emissiveIntensity: 0.8,
          });
        } else if (matchesSearchQuery && !selectedSearchMesh) {
          // Cyan highlight for search matches (only if no specific selection)
          child.material = new THREE.MeshStandardMaterial({
            color: '#00ffba',
            roughness: 0.5,
            metalness: 0.2,
            emissive: '#00ffba',
            emissiveIntensity: 0.4,
          });
        } else if (isMapped) {
          // Gold for mapped muscles
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
  }, [obj, matchesSearch, mappedMeshNames, selectedSearchMesh]);

  // Μύες που δεν χρειάζονται διαχωρισμό Left/Right (κεντρικοί μύες)
  const midlineMuscles = useMemo(() => new Set([
    'Latissimus_Dorsi',
    'Rectus_Abdominis',
    'Erector_Spinae',
    'Sternum',
    'Splenius_Capitis',
    'Splenius_Cervicis',
    'Rhomboideus',
    'Infraspinatus',
    'Longissimus_Thoracis',
    'Spinalis_Thoracis',
  ]), []);

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    
    if (!isSelecting) return;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(obj, true);
    
    if (intersects.length > 0) {
      let targetMeshName: string | null = null;
      
      // If we have a selected search mesh, only accept clicks on that mesh
      if (selectedSearchMesh) {
        const matchingIntersect = intersects.find(intersect => {
          const name = intersect.object.name || 'unnamed';
          return name === selectedSearchMesh;
        });
        
        if (matchingIntersect) {
          targetMeshName = selectedSearchMesh;
        } else {
          console.log('⚠️ Κλικ μόνο στο επιλεγμένο mesh:', selectedSearchMesh);
          return;
        }
      } else {
        // No specific selection - use first intersect
        targetMeshName = intersects[0].object.name || 'unnamed';
      }
      
      if (!targetMeshName) return;
      
      console.log('🎯 Clicked exact mesh:', targetMeshName);
      
      // Check if midline muscle (no side needed)
      if (midlineMuscles.has(targetMeshName)) {
        if (onMeshClick) {
          onMeshClick(targetMeshName);
        }
        return;
      }
      
      // Non-midline: needs side confirmation
      if (onMeshClick) {
        onMeshClick(`${targetMeshName}__NEEDS_SIDE__`);
      }
    }
  }, [isSelecting, raycaster, camera, pointer, obj, onMeshClick, midlineMuscles, selectedSearchMesh]);

  const handlePointerMove = useCallback((event: any) => {
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(obj, true);
    
    if (intersects.length > 0) {
      const meshName = intersects[0].object.name || 'unnamed';
      
      // If we have a selected mesh, only show that one
      if (selectedSearchMesh) {
        const matchingIntersect = intersects.find(i => i.object.name === selectedSearchMesh);
        if (matchingIntersect) {
          setHoveredMesh(selectedSearchMesh);
        } else {
          setHoveredMesh(null);
        }
      } else {
        setHoveredMesh(meshName);
      }
    } else {
      setHoveredMesh(null);
    }
  }, [raycaster, camera, pointer, obj, selectedSearchMesh]);

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

// Side Confirmation Popup (for selecting Left/Right after click)
interface SideConfirmationProps {
  muscleName: string;
  viewSide: ViewSide;
  onSelect: (fullName: string) => void;
  onClose: () => void;
}

const SideConfirmation: React.FC<SideConfirmationProps> = ({ muscleName, viewSide, onSelect, onClose }) => {
  // Determine which button is "visually left" and "visually right" based on view angle
  // When viewing from the back, anatomical left appears on the right side of screen
  const isBackView = viewSide === 'back';
  
  const viewLabel = {
    front: 'Μπροστινή Όψη',
    back: 'Πίσω Όψη',
    left: 'Πλάγια Όψη (Αριστερά)',
    right: 'Πλάγια Όψη (Δεξιά)'
  }[viewSide];
  
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-black border border-[#00ffba] p-4 max-w-xs w-full mx-4">
        <h3 className="text-[#00ffba] text-sm font-medium mb-2 text-center">
          {muscleName}
        </h3>
        <p className="text-[#cb8954] text-xs mb-3 text-center">
          📐 {viewLabel}
        </p>
        <p className="text-white/60 text-xs mb-4 text-center">
          Επιλέξτε ανατομική πλευρά:
        </p>
        <div className="flex gap-2">
          {/* Always show anatomical sides, but order based on view for visual consistency */}
          <button
            onClick={() => onSelect(`${muscleName}_Left`)}
            className={`flex-1 py-2 px-3 bg-transparent border text-sm transition-colors rounded-none ${
              isBackView 
                ? 'border-[#00ffba]/50 text-[#00ffba] hover:bg-[#00ffba] hover:text-black order-2' 
                : 'border-[#00ffba]/50 text-[#00ffba] hover:bg-[#00ffba] hover:text-black order-1'
            }`}
          >
            Αριστερά
            <span className="block text-[10px] text-white/40">
              {isBackView ? '(στα δεξιά σου)' : '(στα αριστερά σου)'}
            </span>
          </button>
          <button
            onClick={() => onSelect(`${muscleName}_Right`)}
            className={`flex-1 py-2 px-3 bg-transparent border text-sm transition-colors rounded-none ${
              isBackView 
                ? 'border-[#00ffba]/50 text-[#00ffba] hover:bg-[#00ffba] hover:text-black order-1' 
                : 'border-[#00ffba]/50 text-[#00ffba] hover:bg-[#00ffba] hover:text-black order-2'
            }`}
          >
            Δεξιά
            <span className="block text-[10px] text-white/40">
              {isBackView ? '(στα αριστερά σου)' : '(στα δεξιά σου)'}
            </span>
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 px-3 bg-transparent border border-white/30 text-white/60 text-xs hover:border-white/50 hover:text-white transition-colors rounded-none"
        >
          Ακύρωση
        </button>
      </div>
    </div>
  );
};

// Sub-Part Selector Popup
interface SubPartSelectorProps {
  muscleName: string;
  onSelect: (fullName: string) => void;
  onClose: () => void;
}

const SubPartSelector: React.FC<SubPartSelectorProps> = ({ muscleName, onSelect, onClose }) => {
  const muscleData = musclesWithSubParts[muscleName];
  if (!muscleData) return null;

  const handlePartClick = (part: { id: string; label: string; isMidline: boolean }) => {
    if (part.isMidline) {
      // Κεντρικός μυς -> δεν χρειάζεται πλευρά
      onSelect(`${muscleName}_${part.id}`);
    } else {
      // Χρειάζεται επιλογή πλευράς - return the part name for further processing
      onSelect(`${muscleName}_${part.id}__NEEDS_SIDE__`);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-black border border-[#00ffba] p-4 max-w-xs w-full mx-4">
        <h3 className="text-[#00ffba] text-sm font-medium mb-3 text-center">
          {muscleData.name}
        </h3>
        <p className="text-white/60 text-xs mb-4 text-center">
          Επιλέξτε μοίρα:
        </p>
        <div className="flex flex-col gap-2">
          {muscleData.parts.map((part) => (
            <button
              key={part.id}
              onClick={() => handlePartClick(part)}
              className="w-full py-2 px-3 bg-transparent border border-[#00ffba]/50 text-[#00ffba] text-sm hover:bg-[#00ffba] hover:text-black transition-colors rounded-none"
            >
              {part.label}
              {part.isMidline && <span className="text-white/40 text-xs ml-2">(κεντρικός)</span>}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 px-3 bg-transparent border border-white/30 text-white/60 text-xs hover:border-white/50 hover:text-white transition-colors rounded-none"
        >
          Ακύρωση
        </button>
      </div>
    </div>
  );
};

interface Muscle3DCanvasProps {
  isSelecting: boolean;
  selectedMuscleName?: string;
  onMeshClick?: (meshName: string) => void;
  searchQuery: string;
  mappedMeshNames: string[];
  onSearchResults?: (count: number, matches: string[]) => void;
  onMeshNamesLoaded?: (names: string[]) => void;
  selectedSearchMesh?: string | null;
}

const Muscle3DCanvas: React.FC<Muscle3DCanvasProps> = ({
  isSelecting,
  selectedMuscleName,
  onMeshClick,
  searchQuery,
  mappedMeshNames,
  onSearchResults,
  onMeshNamesLoaded,
  selectedSearchMesh
}) => {
  const [sideConfirmation, setSideConfirmation] = useState<{ muscleName: string } | null>(null);
  const [viewSide, setViewSide] = useState<ViewSide>('front');
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);

  // Update view side periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (orbitControlsRef.current) {
        const azimuth = orbitControlsRef.current.getAzimuthalAngle();
        setViewSide(getViewSide(azimuth));
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Called when user needs to confirm the side (Left/Right)
  const handleShowSideConfirmation = useCallback((muscleName: string) => {
    setSideConfirmation({ muscleName });
  }, []);

  const handleSideSelect = useCallback((fullName: string) => {
    setSideConfirmation(null);
    if (onMeshClick) {
      onMeshClick(fullName);
    }
  }, [onMeshClick]);

  // Handle muscle clicks that need side confirmation
  const handleMeshClickWithSideConfirmation = useCallback((meshName: string) => {
    // Check if it needs side confirmation
    if (meshName.includes('__NEEDS_SIDE__')) {
      const baseName = meshName.replace('__NEEDS_SIDE__', '');
      handleShowSideConfirmation(baseName);
      return;
    }
    
    // Midline muscles pass through directly
    if (onMeshClick) {
      onMeshClick(meshName);
    }
  }, [onMeshClick, handleShowSideConfirmation]);

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
            onMeshClick={handleMeshClickWithSideConfirmation}
            searchQuery={searchQuery}
            mappedMeshNames={mappedMeshNames}
            onSearchResults={onSearchResults}
            onMeshNamesLoaded={onMeshNamesLoaded}
            selectedSearchMesh={selectedSearchMesh}
          />
        </Suspense>
        <OrbitControls 
          ref={orbitControlsRef}
          enableZoom={true}
          enablePan={true}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
      
      {/* Side Confirmation Popup */}
      {sideConfirmation && (
        <SideConfirmation
          muscleName={sideConfirmation.muscleName}
          viewSide={viewSide}
          onSelect={handleSideSelect}
          onClose={() => setSideConfirmation(null)}
        />
      )}
      
      {/* Overlay instructions - show selected mesh */}
      {isSelecting && selectedSearchMesh && (
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 bg-[#00ff00] text-black px-2 sm:px-4 py-1 sm:py-2 rounded-none text-xs sm:text-sm font-medium max-w-[90%] text-center">
          <span className="hidden sm:inline">Κάνε click στο: </span>
          <span className="sm:hidden">Click: </span>
          {selectedSearchMesh}
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
        <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00ff00]"></div>
          <span className="text-white/80">Επιλεγμένος μυς</span>
        </div>
      </div>
    </div>
  );
};

export default Muscle3DCanvas;
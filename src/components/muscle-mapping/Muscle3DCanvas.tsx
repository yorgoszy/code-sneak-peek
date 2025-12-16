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
  onShowSubPartSelector
}: { 
  isSelecting: boolean;
  onMeshClick?: (meshName: string) => void;
  searchQuery: string;
  mappedMeshNames: string[];
  onSearchResults?: (count: number) => void;
  onMeshNamesLoaded?: (names: string[]) => void;
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
    const matches = new Set(
      allMeshNames.filter(name => name.toLowerCase().includes(query))
    );
    return matches;
  }, [searchQuery, allMeshNames]);

  // Report search results count
  useEffect(() => {
    if (onSearchResults) {
      onSearchResults(matchesSearch.size);
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

  // Highlight meshes based on search query and mapped status
  useEffect(() => {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name || 'unnamed';
        
        // Always show all meshes
        child.visible = true;
        
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
    'Rectus_Abdominis',
    'Erector_Spinae',
    'Sternum',
    'Splenius_Capitis',
    'Splenius_Cervicis',
    'splenius_capitis',
    'splenius_cervicis',
    'Rhomboideus',
    'Infraspinatus',
    'infraspinatus',
    'Longissimus_Thoracis',
    'longissimus_thoracis',
    'Spinalis_Thoracis',
    'spinalis_thoracis',
    // Πρόσθεσε περισσότερους εδώ αν χρειάζεται
  ]), []);

  // Ομαδοποίηση meshes σε έναν μυ (πολλά meshes -> ένα όνομα)
  const meshGrouping = useMemo(() => ({
    'Psoas_Major': 'Psoas',
    'Psoas_Minor': 'Psoas',
    'psoas_major': 'Psoas',
    'psoas_minor': 'Psoas',
    'Rhomboideus_Major': 'Rhomboideus',
    'Rhomboideus_Minor': 'Rhomboideus',
    'rhomboideus_major': 'Rhomboideus',
    'rhomboideus_minor': 'Rhomboideus',
    // Σύμπλεγμα Δικεφάλων Μηριαίων (Hamstrings)
    'Semimembranosus': 'Hamstrings_Complex',
    'semimembranosus': 'Hamstrings_Complex',
    'Semitendinosus': 'Hamstrings_Complex',
    'semitendinosus': 'Hamstrings_Complex',
    'Biceps_Femoris_Long_Head': 'Hamstrings_Complex',
    'biceps_femoris_long_head': 'Hamstrings_Complex',
  }), []);

  // Συνάρτηση για να πάρει το grouped name
  const getGroupedMeshName = useCallback((meshName: string) => {
    return meshGrouping[meshName as keyof typeof meshGrouping] || meshName;
  }, [meshGrouping]);

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    
    if (!isSelecting) return;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(obj, true);
    
    if (intersects.length > 0) {
      let targetIntersect = intersects[0];
      let baseMeshName = targetIntersect.object.name || 'unnamed';
      
      // Αν υπάρχει ενεργό search, βρες τον ΠΡΩΤΟ mesh που ταιριάζει με το search
      if (matchesSearch.size > 0) {
        const matchingIntersect = intersects.find(intersect => {
          const name = intersect.object.name || 'unnamed';
          return matchesSearch.has(name);
        });
        
        if (!matchingIntersect) {
          console.log('⚠️ Κλικ αγνοήθηκε - κανένας μυς δεν ταιριάζει με την αναζήτηση');
          return;
        }
        
        targetIntersect = matchingIntersect;
        baseMeshName = targetIntersect.object.name || 'unnamed';
      }
      
      // Εφαρμογή grouping (π.χ. psoas_major -> Psoas)
      const groupedName = getGroupedMeshName(baseMeshName);
      
      // Έλεγχος αν ο μυς έχει υπο-μέρη (π.χ. Trapezius)
      if (musclesWithSubParts[groupedName]) {
        console.log('🎯 Clicked muscle with sub-parts:', groupedName);
        if (onShowSubPartSelector) {
          onShowSubPartSelector(groupedName, 'Left'); // side param ignored now
        }
        return;
      }
      
      // Αν είναι midline muscle, δεν χρειάζεται επιλογή πλευράς
      if (midlineMuscles.has(groupedName)) {
        console.log('🎯 Clicked midline muscle:', groupedName);
        if (onMeshClick) {
          onMeshClick(groupedName);
        }
        return;
      }
      
      // Μη-κεντρικός μυς: στέλνουμε το base name και το parent component θα δείξει popup επιβεβαίωσης
      console.log('🎯 Clicked mesh:', baseMeshName, '| Grouped:', groupedName, '| Needs side confirmation');
      
      if (onMeshClick) {
        // Send with __NEEDS_SIDE__ marker so parent shows SideConfirmation popup
        onMeshClick(`${groupedName}__NEEDS_SIDE__`);
      }
    }
  }, [isSelecting, raycaster, camera, pointer, obj, onMeshClick, midlineMuscles, matchesSearch, getGroupedMeshName, onShowSubPartSelector]);

  const handlePointerMove = useCallback((event: any) => {
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(obj, true);
    
    if (intersects.length > 0) {
      const hoveredObject = intersects[0].object as THREE.Mesh;
      const meshName = hoveredObject.name || 'unnamed';
      const point = intersects[0].point;
      
      // Εφαρμογή grouping
      const groupedName = getGroupedMeshName(meshName);
      
      // Έλεγχος αν έχει υπο-μέρη
      if (musclesWithSubParts[groupedName]) {
        const side = point.x > 0 ? 'Left' : 'Right';
        setHoveredMesh(`${musclesWithSubParts[groupedName].name} (${side === 'Left' ? 'Αριστερά' : 'Δεξιά'})`);
      } else if (midlineMuscles.has(groupedName)) {
        setHoveredMesh(groupedName);
      } else {
        const side = point.x > 0 ? 'Left' : 'Right';
        setHoveredMesh(`${groupedName} (${side})`);
      }
    } else {
      setHoveredMesh(null);
    }
  }, [raycaster, camera, pointer, obj, midlineMuscles, getGroupedMeshName]);

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
  onSelect: (fullName: string) => void;
  onClose: () => void;
}

const SideConfirmation: React.FC<SideConfirmationProps> = ({ muscleName, onSelect, onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-black border border-[#00ffba] p-4 max-w-xs w-full mx-4">
        <h3 className="text-[#00ffba] text-sm font-medium mb-3 text-center">
          {muscleName}
        </h3>
        <p className="text-white/60 text-xs mb-4 text-center">
          Επιλέξτε πλευρά:
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onSelect(`${muscleName}_Left`)}
            className="flex-1 py-2 px-3 bg-transparent border border-[#00ffba]/50 text-[#00ffba] text-sm hover:bg-[#00ffba] hover:text-black transition-colors rounded-none"
          >
            Αριστερά
          </button>
          <button
            onClick={() => onSelect(`${muscleName}_Right`)}
            className="flex-1 py-2 px-3 bg-transparent border border-[#00ffba]/50 text-[#00ffba] text-sm hover:bg-[#00ffba] hover:text-black transition-colors rounded-none"
          >
            Δεξιά
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
  onSearchResults?: (count: number) => void;
  onMeshNamesLoaded?: (names: string[]) => void;
}

const Muscle3DCanvas: React.FC<Muscle3DCanvasProps> = ({
  isSelecting,
  selectedMuscleName,
  onMeshClick,
  searchQuery,
  mappedMeshNames,
  onSearchResults,
  onMeshNamesLoaded
}) => {
  const [subPartSelector, setSubPartSelector] = useState<{ muscleName: string } | null>(null);
  const [sideConfirmation, setSideConfirmation] = useState<{ muscleName: string } | null>(null);

  const handleShowSubPartSelector = useCallback((muscleName: string, _side: 'Left' | 'Right') => {
    // side ignored now - we show the sub-part popup without side
    setSubPartSelector({ muscleName });
  }, []);

  // Called when user needs to confirm the side (Left/Right)
  const handleShowSideConfirmation = useCallback((muscleName: string) => {
    setSideConfirmation({ muscleName });
  }, []);

  const handleSubPartSelect = useCallback((fullName: string) => {
    setSubPartSelector(null);
    // Check if needs side confirmation
    if (fullName.includes('__NEEDS_SIDE__')) {
      const baseName = fullName.replace('__NEEDS_SIDE__', '');
      handleShowSideConfirmation(baseName);
    } else if (onMeshClick) {
      onMeshClick(fullName);
    }
  }, [onMeshClick, handleShowSideConfirmation]);

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
    
    // Midline muscles or already-sided names pass through directly
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
            onShowSubPartSelector={handleShowSubPartSelector}
          />
        </Suspense>
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
      
      {/* Sub-Part Selector Popup */}
      {subPartSelector && (
        <SubPartSelector
          muscleName={subPartSelector.muscleName}
          onSelect={handleSubPartSelect}
          onClose={() => setSubPartSelector(null)}
        />
      )}

      {/* Side Confirmation Popup */}
      {sideConfirmation && (
        <SideConfirmation
          muscleName={sideConfirmation.muscleName}
          onSelect={handleSideSelect}
          onClose={() => setSideConfirmation(null)}
        />
      )}
      
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
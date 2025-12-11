import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';

interface BodyMapCardProps {
  userId: string;
}

// Ορισμός θέσεων μυών στο SVG (x, y coordinates) - Front view
const musclePositionsFront: Record<string, { x: number; y: number; label: string }> = {
  'trapezius': { x: 150, y: 95, label: 'Τραπεζοειδής' },
  'deltoids': { x: 115, y: 115, label: 'Δελτοειδής' },
  'deltoids_right': { x: 185, y: 115, label: 'Δελτοειδής' },
  'pectorals': { x: 135, y: 135, label: 'Θωρακικοί' },
  'pectorals_right': { x: 165, y: 135, label: 'Θωρακικοί' },
  'biceps': { x: 105, y: 155, label: 'Δικέφαλος' },
  'biceps_right': { x: 195, y: 155, label: 'Δικέφαλος' },
  'forearms': { x: 95, y: 195, label: 'Αντιβραχιόνιο' },
  'forearms_right': { x: 205, y: 195, label: 'Αντιβραχιόνιο' },
  'abs': { x: 150, y: 175, label: 'Κοιλιακοί' },
  'obliques': { x: 125, y: 185, label: 'Πλάγιοι κοιλιακοί' },
  'obliques_right': { x: 175, y: 185, label: 'Πλάγιοι κοιλιακοί' },
  'hip_flexors': { x: 135, y: 215, label: 'Καμπτήρες ισχίου' },
  'hip_flexors_right': { x: 165, y: 215, label: 'Καμπτήρες ισχίου' },
  'quadriceps': { x: 130, y: 275, label: 'Τετρακέφαλος' },
  'quadriceps_right': { x: 170, y: 275, label: 'Τετρακέφαλος' },
  'adductors': { x: 150, y: 255, label: 'Προσαγωγοί' },
  'tibialis': { x: 135, y: 345, label: 'Πρόσθιος κνημιαίος' },
  'tibialis_right': { x: 165, y: 345, label: 'Πρόσθιος κνημιαίος' },
};

// Back view muscle positions
const musclePositionsBack: Record<string, { x: number; y: number; label: string }> = {
  'upper_back': { x: 150, y: 115, label: 'Άνω ράχη' },
  'rhomboids': { x: 140, y: 125, label: 'Ρομβοειδείς' },
  'rhomboids_right': { x: 160, y: 125, label: 'Ρομβοειδείς' },
  'lats': { x: 125, y: 155, label: 'Πλατύς ραχιαίος' },
  'lats_right': { x: 175, y: 155, label: 'Πλατύς ραχιαίος' },
  'triceps': { x: 105, y: 145, label: 'Τρικέφαλος' },
  'triceps_right': { x: 195, y: 145, label: 'Τρικέφαλος' },
  'lower_back': { x: 150, y: 190, label: 'Οσφυϊκή μοίρα' },
  'erector_spinae': { x: 150, y: 175, label: 'Εκτείνοντες σπονδυλικής' },
  'glutes': { x: 140, y: 225, label: 'Γλουτιαίοι' },
  'glutes_right': { x: 160, y: 225, label: 'Γλουτιαίοι' },
  'hamstrings': { x: 135, y: 285, label: 'Οπίσθιοι μηριαίοι' },
  'hamstrings_right': { x: 165, y: 285, label: 'Οπίσθιοι μηριαίοι' },
  'calves': { x: 135, y: 345, label: 'Γαστροκνήμιος' },
  'calves_right': { x: 165, y: 345, label: 'Γαστροκνήμιος' },
  'achilles': { x: 135, y: 375, label: 'Αχίλλειος' },
  'achilles_right': { x: 165, y: 375, label: 'Αχίλλειος' },
};

// Combine all positions with labels
const allMusclePositions = { ...musclePositionsFront, ...musclePositionsBack };

export const BodyMapCard: React.FC<BodyMapCardProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [strengthenMuscles, setStrengthenMuscles] = useState<string[]>([]);
  const [stretchMuscles, setStretchMuscles] = useState<string[]>([]);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
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

      if (data && data.length > 0 && data[0].functional_test_data) {
        const functionalData = Array.isArray(data[0].functional_test_data) 
          ? data[0].functional_test_data[0] 
          : data[0].functional_test_data;
        
        const strengthening = functionalData?.muscles_need_strengthening || [];
        const stretching = functionalData?.muscles_need_stretching || [];
        
        setStrengthenMuscles(strengthening);
        setStretchMuscles(stretching);
        setHasData(strengthening.length > 0 || stretching.length > 0);
      }
    } catch (error) {
      console.error('Error fetching functional data:', error);
    }
  };

  const getMuscleColor = (muscleId: string) => {
    const baseMuscle = muscleId.replace('_right', '');
    if (strengthenMuscles.includes(baseMuscle)) return '#ef4444';
    if (stretchMuscles.includes(baseMuscle)) return '#f59e0b';
    return '#00ffba';
  };

  const getMuscleOpacity = (muscleId: string) => {
    const baseMuscle = muscleId.replace('_right', '');
    if (strengthenMuscles.includes(baseMuscle) || stretchMuscles.includes(baseMuscle)) return 1;
    return 0.15;
  };

  const isActive = (muscleId: string) => {
    const baseMuscle = muscleId.replace('_right', '');
    return strengthenMuscles.includes(baseMuscle) || stretchMuscles.includes(baseMuscle);
  };

  // Get positions based on active view
  const currentPositions = activeView === 'front' ? musclePositionsFront : musclePositionsBack;

  if (!hasData) {
    return null;
  }

  return (
    <Card className="rounded-none border-border bg-black/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#00ffba]">
          {t('progress.bodyMap', 'Χάρτης Σώματος')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* View Toggle */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setActiveView('front')}
            className={`px-4 py-1.5 text-xs font-medium transition-all rounded-none ${
              activeView === 'front' 
                ? 'bg-[#00ffba] text-black' 
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            ΜΠΡΟΣΤΑ
          </button>
          <button
            onClick={() => setActiveView('back')}
            className={`px-4 py-1.5 text-xs font-medium transition-all rounded-none ${
              activeView === 'back' 
                ? 'bg-[#00ffba] text-black' 
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            ΠΙΣΩ
          </button>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
            <span className="text-gray-300">{t('progress.needsStrengthening', 'Ενδυνάμωση')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
            <span className="text-gray-300">{t('progress.needsStretching', 'Διάταση')}</span>
          </div>
        </div>

        <div className="flex justify-center">
          <svg viewBox="0 0 300 420" className="w-full max-w-xs h-auto">
            {/* Grid background for 3D effect */}
            <defs>
              <pattern id="wireframeGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
              </pattern>
              
              {/* Glow filters */}
              <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <filter id="glowRed" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <filter id="glowOrange" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <rect width="300" height="420" fill="url(#wireframeGrid)" />

            {/* 3D Wireframe Human Body */}
            <g stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" fill="none">
              {/* Head - wireframe sphere effect */}
              <ellipse cx="150" cy="45" rx="25" ry="30" />
              <ellipse cx="150" cy="45" rx="25" ry="30" transform="rotate(90 150 45)" strokeWidth="0.3" />
              <path d="M125 45 Q150 15 175 45" />
              <path d="M125 45 Q150 75 175 45" />
              <ellipse cx="150" cy="35" rx="18" ry="8" strokeWidth="0.3" />
              <ellipse cx="150" cy="55" rx="18" ry="8" strokeWidth="0.3" />
              
              {/* Neck */}
              <path d="M140 75 L140 90 M160 75 L160 90" />
              <path d="M140 80 Q150 78 160 80" />
              <path d="M140 85 Q150 83 160 85" />
              
              {/* Shoulders & Chest - wireframe mesh */}
              <path d="M100 95 Q125 85 150 90 Q175 85 200 95" />
              <path d="M100 95 L100 110 Q100 120 110 125" />
              <path d="M200 95 L200 110 Q200 120 190 125" />
              
              {/* Torso wireframe grid */}
              <path d="M110 125 Q150 130 190 125" />
              <path d="M115 145 Q150 150 185 145" />
              <path d="M118 165 Q150 170 182 165" />
              <path d="M120 185 Q150 190 180 185" />
              <path d="M125 205 Q150 210 175 205" />
              
              {/* Vertical torso lines */}
              <path d="M120 95 L118 205" strokeWidth="0.3" />
              <path d="M135 92 L132 210" strokeWidth="0.3" />
              <path d="M150 90 L150 215" />
              <path d="M165 92 L168 210" strokeWidth="0.3" />
              <path d="M180 95 L182 205" strokeWidth="0.3" />
              
              {/* Chest detail */}
              <ellipse cx="135" cy="125" rx="15" ry="10" strokeWidth="0.3" />
              <ellipse cx="165" cy="125" rx="15" ry="10" strokeWidth="0.3" />
              
              {/* Abs grid */}
              <rect x="138" y="150" width="24" height="12" rx="2" strokeWidth="0.3" />
              <rect x="138" y="164" width="24" height="12" rx="2" strokeWidth="0.3" />
              <rect x="138" y="178" width="24" height="12" rx="2" strokeWidth="0.3" />
              <line x1="150" y1="150" x2="150" y2="192" strokeWidth="0.3" />
              
              {/* Arms - Left */}
              <path d="M100 95 Q85 100 80 120 Q75 140 75 160 Q70 180 65 200 L60 225" />
              <path d="M100 110 Q90 115 88 130 Q85 150 83 170 Q78 190 75 210 L72 230" />
              {/* Arm wireframe detail */}
              <ellipse cx="85" cy="140" rx="8" ry="15" strokeWidth="0.3" />
              <ellipse cx="78" cy="180" rx="6" ry="12" strokeWidth="0.3" />
              
              {/* Arms - Right */}
              <path d="M200 95 Q215 100 220 120 Q225 140 225 160 Q230 180 235 200 L240 225" />
              <path d="M200 110 Q210 115 212 130 Q215 150 217 170 Q222 190 225 210 L228 230" />
              {/* Arm wireframe detail */}
              <ellipse cx="215" cy="140" rx="8" ry="15" strokeWidth="0.3" />
              <ellipse cx="222" cy="180" rx="6" ry="12" strokeWidth="0.3" />
              
              {/* Hands wireframe */}
              <ellipse cx="62" cy="235" rx="8" ry="12" strokeWidth="0.3" />
              <ellipse cx="238" cy="235" rx="8" ry="12" strokeWidth="0.3" />
              
              {/* Hips & Pelvis */}
              <path d="M125 205 Q120 220 120 235 L125 240" />
              <path d="M175 205 Q180 220 180 235 L175 240" />
              <ellipse cx="150" cy="220" rx="30" ry="15" strokeWidth="0.3" />
              
              {/* Legs - Left */}
              <path d="M125 240 Q120 270 118 300 Q115 330 115 360 L112 390" />
              <path d="M145 240 Q140 270 138 300 Q135 330 135 360 L133 390" />
              {/* Thigh wireframe */}
              <ellipse cx="132" cy="270" rx="12" ry="25" strokeWidth="0.3" />
              {/* Calf wireframe */}
              <ellipse cx="125" cy="345" rx="8" ry="20" strokeWidth="0.3" />
              {/* Knee */}
              <ellipse cx="128" cy="305" rx="10" ry="8" strokeWidth="0.3" />
              
              {/* Legs - Right */}
              <path d="M175 240 Q180 270 182 300 Q185 330 185 360 L188 390" />
              <path d="M155 240 Q160 270 162 300 Q165 330 165 360 L167 390" />
              {/* Thigh wireframe */}
              <ellipse cx="168" cy="270" rx="12" ry="25" strokeWidth="0.3" />
              {/* Calf wireframe */}
              <ellipse cx="175" cy="345" rx="8" ry="20" strokeWidth="0.3" />
              {/* Knee */}
              <ellipse cx="172" cy="305" rx="10" ry="8" strokeWidth="0.3" />
              
              {/* Feet */}
              <ellipse cx="123" cy="400" rx="12" ry="6" strokeWidth="0.3" />
              <ellipse cx="177" cy="400" rx="12" ry="6" strokeWidth="0.3" />
              
              {/* Cross-section lines for 3D depth */}
              <path d="M100 130 Q150 145 200 130" strokeWidth="0.2" strokeDasharray="2,2" />
              <path d="M115 200 Q150 215 185 200" strokeWidth="0.2" strokeDasharray="2,2" />
              <path d="M120 250 Q150 260 180 250" strokeWidth="0.2" strokeDasharray="2,2" />
            </g>

            {/* Muscle Points */}
            {Object.entries(currentPositions).map(([muscleId, pos]) => {
              const muscleActive = isActive(muscleId);
              const isHovered = hoveredMuscle === muscleId;
              const color = getMuscleColor(muscleId);
              const filterType = color === '#ef4444' ? 'url(#glowRed)' : color === '#f59e0b' ? 'url(#glowOrange)' : 'url(#glowGreen)';
              
              return (
                <g 
                  key={muscleId}
                  onMouseEnter={() => setHoveredMuscle(muscleId)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer glow for active muscles */}
                  {muscleActive && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={12}
                      fill={color}
                      opacity={0.2}
                      filter={filterType}
                    />
                  )}
                  
                  {/* Muscle Circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isHovered ? 9 : muscleActive ? 7 : 4}
                    fill={color}
                    opacity={getMuscleOpacity(muscleId)}
                    filter={muscleActive ? filterType : undefined}
                    className="transition-all duration-200"
                  />
                  
                  {/* Inner highlight */}
                  {muscleActive && (
                    <circle
                      cx={pos.x - 2}
                      cy={pos.y - 2}
                      r={2}
                      fill="white"
                      opacity={0.4}
                    />
                  )}
                  
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <g>
                      <rect
                        x={pos.x - 50}
                        y={pos.y - 28}
                        width="100"
                        height="20"
                        fill="rgba(0,0,0,0.9)"
                        stroke="rgba(0,255,186,0.3)"
                        strokeWidth="1"
                        rx="0"
                      />
                      <text
                        x={pos.x}
                        y={pos.y - 14}
                        textAnchor="middle"
                        fill="#00ffba"
                        className="text-[10px] font-medium"
                      >
                        {pos.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Active Muscles List */}
        {(strengthenMuscles.length > 0 || stretchMuscles.length > 0) && (
          <div className="mt-6 space-y-3">
            {strengthenMuscles.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-red-400 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
                  {t('progress.needsStrengthening', 'Χρειάζονται Ενδυνάμωση')}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {strengthenMuscles.map(muscle => (
                    <span key={muscle} className="px-2.5 py-1 bg-red-500/20 text-red-300 text-xs rounded-none border border-red-500/30">
                      {allMusclePositions[muscle]?.label || muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {stretchMuscles.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"></div>
                  {t('progress.needsStretching', 'Χρειάζονται Διάταση')}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {stretchMuscles.map(muscle => (
                    <span key={muscle} className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-none border border-amber-500/30">
                      {allMusclePositions[muscle]?.label || muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
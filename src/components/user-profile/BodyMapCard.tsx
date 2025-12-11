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

      // Αν υπάρχει functional test session, εμφάνισε το component
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
    <Card className="rounded-none border-border bg-black/95 max-w-[200px]">
      <CardHeader className="p-2 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-[#00ffba]">
            {t('progress.bodyMap', 'Χάρτης Σώματος')}
          </CardTitle>
          {/* View Toggle */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveView('front')}
              className={`px-2 py-0.5 text-[10px] font-medium transition-all rounded-none ${
                activeView === 'front' 
                  ? 'bg-[#00ffba] text-black' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              F
            </button>
            <button
              onClick={() => setActiveView('back')}
              className={`px-2 py-0.5 text-[10px] font-medium transition-all rounded-none ${
                activeView === 'back' 
                  ? 'bg-[#00ffba] text-black' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              B
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="flex justify-center">
          <svg viewBox="0 0 300 420" className="w-full h-[180px]">
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
              <ellipse cx="150" cy="45" rx="25" ry="30" />
              <ellipse cx="150" cy="45" rx="25" ry="30" transform="rotate(90 150 45)" strokeWidth="0.3" />
              <path d="M125 45 Q150 15 175 45" />
              <path d="M125 45 Q150 75 175 45" />
              <path d="M140 75 L140 90 M160 75 L160 90" />
              <path d="M100 95 Q125 85 150 90 Q175 85 200 95" />
              <path d="M100 95 L100 110 Q100 120 110 125" />
              <path d="M200 95 L200 110 Q200 120 190 125" />
              <path d="M110 125 Q150 130 190 125" />
              <path d="M115 145 Q150 150 185 145" />
              <path d="M118 165 Q150 170 182 165" />
              <path d="M120 185 Q150 190 180 185" />
              <path d="M125 205 Q150 210 175 205" />
              <path d="M150 90 L150 215" />
              <path d="M100 95 Q85 100 80 120 Q75 140 75 160 Q70 180 65 200 L60 225" />
              <path d="M200 95 Q215 100 220 120 Q225 140 225 160 Q230 180 235 200 L240 225" />
              <path d="M125 205 Q120 220 120 235 L125 240" />
              <path d="M175 205 Q180 220 180 235 L175 240" />
              <path d="M125 240 Q120 270 118 300 Q115 330 115 360 L112 390" />
              <path d="M145 240 Q140 270 138 300 Q135 330 135 360 L133 390" />
              <path d="M175 240 Q180 270 182 300 Q185 330 185 360 L188 390" />
              <path d="M155 240 Q160 270 162 300 Q165 330 165 360 L167 390" />
              <ellipse cx="123" cy="400" rx="12" ry="6" strokeWidth="0.3" />
              <ellipse cx="177" cy="400" rx="12" ry="6" strokeWidth="0.3" />
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
                  {muscleActive && (
                    <circle cx={pos.x} cy={pos.y} r={8} fill={color} opacity={0.2} filter={filterType} />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isHovered ? 6 : muscleActive ? 5 : 3}
                    fill={color}
                    opacity={getMuscleOpacity(muscleId)}
                    filter={muscleActive ? filterType : undefined}
                    className="transition-all duration-200"
                  />
                  {isHovered && (
                    <g>
                      <rect x={pos.x - 40} y={pos.y - 22} width="80" height="16" fill="rgba(0,0,0,0.9)" stroke="rgba(0,255,186,0.3)" strokeWidth="1" rx="0" />
                      <text x={pos.x} y={pos.y - 10} textAnchor="middle" fill="#00ffba" className="text-[8px] font-medium">
                        {pos.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend - compact */}
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
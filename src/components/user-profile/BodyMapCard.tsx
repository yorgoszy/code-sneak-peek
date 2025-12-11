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
            <defs>
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

            {/* 3D Wireframe Human Body - Mesh Style */}
            <g stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" fill="none">
              {/* Head - wireframe mesh */}
              <ellipse cx="150" cy="42" rx="22" ry="28" />
              <path d="M128 42 Q150 30 172 42" />
              <path d="M128 42 Q150 54 172 42" />
              <path d="M130 32 Q150 26 170 32" />
              <path d="M130 52 Q150 58 170 52" />
              <line x1="150" y1="14" x2="150" y2="70" strokeWidth="0.3" />
              <path d="M135 25 Q150 20 165 25" strokeWidth="0.3" />
              <path d="M135 60 Q150 65 165 60" strokeWidth="0.3" />
              
              {/* Neck */}
              <path d="M140 70 L140 82 M160 70 L160 82" />
              <path d="M140 76 L160 76" strokeWidth="0.3" />
              
              {/* Shoulders & Upper torso mesh */}
              <path d="M95 92 Q125 82 150 85 Q175 82 205 92" />
              <path d="M95 92 L85 110 L80 135 L78 165" />
              <path d="M205 92 L215 110 L220 135 L222 165" />
              
              {/* Torso wireframe mesh */}
              <path d="M115 95 Q150 100 185 95" />
              <path d="M110 115 Q150 120 190 115" />
              <path d="M112 135 Q150 142 188 135" />
              <path d="M115 155 Q150 162 185 155" />
              <path d="M118 175 Q150 182 182 175" />
              <path d="M122 195 Q150 202 178 195" />
              <path d="M128 215 Q150 220 172 215" />
              
              {/* Vertical torso lines */}
              <line x1="150" y1="85" x2="150" y2="220" strokeWidth="0.3" />
              <path d="M130 95 Q128 155 130 215" strokeWidth="0.3" />
              <path d="M170 95 Q172 155 170 215" strokeWidth="0.3" />
              <path d="M115 95 Q112 145 118 195" strokeWidth="0.3" />
              <path d="M185 95 Q188 145 182 195" strokeWidth="0.3" />
              
              {/* Arms - wireframe */}
              <path d="M78 165 L72 195 L65 225" />
              <path d="M222 165 L228 195 L235 225" />
              <path d="M85 125 Q80 145 75 165" strokeWidth="0.3" />
              <path d="M215 125 Q220 145 225 165" strokeWidth="0.3" />
              <path d="M82 145 L90 145" strokeWidth="0.3" />
              <path d="M210 145 L218 145" strokeWidth="0.3" />
              <path d="M78 175 L88 175" strokeWidth="0.3" />
              <path d="M212 175 L222 175" strokeWidth="0.3" />
              <path d="M72 205 L82 205" strokeWidth="0.3" />
              <path d="M218 205 L228 205" strokeWidth="0.3" />
              
              {/* Hands */}
              <ellipse cx="62" cy="235" rx="8" ry="12" strokeWidth="0.4" />
              <ellipse cx="238" cy="235" rx="8" ry="12" strokeWidth="0.4" />
              <path d="M58 228 L58 245 M62 226 L62 248 M66 228 L66 245" strokeWidth="0.2" />
              <path d="M234 228 L234 245 M238 226 L238 248 M242 228 L242 245" strokeWidth="0.2" />
              
              {/* Hips/Pelvis */}
              <path d="M128 215 Q125 225 128 235" />
              <path d="M172 215 Q175 225 172 235" />
              <path d="M128 235 Q150 242 172 235" />
              
              {/* Legs - wireframe mesh */}
              {/* Left leg */}
              <path d="M128 235 L122 275 L118 315 L115 355 L112 395" />
              <path d="M145 235 L140 275 L136 315 L133 355 L130 395" />
              <path d="M125 255 L142 255" strokeWidth="0.3" />
              <path d="M122 285 L138 285" strokeWidth="0.3" />
              <path d="M120 315 L136 315" strokeWidth="0.3" />
              <path d="M118 345 L134 345" strokeWidth="0.3" />
              <path d="M115 375 L131 375" strokeWidth="0.3" />
              
              {/* Right leg */}
              <path d="M172 235 L178 275 L182 315 L185 355 L188 395" />
              <path d="M155 235 L160 275 L164 315 L167 355 L170 395" />
              <path d="M158 255 L175 255" strokeWidth="0.3" />
              <path d="M162 285 L178 285" strokeWidth="0.3" />
              <path d="M164 315 L180 315" strokeWidth="0.3" />
              <path d="M166 345 L182 345" strokeWidth="0.3" />
              <path d="M169 375 L185 375" strokeWidth="0.3" />
              
              {/* Feet */}
              <ellipse cx="121" cy="402" rx="14" ry="6" strokeWidth="0.4" />
              <ellipse cx="179" cy="402" rx="14" ry="6" strokeWidth="0.4" />
              <path d="M112 395 Q110 402 115 405" strokeWidth="0.3" />
              <path d="M130 395 Q132 402 127 405" strokeWidth="0.3" />
              <path d="M188 395 Q190 402 185 405" strokeWidth="0.3" />
              <path d="M170 395 Q168 402 173 405" strokeWidth="0.3" />
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
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';

interface BodyMapCardProps {
  userId: string;
}

// Ορισμός θέσεων μυών στο SVG (x, y coordinates)
const musclePositions: Record<string, { x: number; y: number; label: string }> = {
  // Άνω μέρος - Μπροστά
  'trapezius': { x: 100, y: 85, label: 'Τραπεζοειδής' },
  'deltoids': { x: 70, y: 100, label: 'Δελτοειδής' },
  'pectorals': { x: 100, y: 115, label: 'Θωρακικοί' },
  'biceps': { x: 65, y: 135, label: 'Δικέφαλος' },
  'forearms': { x: 58, y: 165, label: 'Αντιβραχιόνιο' },
  'abs': { x: 100, y: 155, label: 'Κοιλιακοί' },
  'obliques': { x: 82, y: 160, label: 'Πλάγιοι κοιλιακοί' },
  
  // Κάτω μέρος - Μπροστά
  'hip_flexors': { x: 90, y: 185, label: 'Καμπτήρες ισχίου' },
  'quadriceps': { x: 88, y: 220, label: 'Τετρακέφαλος' },
  'adductors': { x: 100, y: 215, label: 'Προσαγωγοί' },
  'tibialis': { x: 88, y: 280, label: 'Πρόσθιος κνημιαίος' },
  
  // Άνω μέρος - Πίσω
  'upper_back': { x: 250, y: 100, label: 'Άνω ράχη' },
  'rhomboids': { x: 250, y: 110, label: 'Ρομβοειδείς' },
  'lats': { x: 235, y: 130, label: 'Πλατύς ραχιαίος' },
  'triceps': { x: 280, y: 135, label: 'Τρικέφαλος' },
  'lower_back': { x: 250, y: 160, label: 'Οσφυϊκή μοίρα' },
  'erector_spinae': { x: 250, y: 150, label: 'Εκτείνοντες σπονδυλικής' },
  
  // Κάτω μέρος - Πίσω
  'glutes': { x: 250, y: 190, label: 'Γλουτιαίοι' },
  'hamstrings': { x: 248, y: 230, label: 'Οπίσθιοι μηριαίοι' },
  'calves': { x: 248, y: 285, label: 'Γαστροκνήμιος' },
  'achilles': { x: 248, y: 310, label: 'Αχίλλειος' },
};

export const BodyMapCard: React.FC<BodyMapCardProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [strengthenMuscles, setStrengthenMuscles] = useState<string[]>([]);
  const [stretchMuscles, setStretchMuscles] = useState<string[]>([]);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

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
        
        setStrengthenMuscles(functionalData?.muscles_need_strengthening || []);
        setStretchMuscles(functionalData?.muscles_need_stretching || []);
      }
    } catch (error) {
      console.error('Error fetching functional data:', error);
    }
  };

  const getMuscleColor = (muscleId: string) => {
    if (strengthenMuscles.includes(muscleId)) return '#ef4444'; // Κόκκινο για ενδυνάμωση
    if (stretchMuscles.includes(muscleId)) return '#f59e0b'; // Πορτοκαλί για διάταση
    return '#3b82f6'; // Μπλε default
  };

  const getMuscleOpacity = (muscleId: string) => {
    if (strengthenMuscles.includes(muscleId) || stretchMuscles.includes(muscleId)) return 1;
    return 0.2;
  };

  return (
    <Card className="rounded-none border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">
          {t('progress.bodyMap', 'Χάρτης Σώματος')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        {/* Legend */}
        <div className="flex gap-4 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">{t('progress.needsStrengthening', 'Ενδυνάμωση')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-600">{t('progress.needsStretching', 'Διάταση')}</span>
          </div>
        </div>

        <div className="flex justify-center">
          <svg viewBox="0 0 350 350" className="w-full max-w-md h-auto">
            {/* Background */}
            <rect width="350" height="350" fill="transparent" />
            
            {/* Front Body Silhouette */}
            <g transform="translate(50, 20)">
              {/* Head */}
              <ellipse cx="50" cy="25" rx="18" ry="22" fill="#1e3a5f" opacity="0.3" />
              
              {/* Neck */}
              <rect x="42" y="45" width="16" height="15" fill="#1e3a5f" opacity="0.3" />
              
              {/* Torso */}
              <path 
                d="M25 60 Q20 80 20 100 L20 170 Q20 180 35 185 L65 185 Q80 180 80 170 L80 100 Q80 80 75 60 Z" 
                fill="#1e3a5f" 
                opacity="0.3" 
              />
              
              {/* Left Arm */}
              <path 
                d="M20 60 Q5 70 0 100 L0 150 Q0 160 5 170 L10 170 Q15 160 15 150 L15 100 Q18 80 25 65 Z" 
                fill="#1e3a5f" 
                opacity="0.3" 
              />
              
              {/* Right Arm */}
              <path 
                d="M80 60 Q95 70 100 100 L100 150 Q100 160 95 170 L90 170 Q85 160 85 150 L85 100 Q82 80 75 65 Z" 
                fill="#1e3a5f" 
                opacity="0.3" 
              />
              
              {/* Left Leg */}
              <path 
                d="M35 185 L30 250 Q28 280 30 310 L40 310 Q42 280 40 250 L45 185 Z" 
                fill="#1e3a5f" 
                opacity="0.3" 
              />
              
              {/* Right Leg */}
              <path 
                d="M55 185 L50 250 Q48 280 50 310 L60 310 Q62 280 60 250 L65 185 Z" 
                fill="#1e3a5f" 
                opacity="0.3" 
              />
            </g>

            {/* Back Body Silhouette */}
            <g transform="translate(200, 20)">
              {/* Head */}
              <ellipse cx="50" cy="25" rx="18" ry="22" fill="#1e3a5f" opacity="0.3" />
              
              {/* Neck */}
              <rect x="42" y="45" width="16" height="15" fill="#1e3a5f" opacity="0.3" />
              
              {/* Torso */}
              <path 
                d="M25 60 Q20 80 20 100 L20 170 Q20 180 35 185 L65 185 Q80 180 80 170 L80 100 Q80 80 75 60 Z" 
                fill="#1e3a5f" 
                opacity="0.3" 
              />
              
              {/* Left Arm */}
              <path 
                d="M20 60 Q5 70 0 100 L0 150 Q0 160 5 170 L10 170 Q15 160 15 150 L15 100 Q18 80 25 65 Z" 
                fill="#1e3a5f" 
                opacity="0.3" 
              />
              
              {/* Right Arm */}
              <path 
                d="M80 60 Q95 70 100 100 L100 150 Q100 160 95 170 L90 170 Q85 160 85 150 L85 100 Q82 80 75 65 Z" 
                fill="#1e3a5f" 
                opacity="0.3" 
              />
              
              {/* Left Leg */}
              <path 
                d="M35 185 L30 250 Q28 280 30 310 L40 310 Q42 280 40 250 L45 185 Z" 
                fill="#1e3a5f" 
                opacity="0.3" 
              />
              
              {/* Right Leg */}
              <path 
                d="M55 185 L50 250 Q48 280 50 310 L60 310 Q62 280 60 250 L65 185 Z" 
                fill="#1e3a5f" 
                opacity="0.3" 
              />
            </g>

            {/* Labels */}
            <text x="100" y="15" textAnchor="middle" className="text-[10px] fill-gray-500">ΜΠΡΟΣΤΑ</text>
            <text x="250" y="15" textAnchor="middle" className="text-[10px] fill-gray-500">ΠΙΣΩ</text>

            {/* Muscle Points */}
            {Object.entries(musclePositions).map(([muscleId, pos]) => {
              const isActive = strengthenMuscles.includes(muscleId) || stretchMuscles.includes(muscleId);
              const isHovered = hoveredMuscle === muscleId;
              
              return (
                <g 
                  key={muscleId}
                  onMouseEnter={() => setHoveredMuscle(muscleId)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Muscle Circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isHovered ? 8 : isActive ? 6 : 4}
                    fill={getMuscleColor(muscleId)}
                    opacity={getMuscleOpacity(muscleId)}
                    className="transition-all duration-200"
                  />
                  
                  {/* Pulse animation for active muscles */}
                  {isActive && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={8}
                      fill="none"
                      stroke={getMuscleColor(muscleId)}
                      strokeWidth="1"
                      opacity="0.5"
                      className="animate-ping"
                    />
                  )}
                  
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <g>
                      <rect
                        x={pos.x - 40}
                        y={pos.y - 25}
                        width="80"
                        height="18"
                        fill="rgba(0,0,0,0.8)"
                        rx="2"
                      />
                      <text
                        x={pos.x}
                        y={pos.y - 12}
                        textAnchor="middle"
                        fill="white"
                        className="text-[9px]"
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
          <div className="mt-4 space-y-2">
            {strengthenMuscles.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-red-600 mb-1">
                  {t('progress.needsStrengthening', 'Χρειάζονται Ενδυνάμωση')}:
                </h4>
                <div className="flex flex-wrap gap-1">
                  {strengthenMuscles.map(muscle => (
                    <span key={muscle} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-none">
                      {musclePositions[muscle]?.label || muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {stretchMuscles.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-amber-600 mb-1">
                  {t('progress.needsStretching', 'Χρειάζονται Διάταση')}:
                </h4>
                <div className="flex flex-wrap gap-1">
                  {stretchMuscles.map(muscle => (
                    <span key={muscle} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-none">
                      {musclePositions[muscle]?.label || muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No data message */}
        {strengthenMuscles.length === 0 && stretchMuscles.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-2">
            {t('progress.noFunctionalData', 'Δεν υπάρχουν δεδομένα λειτουργικών τεστ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

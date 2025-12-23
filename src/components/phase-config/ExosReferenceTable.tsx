import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Info, Zap, Target } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// EXOS Strength Qualities Parameters
const STRENGTH_QUALITIES_PARAMS = [
  {
    quality: 'MAX Strength',
    intensity: '85-100%',
    barSpeed: '0.1-0.4 m/s',
    sets: '3-5',
    reps: '1-5',
    tempo: '1.0.X.1',
    rest: '3-5 min',
    color: 'bg-red-500'
  },
  {
    quality: 'Strength Speed',
    intensity: '75-90%',
    barSpeed: '0.4-0.75 m/s',
    sets: '3-6',
    reps: '3-6',
    tempo: 'X.0.X.0',
    rest: '3-5 min',
    color: 'bg-orange-500'
  },
  {
    quality: 'Speed Strength',
    intensity: '30-60%',
    barSpeed: '0.75-1.0 m/s',
    sets: '3-6',
    reps: '3-6',
    tempo: 'X.0.X.0',
    rest: '2-3 min',
    color: 'bg-yellow-500'
  },
  {
    quality: 'STR/PWR Endurance',
    intensity: '30-70%',
    barSpeed: '0.5-1.0 m/s',
    sets: '2-4',
    reps: '10-20+',
    tempo: '1.0.1.0',
    rest: '30-90 sec',
    color: 'bg-lime-500'
  },
  {
    quality: 'Sarcoplasmic Hypertrophy',
    intensity: '65-80%',
    barSpeed: '0.3-0.5 m/s',
    sets: '3-5',
    reps: '8-15',
    tempo: '2.0.2.0',
    rest: '60-90 sec',
    color: 'bg-green-500'
  },
  {
    quality: 'Myofibrillar Hypertrophy',
    intensity: '80-90%',
    barSpeed: '0.2-0.4 m/s',
    sets: '4-6',
    reps: '4-8',
    tempo: '2.1.X.1',
    rest: '2-3 min',
    color: 'bg-teal-500'
  },
];

// EXOS Loading Strategies - από Mechanical Stress προς Metabolic Stress
const LOADING_STRATEGIES = [
  {
    name: 'Supra Maximal Eccentrics',
    stressType: 'mechanical',
    description: '110-115% 1RM',
    details: 'Υπερμέγιστα εκκεντρικά φορτία. Απαιτεί spotters ή ειδικό εξοπλισμό. Χρησιμοποιείται για νευρική προσαρμογή και υπερφόρτωση στην εκκεντρική φάση.',
    color: 'bg-red-500'
  },
  {
    name: 'Maximal Loads and Speed',
    stressType: 'mechanical',
    description: '95-100% 1RM',
    details: 'Μέγιστα φορτία με έμφαση στην πρόθεση για μέγιστη ταχύτητα. Ιδανικό για νευρικές προσαρμογές και μέγιστη δύναμη.',
    color: 'bg-red-400'
  },
  {
    name: 'Clusters',
    stressType: 'mechanical',
    description: 'Intra-rep rest 10-30s',
    details: 'Π.χ. 2 reps @ 90% + 10s rest + 1 rep @ 90%. Επιτρέπει περισσότερα quality reps σε υψηλά φορτία διατηρώντας ταχύτητα και τεχνική.',
    color: 'bg-orange-500'
  },
  {
    name: 'Accommodating Resistance',
    stressType: 'mixed',
    description: 'Chains / Bands / Air',
    details: 'Chains: Αυξάνει φορτίο στο lockout (Strength focus). Bands: Αυξάνει ταχύτητα/έκρηξη (Power focus). Air units: Συνδυασμός Strength & Power.',
    color: 'bg-orange-400'
  },
  {
    name: 'High Intensity Training (HIT)',
    stressType: 'mixed',
    description: 'Heavy + Volume',
    details: 'Strength sets = ↑ αναβολικές ορμόνες. HIT sets (failure) = ↑↑ αναβολικές ορμόνες. Συνδυασμός για μέγιστη υπερτροφία.',
    color: 'bg-yellow-500'
  },
  {
    name: 'Strip Sets',
    stressType: 'metabolic',
    description: 'Intra-set load drops',
    details: 'Π.χ. Max 100lbs → 80 → 60 → 40. Μείωση φορτίου εντός σετ χωρίς διακοπή. Μεγιστοποιεί time under tension.',
    color: 'bg-lime-500'
  },
  {
    name: 'Drop Sets',
    stressType: 'metabolic',
    description: 'Multiple failure sets',
    details: 'Συνεχόμενα σετ με μειωμένο φορτίο (10-20% drop) μέχρι failure. Ιδανικό για μεταβολικό stress και υπερτροφία.',
    color: 'bg-green-500'
  },
  {
    name: 'Timed Sets',
    stressType: 'metabolic',
    description: 'Work per time interval',
    details: 'Reps σε καθορισμένο χρόνο. Progression: αύξηση reps ή αύξηση χρόνου. Ιδανικό για muscular endurance.',
    color: 'bg-green-600'
  },
];

// EXOS Jump Profile Testing
const JUMP_PROFILE = [
  {
    jumpType: 'Non-Counter Movement (NCM)',
    sscContribution: 'Minimal',
    strengthQuality: 'Starting Strength',
    description: 'Άλμα χωρίς προκαταβολική κίνηση - μετρά την ικανότητα παραγωγής δύναμης από στατική θέση'
  },
  {
    jumpType: 'Counter Movement (CM)',
    sscContribution: 'Moderate',
    strengthQuality: 'Explosive Strength',
    description: 'Άλμα με αντικίνηση - μετρά την εκρηκτική δύναμη και SSC utilization'
  },
  {
    jumpType: 'Depth Jump (40cm)',
    sscContribution: 'High',
    strengthQuality: 'Reactive Strength',
    description: 'Άλμα βάθους - μετρά την αντιδραστική δύναμη και elastic energy utilization'
  },
];

// EXOS Movement Classification
const MOVEMENT_CLASSIFICATION = [
  {
    category: 'Primary',
    description: 'Κύριες σύνθετες ασκήσεις',
    examples: 'Squat, Deadlift, Bench Press, Olympic Lifts',
    focus: 'Μέγιστη δύναμη & ισχύς'
  },
  {
    category: 'Secondary',
    description: 'Υποστηρικτικές σύνθετες ασκήσεις',
    examples: 'RDL, Lunges, Rows, Overhead Press',
    focus: 'Συμπληρωματική δύναμη'
  },
  {
    category: 'Accessory',
    description: 'Βοηθητικές/απομονωμένες ασκήσεις',
    examples: 'Curls, Extensions, Raises, Core work',
    focus: 'Υπερτροφία & πρόληψη τραυματισμών'
  },
];

// EXOS Targeting Strength Qualities Matrix
const STRENGTH_QUALITIES_MATRIX = {
  headers: ['Exercise Type', 'Foundational', 'Hypertrophy', 'Strength', 'Power'],
  rows: [
    {
      type: 'Total Body Power',
      foundational: 'Foundational',
      hypertrophy: 'Foundational Hypertrophy',
      strength: 'Power',
      power: 'Strength Speed'
    },
    {
      type: 'Primary/Secondary',
      foundational: 'Foundational',
      hypertrophy: 'Functional Hypertrophy',
      strength: 'Strength',
      power: 'Speed Strength'
    },
    {
      type: 'Rotational',
      foundational: 'Foundational',
      hypertrophy: 'Non-Functional Hypertrophy',
      strength: 'Power',
      power: 'Speed Strength'
    },
    {
      type: 'Auxiliary',
      foundational: 'Foundational',
      hypertrophy: 'Non-Functional Hypertrophy',
      strength: 'Functional Hypertrophy',
      power: 'Functional Hypertrophy'
    },
  ]
};

// Phase mapping για τη λογική επιλογής
export const PHASE_QUALITY_MAPPING: Record<string, string> = {
  'corrective': 'Foundational',
  'stabilization': 'Foundational',
  'connecting-linking': 'Foundational',
  'movement-skills': 'Foundational',
  'non-functional-hypertrophy': 'Hypertrophy',
  'functional-hypertrophy': 'Hypertrophy',
  'starting-strength': 'Strength',
  'explosive-strength': 'Strength',
  'reactive-strength': 'Strength',
  'str-spd': 'Power',
  'pwr': 'Power',
  'spd-str': 'Power',
  'spd': 'Power',
  'str-end': 'Hypertrophy',
  'pwr-end': 'Strength',
  'spd-end': 'Power',
};

const getStressColor = (type: string) => {
  switch (type) {
    case 'mechanical': return 'text-red-500';
    case 'metabolic': return 'text-green-500';
    case 'mixed': return 'text-orange-500';
    default: return 'text-gray-500';
  }
};

export const ExosReferenceTable: React.FC = () => {
  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-[#cb8954]" />
          EXOS Reference - Strength & Power Methodology
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="params" className="w-full">
          <TabsList className="rounded-none w-full grid grid-cols-4">
            <TabsTrigger value="params" className="rounded-none text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Parameters
            </TabsTrigger>
            <TabsTrigger value="loading" className="rounded-none text-xs">
              Loading
            </TabsTrigger>
            <TabsTrigger value="jumps" className="rounded-none text-xs">
              <Target className="w-3 h-3 mr-1" />
              Jump Profile
            </TabsTrigger>
            <TabsTrigger value="qualities" className="rounded-none text-xs">
              Matrix
            </TabsTrigger>
          </TabsList>

          {/* Strength Qualities Parameters */}
          <TabsContent value="params" className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#cb8954] text-white">
                    <th className="px-2 py-1.5 text-left font-medium">Quality</th>
                    <th className="px-2 py-1.5 text-center font-medium">Intensity</th>
                    <th className="px-2 py-1.5 text-center font-medium">Bar Speed</th>
                    <th className="px-2 py-1.5 text-center font-medium">Sets</th>
                    <th className="px-2 py-1.5 text-center font-medium">Reps</th>
                    <th className="px-2 py-1.5 text-center font-medium">Tempo</th>
                    <th className="px-2 py-1.5 text-center font-medium">Rest</th>
                  </tr>
                </thead>
                <tbody>
                  {STRENGTH_QUALITIES_PARAMS.map((param, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${param.color}`} />
                          <span className="font-medium text-gray-900">{param.quality}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center text-gray-600">{param.intensity}</td>
                      <td className="px-2 py-1.5 text-center text-gray-600">{param.barSpeed}</td>
                      <td className="px-2 py-1.5 text-center text-gray-600">{param.sets}</td>
                      <td className="px-2 py-1.5 text-center text-gray-600">{param.reps}</td>
                      <td className="px-2 py-1.5 text-center font-mono text-gray-600">{param.tempo}</td>
                      <td className="px-2 py-1.5 text-center text-gray-600">{param.rest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 p-2 bg-gray-50 text-[10px] text-gray-600">
              <strong>Tempo:</strong> Eccentric.Pause.Concentric.Pause | <strong>X</strong> = Explosive
            </div>
          </TabsContent>

          {/* Loading Strategies */}
          <TabsContent value="loading" className="mt-3">
            <div className="space-y-2">
              {/* Stress indicators */}
              <div className="flex items-center justify-between text-xs mb-3 px-2">
                <div className="flex items-center gap-1 text-red-500">
                  <ArrowUp className="w-4 h-4" />
                  <span>Mechanical Stress</span>
                </div>
                <div className="flex items-center gap-1 text-green-500">
                  <ArrowDown className="w-4 h-4" />
                  <span>Metabolic Stress</span>
                </div>
              </div>

              {/* Loading strategies list */}
              <TooltipProvider>
                <div className="space-y-1.5">
                  {LOADING_STRATEGIES.map((strategy, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 cursor-help transition-colors">
                          <div className={`w-2 h-2 rounded-full ${strategy.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{strategy.name}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] rounded-none ${getStressColor(strategy.stressType)}`}
                              >
                                {strategy.description}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs rounded-none">
                        <p className="text-xs">{strategy.details}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </TabsContent>

          {/* Jump Profile Testing */}
          <TabsContent value="jumps" className="mt-3">
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#cb8954] text-white">
                      <th className="px-2 py-1.5 text-left font-medium">Jump Type</th>
                      <th className="px-2 py-1.5 text-center font-medium">SSC Contribution</th>
                      <th className="px-2 py-1.5 text-left font-medium">Strength Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {JUMP_PROFILE.map((jump, i) => (
                      <TooltipProvider key={i}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <tr className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} cursor-help hover:bg-gray-100`}>
                              <td className="px-2 py-1.5 font-medium text-gray-900">{jump.jumpType}</td>
                              <td className="px-2 py-1.5 text-center">
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] rounded-none ${
                                    jump.sscContribution === 'High' ? 'text-green-600 border-green-300' :
                                    jump.sscContribution === 'Moderate' ? 'text-orange-600 border-orange-300' :
                                    'text-gray-600 border-gray-300'
                                  }`}
                                >
                                  {jump.sscContribution}
                                </Badge>
                              </td>
                              <td className="px-2 py-1.5 text-gray-600">{jump.strengthQuality}</td>
                            </tr>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs rounded-none">
                            <p className="text-xs">{jump.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Movement Classification */}
              <div className="border-t pt-3">
                <h4 className="text-xs font-medium mb-2 text-gray-700">Movement Classification</h4>
                <div className="space-y-1.5">
                  {MOVEMENT_CLASSIFICATION.map((cat, i) => (
                    <TooltipProvider key={i}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 cursor-help">
                            <div className="flex items-center gap-2">
                              <Badge className="rounded-none bg-[#cb8954] text-[10px]">{cat.category}</Badge>
                              <span className="text-xs text-gray-600">{cat.description}</span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs rounded-none">
                          <p className="text-xs"><strong>Παραδείγματα:</strong> {cat.examples}</p>
                          <p className="text-xs mt-1"><strong>Focus:</strong> {cat.focus}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Strength Qualities Matrix */}
          <TabsContent value="qualities" className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#cb8954] text-white">
                    {STRENGTH_QUALITIES_MATRIX.headers.map((header, i) => (
                      <th key={i} className="px-2 py-1.5 text-left font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STRENGTH_QUALITIES_MATRIX.rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-2 py-1.5 font-medium text-gray-900">{row.type}</td>
                      <td className="px-2 py-1.5 text-gray-600">{row.foundational}</td>
                      <td className="px-2 py-1.5 text-gray-600">{row.hypertrophy}</td>
                      <td className="px-2 py-1.5 text-gray-600">{row.strength}</td>
                      <td className="px-2 py-1.5 text-gray-600">{row.power}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-3 p-2 bg-gray-50 text-[10px] text-gray-600">
              <strong>Πώς να διαβάσεις:</strong> Βρες τον τύπο άσκησης (αριστερά) και τη φάση (πάνω). 
              Η τιμή δείχνει τι είδος training focus πρέπει να έχει η άσκηση.
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ExosReferenceTable;

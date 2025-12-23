import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// EXOS Loading Strategies - από Mechanical Stress προς Metabolic Stress
const LOADING_STRATEGIES = [
  {
    name: 'Supra Maximal Eccentrics',
    stressType: 'mechanical',
    description: '110-115% 1RM',
    details: 'Υπερμέγιστα εκκεντρικά φορτία. Απαιτεί spotters.',
    color: 'bg-red-500'
  },
  {
    name: 'Maximal Loads and Speed',
    stressType: 'mechanical',
    description: '95-100% 1RM με ταχύτητα',
    details: 'Μέγιστα φορτία με έμφαση στην ταχύτητα εκτέλεσης.',
    color: 'bg-red-400'
  },
  {
    name: 'Clusters',
    stressType: 'mechanical',
    description: 'Intra-rep rest 15-30s',
    details: 'Π.χ. 2 reps @ 90% + 10s rest + 1 rep @ 90%. Διατηρεί ποιότητα σε υψηλά φορτία.',
    color: 'bg-orange-500'
  },
  {
    name: 'Accommodating Resistance',
    stressType: 'mixed',
    description: 'Chains, Bands, Air',
    details: 'Chains: Strength focus, Bands: Power focus, Air: Strength & Power',
    color: 'bg-orange-400'
  },
  {
    name: 'High Intensity Training (HIT)',
    stressType: 'mixed',
    description: 'Strength + HIT sets',
    details: 'Strength = ↑ anabolic hormones, HIT sets = ↑↑ anabolic hormones',
    color: 'bg-yellow-500'
  },
  {
    name: 'Strip Sets',
    stressType: 'metabolic',
    description: 'Intra-set load variations',
    details: 'Π.χ. Max 100lbs → 80 → 60 → 40. Μείωση φορτίου εντός σετ.',
    color: 'bg-lime-500'
  },
  {
    name: 'Drop Sets',
    stressType: 'metabolic',
    description: 'Μείωση φορτίου χωρίς rest',
    details: 'Συνεχόμενα σετ με μειωμένο φορτίο μέχρι failure.',
    color: 'bg-green-500'
  },
  {
    name: 'Timed Sets',
    stressType: 'metabolic',
    description: 'Reps per time interval',
    details: 'Αύξηση reps ανά χρονικό διάστημα ή αύξηση του χρόνου.',
    color: 'bg-green-600'
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
const PHASE_QUALITY_MAPPING: Record<string, string> = {
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
          EXOS Reference - Loading Strategies & Strength Qualities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="loading" className="w-full">
          <TabsList className="rounded-none w-full">
            <TabsTrigger value="loading" className="rounded-none flex-1">
              Loading Strategies
            </TabsTrigger>
            <TabsTrigger value="qualities" className="rounded-none flex-1">
              Strength Qualities Matrix
            </TabsTrigger>
          </TabsList>

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

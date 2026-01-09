import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, Info, Target, TrendingUp, Dumbbell } from "lucide-react";
import type { ExerciseAnalysis } from '@/services/exerciseAnalyzer';

interface FeedbackPanelProps {
  mode: 'exercise' | 'test';
  exercise?: { name: string; description: string };
  test?: { name: string; description: string };
  analysis: ExerciseAnalysis | null;
  fmsScore: { score: 0 | 1 | 2 | 3; feedback: string[] } | null;
  repCount: number;
  isActive: boolean;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  mode,
  exercise,
  test,
  analysis,
  fmsScore,
  repCount,
  isActive,
}) => {
  if (!isActive) {
    return (
      <Card className="rounded-none h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400" />
            Οδηγίες
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>1. Τοποθετήσου μπροστά στην κάμερα</p>
          <p>2. Φρόντισε να φαίνεται ολόκληρο το σώμα σου</p>
          <p>3. Έχε καλό φωτισμό</p>
          <p>4. Πάτα "Έναρξη" για να ξεκινήσει η ανάλυση</p>
          
          <div className="mt-4 p-3 bg-[#00ffba]/10 border border-[#00ffba]/30 rounded-none">
            <p className="font-medium text-gray-800">
              {mode === 'exercise' 
                ? `Επιλεγμένη άσκηση: ${exercise?.name}`
                : `Επιλεγμένο τεστ: ${test?.name}`
              }
            </p>
            <p className="text-xs mt-1">
              {mode === 'exercise' ? exercise?.description : test?.description}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-[#00ffba]" />
          Real-time Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exercise Mode */}
        {mode === 'exercise' && (
          <>
            {/* Rep Counter */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-none">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-[#00ffba]" />
                <span className="font-medium">Επαναλήψεις</span>
              </div>
              <span className="text-2xl font-bold text-[#00ffba]">{repCount}</span>
            </div>

            {/* Score */}
            {analysis && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ποιότητα Εκτέλεσης</span>
                  <span className={`font-bold ${analysis.score >= 70 ? 'text-green-500' : 'text-red-500'}`}>
                    {analysis.score}%
                  </span>
                </div>
                <Progress 
                  value={analysis.score} 
                  className="h-2 rounded-none"
                />
              </div>
            )}

            {/* Phase indicator */}
            {analysis?.phase && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Φάση: </span>
                <Badge variant="outline" className="rounded-none">
                  {analysis.phase === 'up' ? '⬆️ Άνω' : 
                   analysis.phase === 'down' ? '⬇️ Κάτω' : 
                   '⏸️ Κράτημα'}
                </Badge>
              </div>
            )}

            {/* Feedback messages */}
            {analysis && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Υποδείξεις:</span>
                <div className="space-y-1">
                  {analysis.feedback.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-start gap-2 p-2 rounded-none text-sm ${
                        msg.includes('✓') || msg.includes('💪') || msg.includes('Τέλεια') || msg.includes('Εξαιρετικ')
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {msg.includes('✓') || msg.includes('💪') || msg.includes('Τέλεια') || msg.includes('Εξαιρετικ')
                        ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      }
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics */}
            {analysis?.metrics && Object.keys(analysis.metrics).length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Μετρήσεις:</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(analysis.metrics).map(([key, value]) => (
                    <div key={key} className="p-2 bg-gray-50 rounded-none text-xs">
                      <span className="text-gray-500">{formatMetricName(key)}</span>
                      <div className="font-medium">{value}°</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Test Mode */}
        {mode === 'test' && fmsScore && (
          <>
            {/* FMS Score */}
            <div className="text-center p-4 bg-gray-50 rounded-none">
              <div 
                className={`text-5xl font-bold mb-2 ${
                  fmsScore.score === 3 ? 'text-green-500' :
                  fmsScore.score === 2 ? 'text-yellow-500' :
                  'text-red-500'
                }`}
              >
                {fmsScore.score}
              </div>
              <div className="text-sm text-gray-600">FMS Score (0-3)</div>
            </div>

            {/* Score interpretation */}
            <div className={`p-3 rounded-none ${
              fmsScore.score === 3 ? 'bg-green-50 border-green-200' :
              fmsScore.score === 2 ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            } border`}>
              <div className="font-medium text-sm mb-1">
                {fmsScore.score === 3 ? '🎯 Άριστη εκτέλεση' :
                 fmsScore.score === 2 ? '⚠️ Εκτέλεση με αντισταθμίσεις' :
                 '❌ Ανεπαρκής εκτέλεση'}
              </div>
              <p className="text-xs text-gray-600">
                {fmsScore.score === 3 
                  ? 'Δεν απαιτούνται διορθωτικές ασκήσεις για αυτό το pattern.'
                  : fmsScore.score === 2
                  ? 'Συνιστώνται διορθωτικές ασκήσεις για βελτίωση.'
                  : 'Απαιτούνται διορθωτικές ασκήσεις πριν την προπόνηση.'
                }
              </p>
            </div>

            {/* Feedback */}
            <div className="space-y-1">
              {fmsScore.feedback.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start gap-2 p-2 rounded-none text-sm ${
                    msg.includes('✓') || msg.includes('Τέλεια')
                      ? 'bg-green-50 text-green-700'
                      : msg.includes('⚠️')
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

function formatMetricName(key: string): string {
  const names: Record<string, string> = {
    kneeAngle: 'Γωνία Γονάτων',
    hipAngle: 'Γωνία Ισχίων',
    kneeTracking: 'Ευθυγράμμιση Γονάτων',
    torsoLean: 'Κλίση Κορμού',
    symmetry: 'Συμμετρία',
    elbowAngle: 'Γωνία Αγκώνων',
    bodyAlignment: 'Ευθυγράμμιση Σώματος',
    frontKneeAngle: 'Μπροστινό Γόνατο',
    backKneeAngle: 'Πίσω Γόνατο',
    torsoUprightness: 'Ορθότητα Κορμού',
  };
  return names[key] || key;
}

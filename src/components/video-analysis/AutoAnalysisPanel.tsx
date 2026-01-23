/**
 * Auto Analysis Panel - UI για αυτόματη ανάλυση βίντεο
 */

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Brain, 
  Target,
  Shield,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useVideoAnalyzer, AnalysisResult } from '@/hooks/useVideoAnalyzer';
import { DetectedStrike } from '@/hooks/useStrikeDetection';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AutoAnalysisPanelProps {
  videoElement: HTMLVideoElement | null;
  onStrikesDetected: (strikes: DetectedStrike[]) => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export const AutoAnalysisPanel: React.FC<AutoAnalysisPanelProps> = ({
  videoElement,
  onStrikesDetected,
  onAnalysisComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Settings
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [enableAI, setEnableAI] = useState(true);
  const [analysisSpeed, setAnalysisSpeed] = useState<'fast' | 'normal' | 'thorough'>('normal');
  const [detectPunches, setDetectPunches] = useState(true);
  const [detectKicks, setDetectKicks] = useState(true);
  const [detectKnees, setDetectKnees] = useState(true);
  const [detectElbows, setDetectElbows] = useState(true);

  const {
    analyzeVideo,
    cancelAnalysis,
    reset,
    progress,
    result,
    error,
    isAnalyzing,
    isLoading,
    isVerifying,
  } = useVideoAnalyzer({
    sensitivity,
    enableAIVerification: enableAI,
    analysisSpeed,
    detectPunches,
    detectKicks,
    detectKnees,
    detectElbows,
  });

  const handleStartAnalysis = useCallback(async () => {
    if (!videoElement) {
      toast.error('Δεν υπάρχει βίντεο για ανάλυση');
      return;
    }

    // Create hidden canvas for analysis
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    toast.info('Ξεκινάει η ανάλυση AI...', {
      description: 'Παρακαλώ περιμένετε',
    });

    await analyzeVideo(videoElement, canvas);

    if (result) {
      onStrikesDetected(result.strikes);
      onAnalysisComplete(result);
      toast.success(`Βρέθηκαν ${result.stats.totalStrikes} χτυπήματα!`);
    }
  }, [videoElement, analyzeVideo, result, onStrikesDetected, onAnalysisComplete]);

  const handleCancel = useCallback(() => {
    cancelAnalysis();
    toast.info('Η ανάλυση ακυρώθηκε');
  }, [cancelAnalysis]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const getPhaseLabel = () => {
    switch (progress.phase) {
      case 'loading': return 'Φόρτωση AI...';
      case 'analyzing': return 'Ανάλυση βίντεο...';
      case 'verifying': return 'Επαλήθευση AI...';
      case 'complete': return 'Ολοκληρώθηκε!';
      default: return 'Έτοιμο';
    }
  };

  const getSensitivityLabel = () => {
    switch (sensitivity) {
      case 'low': return 'Χαμηλή';
      case 'medium': return 'Μεσαία';
      case 'high': return 'Υψηλή';
    }
  };

  const getSpeedLabel = () => {
    switch (analysisSpeed) {
      case 'fast': return 'Γρήγορη';
      case 'normal': return 'Κανονική';
      case 'thorough': return 'Εμπεριστατωμένη';
    }
  };

  return (
    <Card className="rounded-none border-[#00ffba]/30 bg-black/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <Brain className="h-5 w-5 text-[#00ffba]" />
          AI Αυτόματη Ανάλυση
          <Badge variant="outline" className="ml-auto rounded-none border-[#00ffba] text-[#00ffba]">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Hidden canvas for analysis */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Phase indicator */}
        {progress.phase !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{getPhaseLabel()}</span>
              <span className="text-[#00ffba]">{progress.progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress.progress} className="h-2 rounded-none" />
            
            {progress.phase === 'analyzing' && (
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Χρόνος: {progress.currentTime.toFixed(1)}s / {progress.totalDuration.toFixed(1)}s</span>
                <span>Χτυπήματα: {progress.strikesFound}</span>
              </div>
            )}
            
            {progress.phase === 'verifying' && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Επαλήθευση με AI: {progress.strikesVerified}/{progress.strikesFound}</span>
              </div>
            )}
          </div>
        )}

        {/* Results summary */}
        {result && progress.phase === 'complete' && (
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-gray-900 p-2 text-center rounded-none">
              <div className="text-lg font-bold text-[#00ffba]">{result.stats.totalStrikes}</div>
              <div className="text-xs text-gray-500">Σύνολο</div>
            </div>
            <div className="bg-gray-900 p-2 text-center rounded-none">
              <div className="text-lg font-bold text-blue-400">{result.stats.punches}</div>
              <div className="text-xs text-gray-500">Box</div>
            </div>
            <div className="bg-gray-900 p-2 text-center rounded-none">
              <div className="text-lg font-bold text-orange-400">{result.stats.kicks}</div>
              <div className="text-xs text-gray-500">Kicks</div>
            </div>
            <div className="bg-gray-900 p-2 text-center rounded-none">
              <div className="text-lg font-bold text-purple-400">{result.stats.knees + result.stats.elbows}</div>
              <div className="text-xs text-gray-500">Knee/Elbow</div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Settings collapsible */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full rounded-none text-gray-400 hover:text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Ρυθμίσεις Ανάλυσης
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Sensitivity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-400">Ευαισθησία</Label>
                <Badge variant="outline" className="rounded-none text-xs">
                  {getSensitivityLabel()}
                </Badge>
              </div>
              <Slider
                value={[sensitivity === 'low' ? 0 : sensitivity === 'medium' ? 50 : 100]}
                onValueChange={([v]) => {
                  setSensitivity(v < 33 ? 'low' : v < 66 ? 'medium' : 'high');
                }}
                max={100}
                step={50}
                className="rounded-none"
              />
            </div>

            {/* Analysis speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-400">Ταχύτητα Ανάλυσης</Label>
                <Badge variant="outline" className="rounded-none text-xs">
                  {getSpeedLabel()}
                </Badge>
              </div>
              <Slider
                value={[analysisSpeed === 'fast' ? 0 : analysisSpeed === 'normal' ? 50 : 100]}
                onValueChange={([v]) => {
                  setAnalysisSpeed(v < 33 ? 'fast' : v < 66 ? 'normal' : 'thorough');
                }}
                max={100}
                step={50}
                className="rounded-none"
              />
            </div>

            {/* AI Verification toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#00ffba]" />
                <Label className="text-gray-400">AI Επαλήθευση</Label>
              </div>
              <Switch
                checked={enableAI}
                onCheckedChange={setEnableAI}
              />
            </div>

            {/* Strike type toggles */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-400 text-xs">Box</Label>
                <Switch
                  checked={detectPunches}
                  onCheckedChange={setDetectPunches}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-gray-400 text-xs">Kicks</Label>
                <Switch
                  checked={detectKicks}
                  onCheckedChange={setDetectKicks}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-gray-400 text-xs">Knees</Label>
                <Switch
                  checked={detectKnees}
                  onCheckedChange={setDetectKnees}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-gray-400 text-xs">Elbows</Label>
                <Switch
                  checked={detectElbows}
                  onCheckedChange={setDetectElbows}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action buttons */}
        <div className="flex gap-2">
          {progress.phase === 'idle' || progress.phase === 'complete' ? (
            <>
              <Button
                onClick={handleStartAnalysis}
                disabled={!videoElement || isLoading}
                className="flex-1 rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/80"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Φόρτωση...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Ανάλυση Βίντεο
                  </>
                )}
              </Button>
              {result && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="rounded-none border-gray-700 text-gray-400 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={handleCancel}
              variant="destructive"
              className="flex-1 rounded-none"
            >
              <Pause className="h-4 w-4 mr-2" />
              Ακύρωση
            </Button>
          )}
        </div>

        {/* Info text */}
        <p className="text-xs text-gray-500 text-center">
          Χρησιμοποιεί Pose Detection + Gemini AI για μέγιστη ακρίβεια
        </p>
      </CardContent>
    </Card>
  );
};

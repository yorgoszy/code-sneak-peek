/**
 * DataLabelingPanel — Phase 4
 * UI for reviewing AI-detected strikes, correcting labels, and building training data.
 */
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tag, Check, X, ThumbsUp, ThumbsDown, Database, ChevronLeft, ChevronRight,
  Save, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CompetitionStrike } from '@/hooks/useCompetitionStrikeDetection';

interface LabeledStrike extends CompetitionStrike {
  isCorrect: boolean | null; // null = not reviewed
  correctedType?: string;
  correctedCategory?: string;
  correctedCorner?: 'red' | 'blue';
  saved: boolean;
}

interface DataLabelingPanelProps {
  strikes: CompetitionStrike[];
  sessionId?: string;
  matchId?: string;
  isActive: boolean;
}

const STRIKE_TYPES = [
  'jab', 'cross', 'hook', 'uppercut',
  'roundhouse', 'front_kick', 'low_kick', 'teep', 'side_kick',
  'knee', 'flying_knee',
  'elbow', 'spinning_elbow',
];

const STRIKE_CATEGORIES = ['punch', 'kick', 'knee', 'elbow', 'other'];

export const DataLabelingPanel: React.FC<DataLabelingPanelProps> = ({
  strikes,
  sessionId,
  matchId,
  isActive,
}) => {
  const [labeledStrikes, setLabeledStrikes] = useState<LabeledStrike[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, correct: 0, corrected: 0, total: 0 });

  // Sync incoming strikes
  React.useEffect(() => {
    setLabeledStrikes(prev => {
      const existing = new Set(prev.map(s => s.id));
      const newStrikes = strikes
        .filter(s => !existing.has(s.id))
        .map(s => ({ ...s, isCorrect: null, saved: false }));
      return [...prev, ...newStrikes];
    });
  }, [strikes]);

  // Update stats
  React.useEffect(() => {
    const reviewed = labeledStrikes.filter(s => s.isCorrect !== null).length;
    const correct = labeledStrikes.filter(s => s.isCorrect === true).length;
    const corrected = labeledStrikes.filter(s => s.isCorrect === false).length;
    setStats({ reviewed, correct, corrected, total: labeledStrikes.length });
  }, [labeledStrikes]);

  const current = labeledStrikes[currentIndex] || null;

  const markCorrect = useCallback(() => {
    setLabeledStrikes(prev =>
      prev.map((s, i) => i === currentIndex ? { ...s, isCorrect: true } : s)
    );
    if (currentIndex < labeledStrikes.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, labeledStrikes.length]);

  const markIncorrect = useCallback(() => {
    setLabeledStrikes(prev =>
      prev.map((s, i) => i === currentIndex ? { ...s, isCorrect: false } : s)
    );
  }, [currentIndex]);

  const updateField = useCallback((field: string, value: string) => {
    setLabeledStrikes(prev =>
      prev.map((s, i) => i === currentIndex ? { ...s, [field]: value, isCorrect: false } : s)
    );
  }, [currentIndex]);

  const saveLabels = useCallback(async () => {
    const unsaved = labeledStrikes.filter(s => s.isCorrect !== null && !s.saved);
    if (unsaved.length === 0) {
      toast.info('Δεν υπάρχουν νέες ετικέτες για αποθήκευση');
      return;
    }

    setSaving(true);
    try {
      const rows = unsaved.map(s => ({
        session_id: sessionId || null,
        match_id: matchId || null,
        frame_timestamp: s.timestamp,
        strike_type: s.isCorrect ? s.type : (s.correctedType || s.type),
        strike_category: s.isCorrect ? s.category : (s.correctedCategory || s.category),
        fighter_corner: s.isCorrect ? s.corner : (s.correctedCorner || s.corner),
        confidence: s.confidence,
        is_landed: true,
        notes: s.isCorrect ? 'ai_correct' : 'ai_corrected',
      }));

      const { error } = await supabase.from('ai_training_labels').insert(rows);
      if (error) throw error;

      setLabeledStrikes(prev =>
        prev.map(s => unsaved.find(u => u.id === s.id) ? { ...s, saved: true } : s)
      );

      toast.success(`${unsaved.length} ετικέτες αποθηκεύτηκαν`);
    } catch (err) {
      console.error('Failed to save labels:', err);
      toast.error('Σφάλμα αποθήκευσης');
    } finally {
      setSaving(false);
    }
  }, [labeledStrikes, sessionId, matchId]);

  return (
    <Card className="rounded-none h-fit">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tag className="h-4 w-4" /> Data Labeling
          <Badge className="rounded-none bg-[#cb8954] text-black text-[9px] ml-auto">
            Phase 4
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="p-1.5 bg-muted/30 border border-border rounded-none">
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-[9px] text-muted-foreground">Total</p>
          </div>
          <div className="p-1.5 bg-muted/30 border border-border rounded-none">
            <p className="text-lg font-bold">{stats.reviewed}</p>
            <p className="text-[9px] text-muted-foreground">Reviewed</p>
          </div>
          <div className="p-1.5 bg-[#00ffba]/10 border border-[#00ffba]/30 rounded-none">
            <p className="text-lg font-bold text-[#00ffba]">{stats.correct}</p>
            <p className="text-[9px] text-muted-foreground">Correct</p>
          </div>
          <div className="p-1.5 bg-[#cb8954]/10 border border-[#cb8954]/30 rounded-none">
            <p className="text-lg font-bold text-[#cb8954]">{stats.corrected}</p>
            <p className="text-[9px] text-muted-foreground">Corrected</p>
          </div>
        </div>

        {labeledStrikes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Δεν υπάρχουν χτυπήματα για ετικετοποίηση</p>
            <p className="text-[10px] mt-1">Ξεκίνα την ανίχνευση για να συλλέξεις δεδομένα</p>
          </div>
        ) : (
          <>
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="rounded-none h-7 w-7 p-0"
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {labeledStrikes.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none h-7 w-7 p-0"
                onClick={() => setCurrentIndex(i => Math.min(labeledStrikes.length - 1, i + 1))}
                disabled={currentIndex >= labeledStrikes.length - 1}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>

            {/* Current strike review */}
            {current && (
              <div className={`p-3 border rounded-none space-y-2 ${
                current.isCorrect === true ? 'border-[#00ffba]/50 bg-[#00ffba]/5' :
                current.isCorrect === false ? 'border-[#cb8954]/50 bg-[#cb8954]/5' :
                'border-border'
              }`}>
                {/* AI Detection */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">{current.type}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {current.category} • {current.corner} corner • {Math.round(current.confidence * 100)}%
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-none ${current.corner === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
                </div>

                {/* Verification buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={markCorrect}
                    size="sm"
                    className={`rounded-none flex-1 text-xs ${
                      current.isCorrect === true
                        ? 'bg-[#00ffba] text-black hover:bg-[#00ffba]/90'
                        : ''
                    }`}
                    variant={current.isCorrect === true ? 'default' : 'outline'}
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" /> Σωστό
                  </Button>
                  <Button
                    onClick={markIncorrect}
                    size="sm"
                    className={`rounded-none flex-1 text-xs ${
                      current.isCorrect === false
                        ? 'bg-[#cb8954] text-black hover:bg-[#cb8954]/90'
                        : ''
                    }`}
                    variant={current.isCorrect === false ? 'default' : 'outline'}
                  >
                    <ThumbsDown className="h-3 w-3 mr-1" /> Λάθος
                  </Button>
                </div>

                {/* Correction fields (shown when marked incorrect) */}
                {current.isCorrect === false && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-0.5 block">Σωστός τύπος:</label>
                      <Select
                        value={current.correctedType || current.type}
                        onValueChange={(v) => updateField('correctedType', v)}
                      >
                        <SelectTrigger className="rounded-none h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {STRIKE_TYPES.map(t => (
                            <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-0.5 block">Κατηγορία:</label>
                      <Select
                        value={current.correctedCategory || current.category}
                        onValueChange={(v) => updateField('correctedCategory', v)}
                      >
                        <SelectTrigger className="rounded-none h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {STRIKE_CATEGORIES.map(c => (
                            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-0.5 block">Γωνία:</label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={(!current.correctedCorner ? current.corner : current.correctedCorner) === 'red' ? 'default' : 'outline'}
                          className="rounded-none flex-1 text-xs h-7"
                          onClick={() => updateField('correctedCorner', 'red')}
                        >
                          🔴 Red
                        </Button>
                        <Button
                          size="sm"
                          variant={(!current.correctedCorner ? current.corner : current.correctedCorner) === 'blue' ? 'default' : 'outline'}
                          className="rounded-none flex-1 text-xs h-7"
                          onClick={() => updateField('correctedCorner', 'blue')}
                        >
                          🔵 Blue
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {current.saved && (
                  <div className="flex items-center gap-1 text-[10px] text-[#00ffba]">
                    <Check className="h-3 w-3" /> Αποθηκεύτηκε
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Save button */}
            <Button
              onClick={saveLabels}
              disabled={saving || stats.reviewed === 0}
              size="sm"
              className="rounded-none w-full text-xs bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              {saving ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Αποθήκευση...</>
              ) : (
                <><Save className="h-3 w-3 mr-1" /> Αποθήκευση ετικετών ({stats.reviewed - labeledStrikes.filter(s => s.saved).length})</>
              )}
            </Button>

            {/* Quick stats */}
            <div className="text-[10px] text-muted-foreground text-center">
              <Database className="h-3 w-3 inline mr-1" />
              Training data: {labeledStrikes.filter(s => s.saved).length} saved labels
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

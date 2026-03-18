import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Menu, ArrowLeft, Camera, Settings, Play, Square, RotateCcw,
  Brain, Target, Activity, Save, Loader2, Video, MonitorPlay,
  Maximize2, Tag, Download, ChevronRight, Zap, Eye,
  AlertCircle, CheckCircle, Wifi, WifiOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";

type CombatSport = 'muay_thai' | 'boxing' | 'kickboxing' | 'mma' | 'karate' | 'taekwondo' | 'judo';
type AnalysisMode = 'strike_counting' | 'round_stats' | 'technique_evaluation' | 'fighter_comparison' | 'full';

const sportKeys: CombatSport[] = ['muay_thai', 'boxing', 'kickboxing', 'mma', 'karate', 'taekwondo', 'judo'];

const cameraPositions = ['front', 'back', 'left', 'right'] as const;

interface AnalysisCamera {
  id: string;
  ring_id: string;
  camera_index: number;
  camera_label: string;
  position: string;
  stream_url: string | null;
  is_active: boolean;
  fps: number;
}

interface AnalysisSession {
  id: string;
  status: string;
  analysis_type: string;
  sport: string;
  total_rounds: number;
  cameras_used: number;
  results: any;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface RoundResult {
  id: string;
  round_number: number;
  red_corner_data: any;
  blue_corner_data: any;
  round_summary: string;
  processing_time_ms: number;
}

const MultiCameraAnalysis: React.FC = () => {
  const { ringId: ringIdParam } = useParams<{ ringId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isFederation } = useRoleCheck();
  const { t } = useTranslation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const positionLabels: Record<string, string> = useMemo(() => ({
    front: t('aiLab.cameras.front'),
    back: t('aiLab.cameras.back'),
    left: t('aiLab.cameras.left'),
    right: t('aiLab.cameras.right'),
  }), [t]);
  const [activeTab, setActiveTab] = useState('cameras');

  // Ring selector (when no ringId in URL)
  const [availableRings, setAvailableRings] = useState<any[]>([]);
  const [selectedRingId, setSelectedRingId] = useState<string | null>(ringIdParam || null);
  const ringId = ringIdParam || selectedRingId;

  // Ring data
  const [ring, setRing] = useState<any>(null);
  const [currentMatch, setCurrentMatch] = useState<any>(null);

  // Camera config
  const [cameras, setCameras] = useState<AnalysisCamera[]>([]);
  const [savingCameras, setSavingCameras] = useState(false);

  // Analysis state
  const [selectedSport, setSelectedSport] = useState<CombatSport>('muay_thai');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('full');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentSession, setCurrentSession] = useState<AnalysisSession | null>(null);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

  // Sessions history
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);

  // Training labels
  const [labelingMode, setLabelingMode] = useState(false);
  const [trainingLabelsCount, setTrainingLabelsCount] = useState(0);

  // Camera dialog
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState<number | null>(null);

  // Load available rings when no ringId in params
  useEffect(() => {
    if (!ringIdParam) {
      loadAvailableRings();
    }
  }, [ringIdParam]);

  // Load ring and cameras
  useEffect(() => {
    if (!ringId) return;
    loadRingData();
    loadCameras();
    loadSessions();
  }, [ringId]);

  const loadAvailableRings = async () => {
    const { data } = await supabase
      .from('competition_rings')
      .select('id, ring_name, ring_number, competition_id, federation_competitions(name)')
      .order('ring_number');
    if (data) setAvailableRings(data);
  };

  const loadRingData = async () => {
    if (!ringId) return;
    const { data: ringData } = await supabase
      .from('competition_rings')
      .select('*, competition_id')
      .eq('id', ringId)
      .single();
    if (!ringData) return;
    setRing(ringData);

    if (ringData.current_match_id) {
      const { data: matchData } = await supabase
        .from('competition_matches')
        .select(`
          id, match_order, status, round_number,
          athlete1_id, athlete2_id,
          athlete1:app_users!competition_matches_athlete1_id_fkey(id, name, photo_url),
          athlete2:app_users!competition_matches_athlete2_id_fkey(id, name, photo_url)
        `)
        .eq('id', ringData.current_match_id)
        .single();
      if (matchData) setCurrentMatch(matchData);
    }
  };

  const loadCameras = async () => {
    if (!ringId) return;
    const { data } = await supabase
      .from('ring_analysis_cameras')
      .select('*')
      .eq('ring_id', ringId)
      .order('camera_index');

    if (data && data.length > 0) {
      setCameras(data as AnalysisCamera[]);
    } else {
      // Initialize 4 default cameras
      const defaults: AnalysisCamera[] = cameraPositions.map((pos, i) => ({
        id: '',
        ring_id: ringId!,
        camera_index: i + 1,
        camera_label: `Camera ${i + 1}`,
        position: pos,
        stream_url: null,
        is_active: i === 0, // Only first active by default
        fps: 160,
      }));
      setCameras(defaults);
    }
  };

  const loadSessions = async () => {
    if (!ringId) return;
    const { data } = await supabase
      .from('ai_analysis_sessions')
      .select('*')
      .eq('ring_id', ringId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setSessions(data as AnalysisSession[]);

    // Count training labels
    const { count } = await supabase
      .from('ai_training_labels')
      .select('*', { count: 'exact', head: true });
    setTrainingLabelsCount(count || 0);
  };

  const saveCameras = async () => {
    if (!ringId) return;
    setSavingCameras(true);
    try {
      for (const cam of cameras) {
        if (cam.id) {
          await supabase.from('ring_analysis_cameras').update({
            camera_label: cam.camera_label,
            position: cam.position,
            stream_url: cam.stream_url,
            is_active: cam.is_active,
            fps: cam.fps,
          }).eq('id', cam.id);
        } else {
          const { data } = await supabase.from('ring_analysis_cameras').insert({
            ring_id: ringId,
            camera_index: cam.camera_index,
            camera_label: cam.camera_label,
            position: cam.position,
            stream_url: cam.stream_url,
            is_active: cam.is_active,
            fps: cam.fps,
          }).select().single();
          if (data) {
            setCameras(prev => prev.map(c =>
              c.camera_index === cam.camera_index ? { ...c, id: data.id } : c
            ));
          }
        }
      }
      toast.success(t('aiLab.cameras.saved'));
    } catch (err) {
      toast.error(t('aiLab.cameras.saveError'));
    } finally {
      setSavingCameras(false);
    }
  };

  const updateCamera = (index: number, field: string, value: any) => {
    setCameras(prev => prev.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    ));
  };

  const activeCameras = cameras.filter(c => c.is_active && c.stream_url);

  // Start AI Analysis
  const startAnalysis = async () => {
    if (!ringId || activeCameras.length === 0) {
      toast.error(t('aiLab.analysis.setupCamera'));
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('ai_analysis_sessions')
        .insert({
          ring_id: ringId,
          match_id: currentMatch?.id || null,
          competition_id: ring?.competition_id || null,
          analysis_type: 'live',
          sport: selectedSport,
          status: 'analyzing',
          started_at: new Date().toISOString(),
          cameras_used: activeCameras.length,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setCurrentSession(session as AnalysisSession);

      // For each round, send frames to Gemini
      const totalRounds = currentMatch?.round_number || 3;
      const roundResultsArr: RoundResult[] = [];

      for (let round = 1; round <= totalRounds; round++) {
        setAnalysisProgress(Math.round((round / totalRounds) * 90));

        const startTime = Date.now();

        // Call edge function with multi-camera context
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
          'analyze-combat-video',
          {
            body: {
              sport: selectedSport,
              mode: analysisMode,
              roundNumber: round,
              fighterNames: currentMatch ? {
                red: (currentMatch as any).athlete1?.name || 'Red',
                blue: (currentMatch as any).athlete2?.name || 'Blue',
              } : undefined,
              camerasUsed: activeCameras.length,
              cameraPositions: activeCameras.map(c => c.position),
              // In production, videoUrl would come from Mac Mini stream recorder
              videoUrl: activeCameras[0]?.stream_url || undefined,
            }
          }
        );

        if (analysisError) {
          console.error('Round analysis error:', analysisError);
          continue;
        }

        const processingTime = Date.now() - startTime;

        // Save round result
        const { data: roundData } = await supabase
          .from('ai_analysis_rounds')
          .insert({
            session_id: session.id,
            round_number: round,
            red_corner_data: analysisData?.analysis?.strike_stats?.red_corner
              || analysisData?.analysis?.red_corner || {},
            blue_corner_data: analysisData?.analysis?.strike_stats?.blue_corner
              || analysisData?.analysis?.blue_corner || {},
            round_summary: analysisData?.analysis?.analysis_notes
              || analysisData?.analysis?.round_notes || '',
            raw_ai_response: analysisData,
            processing_time_ms: processingTime,
          })
          .select()
          .single();

        if (roundData) roundResultsArr.push(roundData as RoundResult);
      }

      // Complete session
      await supabase
        .from('ai_analysis_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_rounds: totalRounds,
          results: JSON.parse(JSON.stringify({
            rounds: roundResultsArr,
            summary: roundResultsArr.length > 0 ? 'Analysis complete' : 'No rounds analyzed',
          })),
        })
        .eq('id', session.id);

      setRoundResults(roundResultsArr);
      setAnalysisProgress(100);
      toast.success(`${t('aiLab.analysis.analysisComplete')} - ${roundResultsArr.length} ${t('aiLab.history.rounds')}`);
      loadSessions();

    } catch (err) {
      console.error('Analysis error:', err);
      toast.error(t('aiLab.cameras.saveError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    setAnalysisProgress(0);
  };

  // Load results of a past session
  const loadSessionResults = async (sessionId: string) => {
    const { data } = await supabase
      .from('ai_analysis_rounds')
      .select('*')
      .eq('session_id', sessionId)
      .order('round_number');
    if (data) {
      setRoundResults(data as RoundResult[]);
      setActiveTab('results');
    }
  };

  const renderSidebar = () => (
    <FederationSidebar
      isCollapsed={false}
      setIsCollapsed={() => {}}
    />
  );

  const renderCameraCard = (cam: AnalysisCamera, index: number) => (
    <Card key={index} className={`rounded-none border ${cam.is_active ? 'border-foreground/30' : 'border-border'}`}>
      <CardContent className="p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className={`h-3.5 w-3.5 ${cam.is_active ? 'text-foreground' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium">{cam.camera_label}</span>
            <Badge variant="outline" className="rounded-none text-[10px] px-1.5 py-0">
              {positionLabels[cam.position] || cam.position}
            </Badge>
          </div>
          <Switch
            checked={cam.is_active}
            onCheckedChange={v => updateCamera(index, 'is_active', v)}
            className="scale-90"
          />
        </div>
        <Input
          value={cam.stream_url || ''}
          onChange={e => updateCamera(index, 'stream_url', e.target.value)}
          placeholder="rtsp://mac-mini.local:8554/cam1"
          className="rounded-none text-xs h-7"
        />
        <div className="flex gap-2">
          <Select value={cam.position} onValueChange={v => updateCamera(index, 'position', v)}>
            <SelectTrigger className="rounded-none h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cameraPositions.map(p => (
                <SelectItem key={p} value={p}>{positionLabels[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(cam.fps)} onValueChange={v => updateCamera(index, 'fps', Number(v))}>
            <SelectTrigger className="rounded-none h-7 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 fps</SelectItem>
              <SelectItem value="60">60 fps</SelectItem>
              <SelectItem value="120">120 fps</SelectItem>
              <SelectItem value="160">160 fps</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          {cam.is_active && cam.stream_url ? (
            <><Wifi className="h-3 w-3 text-foreground" /><span>{t('aiLab.cameras.active')}</span></>
          ) : cam.is_active ? (
            <><AlertCircle className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">{t('aiLab.cameras.noUrl')}</span></>
          ) : (
            <><WifiOff className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">{t('aiLab.cameras.disabled')}</span></>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderStrikeTable = (data: any, corner: string) => {
    if (!data?.strikes && !data?.total_strikes_thrown) return (
      <p className="text-xs text-muted-foreground">{t('aiLab.results.noData')}</p>
    );

    const strikes = data.strikes || {};
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium border-b border-border pb-1">
          <span>{t('aiLab.results.strike')}</span>
          <span>{t('aiLab.results.thrownLanded')}</span>
        </div>
        {Object.entries(strikes).map(([type, vals]: [string, any]) => (
          <div key={type} className="flex justify-between text-xs">
            <span className="capitalize">{type.replace(/_/g, ' ')}</span>
            <span>{vals?.thrown || 0} / {vals?.landed || 0}</span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between text-xs font-bold">
          <span>{t('aiLab.results.total')}</span>
          <span>{data.total_strikes_thrown || 0} / {data.total_strikes_landed || 0}</span>
        </div>
        {data.accuracy_percentage !== undefined && (
          <div className="flex justify-between text-xs">
            <span>{t('aiLab.results.accuracy')}</span>
            <span className="font-medium">{data.accuracy_percentage}%</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">
          {renderSidebar()}
        </div>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">{t('aiLab.title')}</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="rounded-none" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      {t('aiLab.title')}
                    AI Analysis Lab
                    {ring && <Badge variant="outline" className="rounded-none ml-2 text-xs">{ring.ring_name || `Ring ${ring.ring_number}`}</Badge>}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {ringId ? `${activeCameras.length}/4 ${t('aiLab.activeCameras')}` : t('aiLab.selectRing')}
                  </p>
                </div>
              </div>

              {currentMatch && (
                <div className="flex items-center gap-3">
                  <div className="text-right text-sm">
                    <span className="font-medium text-red-600">{(currentMatch as any).athlete1?.name}</span>
                    <span className="text-muted-foreground mx-2">vs</span>
                    <span className="font-medium text-blue-600">{(currentMatch as any).athlete2?.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ring Selector - shown when no ringId in URL */}
            {!ringIdParam && (
              <div className="mb-4">
                <Label className="text-xs font-medium mb-1.5 block">{t('aiLab.selectRing')}</Label>
                <div className="flex flex-wrap gap-2">
                  {availableRings.map((r: any) => (
                    <Button
                      key={r.id}
                      variant={ringId === r.id ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-none text-xs"
                      onClick={() => setSelectedRingId(r.id)}
                    >
                      {r.ring_name || `Ring ${r.ring_number}`}
                    </Button>
                  ))}
                  {availableRings.length === 0 && (
                    <p className="text-xs text-muted-foreground">{t('aiLab.noRingsFound')}</p>
                  )}
                </div>
              </div>
            )}

            {ringId ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="rounded-none mb-4">
                <TabsTrigger value="cameras" className="rounded-none gap-1">
                  <Camera className="h-4 w-4" /> Κάμερες
                </TabsTrigger>
                <TabsTrigger value="analysis" className="rounded-none gap-1">
                  <Brain className="h-4 w-4" /> Ανάλυση
                </TabsTrigger>
                <TabsTrigger value="results" className="rounded-none gap-1">
                  <Target className="h-4 w-4" /> Αποτελέσματα
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none gap-1">
                  <Activity className="h-4 w-4" /> Ιστορικό
                </TabsTrigger>
                <TabsTrigger value="training" className="rounded-none gap-1">
                  <Tag className="h-4 w-4" /> Training Data
                </TabsTrigger>
              </TabsList>

              {/* ─── CAMERAS TAB ─── */}
              <TabsContent value="cameras" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Τοποθέτηση Καμερών</h2>
                    <p className="text-xs text-muted-foreground">Κάντε κλικ σε κάμερα για ρύθμιση</p>
                  </div>
                  <Button onClick={saveCameras} disabled={savingCameras} className="rounded-none" size="sm">
                    {savingCameras ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Αποθήκευση
                  </Button>
                </div>

                {/* Ring diagram - clickable cameras */}
                <Card className="rounded-none">
                  <CardContent className="p-4">
                    <div className="relative w-full max-w-md mx-auto aspect-square border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <div className="text-center text-muted-foreground text-xs">RING</div>
                      {cameras.map((cam, i) => {
                        const positions: Record<string, string> = {
                          front: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
                          back: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
                          left: 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2',
                          right: 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2',
                        };
                        return (
                          <div
                            key={i}
                            className={`absolute ${positions[cam.position] || positions.front} cursor-pointer`}
                            onClick={() => {
                              setSelectedCameraIndex(i);
                              setCameraDialogOpen(true);
                            }}
                          >
                            <div className={`flex items-center gap-1 px-2 py-1 text-xs rounded-none transition-colors hover:bg-foreground/20 ${cam.is_active ? 'bg-foreground/10 text-foreground border border-foreground/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                              <Camera className="h-3 w-3" />
                              <span>{i + 1}</span>
                              {cam.is_active && cam.stream_url && (
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Camera status summary */}
                <div className="grid grid-cols-4 gap-2">
                  {cameras.map((cam, i) => (
                    <div
                      key={i}
                      className={`p-2 border rounded-none text-center cursor-pointer transition-colors hover:bg-muted/50 ${cam.is_active ? 'border-foreground/30' : 'border-border'}`}
                      onClick={() => {
                        setSelectedCameraIndex(i);
                        setCameraDialogOpen(true);
                      }}
                    >
                      <Camera className={`h-4 w-4 mx-auto mb-1 ${cam.is_active ? 'text-foreground' : 'text-muted-foreground'}`} />
                      <p className="text-[10px] font-medium">{cam.camera_label}</p>
                      <p className="text-[10px] text-muted-foreground">{positionLabels[cam.position]}</p>
                      <div className="mt-1">
                        {cam.is_active && cam.stream_url ? (
                          <Badge variant="outline" className="rounded-none text-[9px] px-1 py-0">Ενεργή</Badge>
                        ) : cam.is_active ? (
                          <Badge variant="outline" className="rounded-none text-[9px] px-1 py-0 text-muted-foreground">Χωρίς URL</Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-none text-[9px] px-1 py-0 text-muted-foreground">Off</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ─── ANALYSIS TAB ─── */}
              <TabsContent value="analysis" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Settings */}
                  <Card className="rounded-none lg:col-span-1">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Ρυθμίσεις Ανάλυσης
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      <div>
                        <Label className="text-xs">Άθλημα</Label>
                        <Select value={selectedSport} onValueChange={v => setSelectedSport(v as CombatSport)}>
                          <SelectTrigger className="rounded-none h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sportKeys.map(k => (
                              <SelectItem key={k} value={k}>{t(`aiLab.sports.${k}`)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Mode Ανάλυσης</Label>
                        <Select value={analysisMode} onValueChange={v => setAnalysisMode(v as AnalysisMode)}>
                          <SelectTrigger className="rounded-none h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Πλήρης Ανάλυση</SelectItem>
                            <SelectItem value="strike_counting">Μέτρηση Χτυπημάτων</SelectItem>
                            <SelectItem value="round_stats">Στατιστικά Γύρου</SelectItem>
                            <SelectItem value="technique_evaluation">Αξιολόγηση Τεχνικής</SelectItem>
                            <SelectItem value="fighter_comparison">Σύγκριση Αθλητών</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Ενεργές κάμερες:</span>
                          <span className="text-foreground">{activeCameras.length}/4</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Εκτ. κόστος/γύρο:</span>
                          <span className="text-foreground">~$0.07</span>
                        </div>
                        <div className="flex justify-between">
                          <span>AI Model:</span>
                          <span className="text-foreground">Gemini 2.0 Flash</span>
                        </div>
                      </div>

                      <Button
                        onClick={isAnalyzing ? stopAnalysis : startAnalysis}
                        disabled={activeCameras.length === 0 && !isAnalyzing}
                        className={`w-full rounded-none ${isAnalyzing ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                      >
                        {isAnalyzing ? (
                          <><Square className="h-4 w-4 mr-1" /> Διακοπή</>
                        ) : (
                          <><Play className="h-4 w-4 mr-1" /> Έναρξη Ανάλυσης</>
                        )}
                      </Button>

                      {isAnalyzing && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Πρόοδος</span>
                            <span>{analysisProgress}%</span>
                          </div>
                          <Progress value={analysisProgress} className="h-2 rounded-none" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Camera feeds preview */}
                  <Card className="rounded-none lg:col-span-2">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MonitorPlay className="h-4 w-4" /> Camera Feeds
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        {cameras.map((cam, i) => (
                          <div key={i} className={`aspect-video border rounded-none flex items-center justify-center ${cam.is_active ? 'border-foreground/20 bg-black' : 'border-border bg-muted/50'}`}>
                            {cam.is_active && cam.stream_url ? (
                              <div className="text-center">
                                <Video className="h-8 w-8 text-foreground mx-auto mb-1" />
                                <p className="text-xs text-foreground">{cam.camera_label}</p>
                                <p className="text-[10px] text-muted-foreground">{cam.fps}fps • {positionLabels[cam.position]}</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Camera className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                                <p className="text-xs text-muted-foreground">
                                  {cam.is_active ? 'Χωρίς stream' : 'Απενεργοποιημένη'}
                                </p>
                              </div>
                            )}
                            {/* Camera label overlay */}
                            <div className="absolute top-1 left-1">
                              <Badge className={`rounded-none text-[10px] ${cam.is_active ? 'bg-foreground/10 text-foreground' : 'bg-muted'}`}>
                                CAM {cam.camera_index} • {positionLabels[cam.position]}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ─── RESULTS TAB ─── */}
              <TabsContent value="results" className="space-y-4">
                {roundResults.length === 0 ? (
                  <Card className="rounded-none">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Δεν υπάρχουν αποτελέσματα ακόμα.</p>
                      <p className="text-xs mt-1">Ξεκινήστε μια ανάλυση ή επιλέξτε από το ιστορικό.</p>
                    </CardContent>
                  </Card>
                ) : (
                  roundResults.map(round => (
                    <Card key={round.id} className="rounded-none">
                      <CardHeader className="p-3 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Γύρος {round.round_number}</CardTitle>
                          {round.processing_time_ms && (
                            <Badge variant="outline" className="rounded-none text-xs">
                              {(round.processing_time_ms / 1000).toFixed(1)}s
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-medium mb-2">🔴 Red Corner</h4>
                            {renderStrikeTable(round.red_corner_data, 'red')}
                          </div>
                          <div>
                            <h4 className="text-xs font-medium mb-2">🔵 Blue Corner</h4>
                            {renderStrikeTable(round.blue_corner_data, 'blue')}
                          </div>
                        </div>
                        {round.round_summary && (
                          <div className="mt-3 p-2 bg-muted/50 text-xs">
                            <p className="font-medium mb-1">Σημειώσεις AI:</p>
                            <p>{round.round_summary}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* ─── HISTORY TAB ─── */}
              <TabsContent value="history" className="space-y-2">
                {sessions.length === 0 ? (
                  <Card className="rounded-none">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Δεν υπάρχει ιστορικό αναλύσεων.</p>
                    </CardContent>
                  </Card>
                ) : (
                  sessions.map(session => (
                    <Card key={session.id} className="rounded-none hover:border-foreground/20 cursor-pointer transition-colors"
                      onClick={() => loadSessionResults(session.id)}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-none ${session.status === 'completed' ? 'bg-foreground/10' : session.status === 'analyzing' ? 'bg-amber-500/10' : 'bg-destructive/10'}`}>
                              {session.status === 'completed' ? (
                                <CheckCircle className="h-4 w-4 text-foreground" />
                              ) : session.status === 'analyzing' ? (
                                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {t(`aiLab.sports.${session.sport}`, { defaultValue: session.sport })}
                                {' • '}
                                {session.analysis_type === 'live' ? 'Live' : 'Post-Match'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(session.created_at).toLocaleString('el-GR')}
                                {' • '}
                                {session.cameras_used} κάμερες • {session.total_rounds} γύροι
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* ─── TRAINING DATA TAB ─── */}
              <TabsContent value="training" className="space-y-4">
                <Card className="rounded-none">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Tag className="h-4 w-4" /> Training Data Collection
                        <Badge variant="outline" className="rounded-none">Phase 3</Badge>
                      </CardTitle>
                      <Badge className="rounded-none" variant="outline">
                        {trainingLabelsCount} labels
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Συλλέξτε labeled data από αγώνες για fine-tuning του AI μοντέλου.
                      Κάθε label αντιστοιχεί σε ένα frame με τον τύπο χτυπήματος, τη γωνία κάμερας,
                      και τη γωνία του αθλητή.
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      <Card className="rounded-none p-3 text-center">
                        <Zap className="h-6 w-6 mx-auto mb-1 text-foreground" />
                        <p className="text-xs font-medium">Auto-Label</p>
                        <p className="text-[10px] text-muted-foreground">
                          AI labels → Human review
                        </p>
                      </Card>
                      <Card className="rounded-none p-3 text-center">
                        <Eye className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs font-medium">Manual Label</p>
                        <p className="text-[10px] text-muted-foreground">
                          Frame-by-frame annotation
                        </p>
                      </Card>
                      <Card className="rounded-none p-3 text-center">
                        <Download className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs font-medium">Export</p>
                        <p className="text-[10px] text-muted-foreground">
                          JSONL for Gemini tuning
                        </p>
                      </Card>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="text-xs font-medium">Πρόοδος Εκπαίδευσης</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Minimum για fine-tuning:</span>
                          <span>{trainingLabelsCount} / 1,000</span>
                        </div>
                        <Progress value={Math.min((trainingLabelsCount / 1000) * 100, 100)} className="h-2 rounded-none" />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Συνιστώμενο:</span>
                        <span>5,000+ labels</span>
                      </div>
                    </div>

                    <Button disabled className="w-full rounded-none" variant="outline">
                      <Tag className="h-4 w-4 mr-1" />
                      Έναρξη Labeling (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            ) : !ringIdParam && availableRings.length > 0 ? null : null}
          </main>
        </div>
      </div>

      {/* Camera Settings Dialog */}
      {selectedCameraIndex !== null && (
        <Dialog open={cameraDialogOpen} onOpenChange={setCameraDialogOpen}>
          <DialogContent className="max-w-md rounded-none">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <Camera className="h-4 w-4" />
                {cameras[selectedCameraIndex]?.camera_label} — Ρυθμίσεις
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Ενεργοποίηση</Label>
                <Switch
                  checked={cameras[selectedCameraIndex]?.is_active}
                  onCheckedChange={v => updateCamera(selectedCameraIndex, 'is_active', v)}
                />
              </div>
              <div>
                <Label className="text-xs">Stream URL</Label>
                <Input
                  value={cameras[selectedCameraIndex]?.stream_url || ''}
                  onChange={e => updateCamera(selectedCameraIndex, 'stream_url', e.target.value)}
                  placeholder="rtsp://mac-mini.local:8554/cam1"
                  className="rounded-none text-xs h-8 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Θέση</Label>
                  <Select value={cameras[selectedCameraIndex]?.position} onValueChange={v => updateCamera(selectedCameraIndex, 'position', v)}>
                    <SelectTrigger className="rounded-none h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cameraPositions.map(p => (
                        <SelectItem key={p} value={p}>{positionLabels[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">FPS</Label>
                  <Select value={String(cameras[selectedCameraIndex]?.fps)} onValueChange={v => updateCamera(selectedCameraIndex, 'fps', Number(v))}>
                    <SelectTrigger className="rounded-none h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 fps</SelectItem>
                      <SelectItem value="60">60 fps</SelectItem>
                      <SelectItem value="120">120 fps</SelectItem>
                      <SelectItem value="160">160 fps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs pt-1">
                {cameras[selectedCameraIndex]?.is_active && cameras[selectedCameraIndex]?.stream_url ? (
                  <><Wifi className="h-3 w-3 text-foreground" /><span>Ενεργή</span></>
                ) : cameras[selectedCameraIndex]?.is_active ? (
                  <><AlertCircle className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Χωρίς URL</span></>
                ) : (
                  <><WifiOff className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Απενεργοποιημένη</span></>
                )}
              </div>
              <Button
                onClick={() => {
                  saveCameras();
                  setCameraDialogOpen(false);
                }}
                disabled={savingCameras}
                className="w-full rounded-none"
                size="sm"
              >
                {savingCameras ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Αποθήκευση
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </SidebarProvider>
  );
};

export default MultiCameraAnalysis;

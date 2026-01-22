import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Shield, Clock, TrendingUp, Users, Swords, Settings, Activity, Film, Calendar, MapPin, User, Eye, Edit, Trash2, Loader2, Trophy, CheckCircle } from 'lucide-react';
import elbowIcon from '@/assets/elbow-icon.png';
import boxIcon from '@/assets/box-icon.png';
import kneeIcon from '@/assets/knee-icon.png';
import kickIcon from '@/assets/kick-icon.png';
import clinchIcon from '@/assets/clinch-icon.png';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useFightStats } from '@/hooks/useFightStats';
import { FightTimelineChart } from './FightTimelineChart';
import { FightRecordingDialog } from './FightRecordingDialog';
import { StrikeTypesDialog } from './StrikeTypesDialog';
import { VideoEditorTab } from './VideoEditorTab';
import { FightViewDialog } from './FightViewDialog';
import { FightEditDialog } from './FightEditDialog';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useCoachContext } from '@/contexts/CoachContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Fight {
  id: string;
  user_id: string;
  opponent_name: string | null;
  fight_date: string;
  result: string | null;
  fight_type: string | null;
  total_rounds: number | null;
  round_duration_seconds: number | null;
  location: string | null;
  weight_class: string | null;
  notes: string | null;
  video_url: string | null;
  user_name?: string;
  user_avatar?: string;
}

export const VideoAnalysisOverview = () => {
  const { userProfile } = useRoleCheck();
  const { coachId: contextCoachId } = useCoachContext();
  const coachId = contextCoachId || userProfile?.id;
  
  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const [isStrikeTypesOpen, setIsStrikeTypesOpen] = useState(false);
  
  // Fights state
  const [fights, setFights] = useState<Fight[]>([]);
  const [loadingFights, setLoadingFights] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFightForAction, setSelectedFightForAction] = useState<Fight | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { stats, loading: loadingStats } = useFightStats(selectedFightId);

  // Fetch ALL fights (with user info)
  const fetchFights = useCallback(async () => {
    if (!coachId) return;
    
    setLoadingFights(true);
    try {
      const { data, error } = await supabase
        .from('muaythai_fights')
        .select(`
          *,
          app_users!muaythai_fights_user_id_fkey (
            name,
            avatar_url,
            photo_url
          )
        `)
        .eq('coach_id', coachId)
        .order('fight_date', { ascending: false });

      if (error) throw error;
      
      const mappedFights = (data || []).map((f: any) => ({
        ...f,
        user_name: f.app_users?.name,
        user_avatar: f.app_users?.photo_url || f.app_users?.avatar_url
      }));
      
      setFights(mappedFights);
    } catch (error) {
      console.error('Error fetching fights:', error);
    } finally {
      setLoadingFights(false);
    }
  }, [coachId]);

  useEffect(() => {
    fetchFights();
  }, [fetchFights]);

  const handleDeleteFight = async () => {
    if (!selectedFightForAction) return;

    try {
      const { error } = await supabase
        .from('muaythai_fights')
        .delete()
        .eq('id', selectedFightForAction.id);

      if (error) throw error;

      setFights(prev => prev.filter(f => f.id !== selectedFightForAction.id));
      if (selectedFightId === selectedFightForAction.id) {
        setSelectedFightId(null);
      }
      
      toast({
        title: "Επιτυχία",
        description: "Ο αγώνας διαγράφηκε"
      });
    } catch (error) {
      console.error('Error deleting fight:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία διαγραφής αγώνα",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedFightForAction(null);
    }
  };

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case 'win':
        return <Badge className="bg-green-500 hover:bg-green-600 rounded-none text-xs">Νίκη</Badge>;
      case 'loss':
        return <Badge className="bg-red-500 hover:bg-red-600 rounded-none text-xs">Ήττα</Badge>;
      case 'draw':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 rounded-none text-xs">Ισοπαλία</Badge>;
      case 'no_contest':
        return <Badge className="bg-gray-500 hover:bg-gray-600 rounded-none text-xs">Ακυρος</Badge>;
      default:
        return <Badge variant="outline" className="rounded-none text-xs">-</Badge>;
    }
  };

  const getFightTypeLabel = (type: string | null) => {
    switch (type) {
      case 'amateur': return 'Ερασ.';
      case 'professional': return 'Επαγ.';
      case 'sparring': return 'Spar';
      default: return type || '-';
    }
  };

  const statCards = [
    {
      title: 'Χτυπήματα',
      value: stats?.totalStrikes || 0,
      subtitle: `${stats?.landedStrikes || 0} επιτυχ.`,
      icon: Target,
      color: 'text-foreground',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      title: 'Ορθότητα',
      value: `${stats?.correctnessRate || 0}%`,
      subtitle: `${stats?.correctStrikes || 0} σωστά`,
      icon: CheckCircle,
      color: 'text-foreground',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      title: 'Άμυνες',
      value: `${stats?.successfulDefenses || 0}/${stats?.totalHitsReceived || 0}`,
      subtitle: 'αμυν./δέχτ.',
      icon: Shield,
      color: 'text-foreground',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      title: 'Χρόνος',
      value: stats?.actionTimeFormatted || '0:00',
      subtitle: null,
      customSubtitle: true,
      attackTime: stats?.attackTimeFormatted || '0:00',
      defenseTime: stats?.defenseTimeFormatted || '0:00',
      icon: Clock,
      color: 'text-foreground',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
  ];

  const getFightStyleInfo = () => {
    if (!stats) return { label: '-', color: 'text-gray-400' };
    const ratio = stats.attackDefenseRatio || 0;
    if (ratio >= 1.5) return { label: 'Επιθετικός', color: 'text-red-500' };
    if (ratio <= 0.7) return { label: 'Αμυντικός', color: 'text-blue-500' };
    return { label: 'Ισορροπημένος', color: 'text-green-500' };
  };

  const fightStyleInfo = getFightStyleInfo();

  const statCards2 = [
    {
      title: 'Box',
      value: stats?.punchesTotal || 0,
      subtitle: `${stats?.punchesLanded || 0} επιτυχ.`,
      icon: Target,
      imageIcon: boxIcon,
      color: 'text-foreground',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      title: 'Kicks',
      value: stats?.kicksTotal || 0,
      subtitle: `${stats?.kicksLanded || 0} επιτυχ.`,
      icon: Activity,
      imageIcon: kickIcon,
      color: 'text-foreground',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      title: 'Knees',
      value: stats?.kneesTotal || 0,
      subtitle: `${stats?.kneesLanded || 0} επιτυχ.`,
      icon: Activity,
      imageIcon: kneeIcon,
      color: 'text-foreground',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      title: 'Elbows',
      value: stats?.elbowsTotal || 0,
      subtitle: `${stats?.elbowsLanded || 0} επιτυχ.`,
      icon: Activity,
      imageIcon: elbowIcon,
      color: 'text-foreground',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      title: 'Clinch',
      value: stats?.clinchTimeFormatted || '0:00',
      subtitle: `${stats?.clinchTotal || 0} φορές`,
      icon: Users,
      imageIcon: clinchIcon,
      color: 'text-foreground',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
  ];

  const styleInfo = {
    aggressive: { label: 'Επιθετικός', color: 'bg-red-500' },
    defensive: { label: 'Αμυντικός', color: 'bg-blue-500' },
    balanced: { label: 'Ισορροπημένος', color: 'bg-green-500' },
  };

  const currentStyle = stats?.fightStyle || 'balanced';
  const selectedFight = fights.find(f => f.id === selectedFightId);

  return (
    <div className="space-y-4 p-3 md:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Button
            onClick={() => setIsStrikeTypesOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-none h-9"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">Video Analysis</h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-0.5 md:space-y-2">
        {/* Row 1 */}
        <div className="grid grid-cols-4 md:grid-cols-4 gap-0.5 md:gap-2">
          {statCards.map((card, index) => (
            <Card key={index} className={`rounded-none transition-all ${selectedFightId ? 'ring-1 ring-[#00ffba]/20' : 'opacity-50'}`}>
              <CardContent className="p-1 md:p-2">
                <div className="flex items-center gap-1 md:gap-2">
                  {(card as any).imageIcon ? (
                    <img src={(card as any).imageIcon} alt={card.title} className="w-3 h-3 md:w-4 md:h-4 object-contain flex-shrink-0" />
                  ) : (
                    <card.icon className={`w-3 h-3 md:w-4 md:h-4 ${card.color} flex-shrink-0`} />
                  )}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className={`text-sm md:text-lg font-bold ${card.color} leading-tight truncate`}>
                      {loadingStats ? '...' : card.value}
                    </p>
                    {(card as any).customSubtitle ? (
                      <p className="text-[8px] md:text-[10px] truncate">
                        <span className="text-blue-500 font-medium">Επ: {(card as any).attackTime}</span>
                        <span className="text-gray-400 mx-0.5">|</span>
                        <span className="text-red-500 font-medium">Άμ: {(card as any).defenseTime}</span>
                      </p>
                    ) : (
                      <p className="text-[8px] md:text-[10px] text-gray-500 truncate">{card.title}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-5 md:grid-cols-5 gap-0.5 md:gap-2">
          {statCards2.map((card, index) => (
            <Card key={index} className={`rounded-none transition-all ${selectedFightId ? 'ring-1 ring-[#00ffba]/10' : 'opacity-50'}`}>
              <CardContent className="p-1 md:p-2">
                <div className="flex items-center gap-1 md:gap-2">
                  {(card as any).imageIcon ? (
                    <img src={(card as any).imageIcon} alt={card.title} className="w-3 h-3 md:w-4 md:h-4 object-contain flex-shrink-0" />
                  ) : (
                    <card.icon className={`w-3 h-3 md:w-4 md:h-4 ${card.color} flex-shrink-0`} />
                  )}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className={`text-sm md:text-lg font-bold ${card.color} leading-tight truncate`}>
                      {loadingStats ? '...' : card.value}
                    </p>
                    <p className="text-[8px] md:text-[10px] text-gray-500 truncate">{card.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 3 - Στυλ Box */}
        <Card className={`rounded-none transition-all ${selectedFightId ? 'ring-1 ring-[#00ffba]/10' : 'opacity-50'}`}>
          <CardContent className="p-1 md:p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className={`w-4 h-4 md:w-5 md:h-5 ${fightStyleInfo.color} flex-shrink-0`} />
                <div>
                  <p className={`text-sm md:text-xl font-bold ${fightStyleInfo.color} leading-tight`}>
                    {loadingStats ? '...' : fightStyleInfo.label}
                  </p>
                  <p className="text-[8px] md:text-xs text-gray-500">Στυλ Μάχης</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs md:text-base font-semibold text-foreground">
                  Επ/Άμ: {stats?.attackDefenseRatio?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      {selectedFightId && (
        <FightTimelineChart 
          roundsData={stats?.roundsTimelineData || []}
          loading={loadingStats} 
        />
      )}

      {/* Selected Fight Info */}
      <div className="flex items-center gap-3 px-2 flex-wrap">
        {selectedFight ? (
          <>
            <div className="flex items-center gap-2">
              {getResultBadge(selectedFight.result)}
              <span className="text-sm font-medium">
                vs {selectedFight.opponent_name || 'Άγνωστος'}
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(selectedFight.fight_date), 'dd/MM/yy', { locale: el })}
              </span>
            </div>
            <Swords className="w-4 h-4 text-gray-400" />
            <div className={`px-2 py-0.5 ${styleInfo[currentStyle as keyof typeof styleInfo].color} text-white text-xs font-medium rounded-none`}>
              {styleInfo[currentStyle as keyof typeof styleInfo].label}
            </div>
            <span className="text-xs text-gray-500">
              Επ/Άμ: {stats?.attackDefenseRatio?.toFixed(2) || '1.00'}
            </span>
          </>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Επιλέξτε αγώνα για να δείτε τα στατιστικά
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="fights" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="flex w-max sm:grid sm:w-full sm:grid-cols-2 rounded-none h-8 gap-0.5">
            <TabsTrigger value="fights" className="rounded-none text-xs py-1.5 px-3 whitespace-nowrap flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Αγώνες ({fights.length})
            </TabsTrigger>
            <TabsTrigger value="editor" className="rounded-none text-xs py-1.5 px-3 whitespace-nowrap flex items-center gap-1">
              <Film className="w-3 h-3" />
              Editor
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Fights Tab */}
        <TabsContent value="fights" className="mt-2">
          {loadingFights ? (
            <Card className="rounded-none">
              <CardContent className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </CardContent>
            </Card>
          ) : fights.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="py-8 text-center">
                <Trophy className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Δεν υπάρχουν αγώνες</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {fights.map((fight) => (
                <Card 
                  key={fight.id} 
                  className={`rounded-none cursor-pointer transition-all hover:shadow-md ${
                    selectedFightId === fight.id ? 'ring-2 ring-[#00ffba] bg-[#00ffba]/5' : ''
                  }`}
                  onClick={() => setSelectedFightId(fight.id === selectedFightId ? null : fight.id)}
                >
                  <CardContent className="p-2 md:p-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {fight.user_avatar ? (
                          <img src={fight.user_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium truncate">{fight.user_name || 'Άγνωστος'}</span>
                          <span className="text-xs text-gray-400">vs</span>
                          <span className="text-sm font-medium truncate">{fight.opponent_name || '-'}</span>
                          {getResultBadge(fight.result)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(fight.fight_date), 'dd/MM/yy', { locale: el })}
                          </div>
                          {fight.location && (
                            <div className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[80px]">{fight.location}</span>
                            </div>
                          )}
                          <Badge variant="outline" className="rounded-none text-[10px] px-1 py-0">
                            {getFightTypeLabel(fight.fight_type)}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-none h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFightForAction(fight);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-none h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFightForAction(fight);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-none h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFightForAction(fight);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Editor Tab */}
        <TabsContent value="editor" className="mt-2">
          <VideoEditorTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <StrikeTypesDialog
        isOpen={isStrikeTypesOpen}
        onClose={() => setIsStrikeTypesOpen(false)}
        coachId={coachId}
      />

      <FightViewDialog
        isOpen={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedFightForAction(null);
        }}
        fight={selectedFightForAction}
      />

      <FightEditDialog
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedFightForAction(null);
        }}
        fight={selectedFightForAction}
        onSave={() => {
          setEditDialogOpen(false);
          setSelectedFightForAction(null);
          fetchFights();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Ο αγώνας και όλα τα δεδομένα του θα διαγραφούν οριστικά.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFight} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

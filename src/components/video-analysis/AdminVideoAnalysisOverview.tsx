import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Shield, Clock, TrendingUp, Users, Swords, Settings, Activity, Film, Calendar, MapPin, User, Eye, Edit, Trash2, Loader2, Trophy } from 'lucide-react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import { useFightStats, defaultFightStats, FightStats } from '@/hooks/useFightStats';
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
}

export const AdminVideoAnalysisOverview = () => {
  const { userProfile } = useRoleCheck();
  const adminId = userProfile?.id;
  const [selectedUserId, setSelectedUserId] = useState<string>('');
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

  // Fetch fights function
  const fetchFights = useCallback(async () => {
    if (!selectedUserId) {
      setFights([]);
      setSelectedFightId(null);
      return;
    }
    
    setLoadingFights(true);
    try {
      const { data, error } = await supabase
        .from('muaythai_fights')
        .select('*')
        .eq('user_id', selectedUserId)
        .order('fight_date', { ascending: false });

      if (error) throw error;
      setFights(data || []);
    } catch (error) {
      console.error('Error fetching fights:', error);
    } finally {
      setLoadingFights(false);
    }
  }, [selectedUserId]);

  // Fetch fights when user changes
  useEffect(() => {
    fetchFights();
    setSelectedFightId(null); // Reset selected fight
  }, [selectedUserId, fetchFights]);

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
      color: 'text-[#00ffba]',
      bgColor: 'bg-[#00ffba]/10',
    },
    {
      title: 'Ορθότητα',
      value: `${stats?.correctnessRate || 0}%`,
      subtitle: `${stats?.correctStrikes || 0} σωστά`,
      icon: Activity,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Δέχτηκε',
      value: stats?.totalHitsReceived || 0,
      subtitle: `${stats?.avgHitsReceivedPerRound || 0}/γύρο`,
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Άμυνες',
      value: stats?.totalDefenses || 0,
      subtitle: `${stats?.successfulDefenses || 0} επιτυχ.`,
      icon: Shield,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Χρόνος',
      value: stats?.actionTimeFormatted || '0:00',
      subtitle: 'Δράσης',
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  // Second row of stats
  const statCards2 = [
    {
      title: 'Αριστ.',
      value: stats?.leftSideStrikes || 0,
      subtitle: `${stats?.leftSidePercentage || 0}%`,
      icon: Target,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Δεξί',
      value: stats?.rightSideStrikes || 0,
      subtitle: `${stats?.rightSidePercentage || 0}%`,
      icon: Target,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'Επίθεση',
      value: stats?.attackTimeFormatted || '0:00',
      subtitle: 'Χρόνος',
      icon: Swords,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Άμυνα',
      value: stats?.defenseTimeFormatted || '0:00',
      subtitle: 'Χρόνος',
      icon: Shield,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Kicks',
      value: stats?.kicksTotal || 0,
      subtitle: `${stats?.kicksLanded || 0} επιτυχ.`,
      icon: Activity,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Knees',
      value: stats?.kneesTotal || 0,
      subtitle: `${stats?.kneesLanded || 0} επιτυχ.`,
      icon: Activity,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Elbows',
      value: stats?.elbowsTotal || 0,
      subtitle: `${stats?.elbowsLanded || 0} επιτυχ.`,
      icon: Activity,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
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
          <div className="flex-1 max-w-xs">
            <UserSearchCombobox
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              placeholder="Επιλέξτε χρήστη..."
              coachId={adminId}
            />
          </div>
        </div>
      </div>

      {!selectedUserId ? (
        <Card className="rounded-none">
          <CardContent className="py-8 text-center">
            <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">Επιλέξτε χρήστη</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards Row 1 */}
          <div className="grid grid-cols-5 md:grid-cols-5 gap-2">
            {statCards.map((card, index) => (
              <Card key={index} className={`rounded-none transition-all ${selectedFightId ? 'ring-1 ring-[#00ffba]/20' : 'opacity-50'}`}>
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 ${card.bgColor} rounded-none`}>
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-lg font-bold ${card.color} leading-tight`}>
                        {loadingStats ? '...' : card.value}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{card.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Cards Row 2 */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {statCards2.map((card, index) => (
              <Card key={index} className={`rounded-none transition-all ${selectedFightId ? 'ring-1 ring-[#00ffba]/10' : 'opacity-50'}`}>
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 ${card.bgColor} rounded-none`}>
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-lg font-bold ${card.color} leading-tight`}>
                        {loadingStats ? '...' : card.value}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{card.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Timeline Chart - only show when fight is selected */}
          {selectedFightId && (
            <FightTimelineChart 
              data={stats?.timelineData || []} 
              loading={loadingStats} 
            />
          )}

          {/* Selected Fight Info & Fight Style */}
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
                        selectedFightId === fight.id 
                          ? 'ring-2 ring-[#00ffba] bg-[#00ffba]/5' 
                          : 'border hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFightId(fight.id === selectedFightId ? null : fight.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          {/* Left side - Fight info */}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getResultBadge(fight.result)}
                              <Badge variant="outline" className="rounded-none text-xs">
                                {getFightTypeLabel(fight.fight_type)}
                              </Badge>
                              {fight.weight_class && (
                                <Badge variant="secondary" className="rounded-none text-xs">
                                  {fight.weight_class}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                              {fight.opponent_name && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>vs {fight.opponent_name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{format(new Date(fight.fight_date), 'dd MMM yyyy', { locale: el })}</span>
                              </div>
                              {fight.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{fight.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right side - Actions */}
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-none h-7 w-7 p-0"
                              onClick={() => {
                                setSelectedFightForAction(fight);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-none h-7 w-7 p-0"
                              onClick={() => {
                                setSelectedFightForAction(fight);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-none h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => {
                                setSelectedFightForAction(fight);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
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
            <TabsContent value="editor" className="mt-4">
              <VideoEditorTab userId={selectedUserId} onFightSaved={fetchFights} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Dialogs */}
      <FightRecordingDialog
        isOpen={isRecordingOpen}
        onClose={() => setIsRecordingOpen(false)}
        userId={selectedUserId}
        coachId={adminId}
        onSuccess={() => {
          setSelectedUserId('');
          setTimeout(() => setSelectedUserId(selectedUserId), 100);
        }}
      />

      <StrikeTypesDialog
        isOpen={isStrikeTypesOpen}
        onClose={() => setIsStrikeTypesOpen(false)}
        coachId={adminId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Ο αγώνας και όλα τα σχετικά δεδομένα θα διαγραφούν οριστικά.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFight} 
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          // Refresh fights
          const fetchFights = async () => {
            const { data } = await supabase
              .from('muaythai_fights')
              .select('*')
              .eq('user_id', selectedUserId)
              .order('fight_date', { ascending: false });
            setFights(data || []);
          };
          fetchFights();
        }}
      />
    </div>
  );
};

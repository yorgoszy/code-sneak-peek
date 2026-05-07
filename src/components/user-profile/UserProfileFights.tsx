import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Trophy, Loader2, Film } from 'lucide-react';
import { format } from 'date-fns';
import { useFightStats } from '@/hooks/useFightStats';
import { FightTimelineChart } from '@/components/video-analysis/FightTimelineChart';
import { Target, Shield, Clock, CheckCircle, Swords, Activity } from 'lucide-react';
import boxIcon from '@/assets/box-icon.png';
import kickIcon from '@/assets/kick-icon.png';
import kneeIcon from '@/assets/knee-icon.png';
import elbowIcon from '@/assets/elbow-icon.png';

interface Fight {
  id: string;
  opponent_name: string | null;
  fight_date: string;
  result: string | null;
  fight_type: string | null;
  competition_name: string | null;
  location: string | null;
  weight_class: string | null;
  video_url: string | null;
  our_corner: string | null;
}

const parseYouTubeId = (url: string): string | null => {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
};
const buildEmbedUrl = (url: string) => {
  const id = parseYouTubeId(url);
  if (!id) return url;
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
};

const getResultBadge = (result: string | null) => {
  switch (result) {
    case 'win':
      return <Badge className="bg-green-500 hover:bg-green-600 rounded-none text-xs">Νίκη</Badge>;
    case 'win_ko':
      return <Badge className="bg-green-500 hover:bg-green-600 rounded-none text-xs">Νίκη με ΚΟ</Badge>;
    case 'win_tko':
      return <Badge className="bg-green-500 hover:bg-green-600 rounded-none text-xs">Νίκη με TKO</Badge>;
    case 'loss':
      return <Badge className="bg-red-500 hover:bg-red-600 rounded-none text-xs">Ήττα</Badge>;
    case 'loss_ko':
      return <Badge className="bg-red-500 hover:bg-red-600 rounded-none text-xs">Ήττα με ΚΟ</Badge>;
    case 'loss_tko':
      return <Badge className="bg-red-500 hover:bg-red-600 rounded-none text-xs">Ήττα με TKO</Badge>;
    case 'draw':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 rounded-none text-xs">Ισοπαλία</Badge>;
    default:
      return <Badge variant="outline" className="rounded-none text-xs">-</Badge>;
  }
};

interface Props {
  userId: string;
}

export const UserProfileFights: React.FC<Props> = ({ userId }) => {
  const [fights, setFights] = useState<Fight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('muaythai_fights')
        .select('id,opponent_name,fight_date,result,fight_type,competition_name,location,weight_class,video_url,our_corner')
        .eq('user_id', userId)
        .order('fight_date', { ascending: false });
      if (!error) {
        const list = (data as any[]) as Fight[];
        setFights(list);
        if (list.length > 0) setSelectedFightId(list[0].id);
      }
      setLoading(false);
    };
    if (userId) load();
  }, [userId]);

  const selectedFight = useMemo(
    () => fights.find(f => f.id === selectedFightId) || null,
    [fights, selectedFightId]
  );

  const { stats, loading: statsLoading } = useFightStats(selectedFightId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (fights.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-8 text-center text-gray-500">
          <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Δεν υπάρχουν αγώνες ακόμη.</p>
        </CardContent>
      </Card>
    );
  }

  const isRed = (selectedFight?.our_corner || 'red') === 'red';

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Αγώνες</h2>

      {/* Fights list */}
      <div className="grid gap-1.5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {fights.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedFightId(f.id)}
            className={`text-left border rounded-none p-2 transition-all ${
              selectedFightId === f.id
                ? 'border-black bg-gray-50 ring-1 ring-black'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5 gap-1">
              <span className="text-xs font-semibold truncate">vs {f.opponent_name || '—'}</span>
              {getResultBadge(f.result)}
            </div>
            <div className="text-[10px] text-gray-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(f.fight_date), 'dd/MM/yyyy')}
            </div>
            {f.competition_name && (
              <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                <Trophy className="w-3 h-3 shrink-0" /> <span className="truncate">{f.competition_name}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected fight video + stats */}
      {selectedFight && (
        <div className="space-y-4">
          {selectedFight.video_url && (
            <div className="bg-black border border-black max-w-2xl mx-auto w-full">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={buildEmbedUrl(selectedFight.video_url)}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`vs ${selectedFight.opponent_name || ''}`}
                />
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="rounded-none">
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight">
                      <span className={isRed ? 'text-red-500' : 'text-blue-500'}>{stats?.totalStrikes || 0}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className={isRed ? 'text-blue-500' : 'text-red-500'}>{stats?.opponentTotalStrikes || 0}</span>
                    </p>
                    <p className="text-[10px] text-gray-500">Χτυπήματα</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-none">
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight">
                      <span className={isRed ? 'text-red-500' : 'text-blue-500'}>{stats?.correctnessRate || 0}%</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className={isRed ? 'text-blue-500' : 'text-red-500'}>{stats?.opponentCorrectnessRate || 0}%</span>
                    </p>
                    <p className="text-[10px] text-gray-500">Ορθότητα</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-none">
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight">{stats?.actionTimeFormatted || '0:00'}</p>
                    <p className="text-[10px] text-gray-500">Χρόνος δράσης</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: boxIcon, label: 'Box', a: stats?.punchesTotal, b: stats?.opponentPunchesTotal },
              { icon: kickIcon, label: 'Kicks', a: stats?.kicksTotal, b: stats?.opponentKicksTotal },
              { icon: kneeIcon, label: 'Knees', a: stats?.kneesTotal, b: stats?.opponentKneesTotal },
              { icon: elbowIcon, label: 'Elbows', a: stats?.elbowsTotal, b: stats?.opponentElbowsTotal },
            ].map((c, i) => (
              <Card key={i} className="rounded-none">
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <img src={c.icon} alt={c.label} className="w-4 h-4 object-contain" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight">
                        <span className={isRed ? 'text-red-500' : 'text-blue-500'}>{c.a || 0}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className={isRed ? 'text-blue-500' : 'text-red-500'}>{c.b || 0}</span>
                      </p>
                      <p className="text-[10px] text-gray-500">{c.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Card className="rounded-none">
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">
                      <span className={isRed ? 'text-red-500' : 'text-blue-500'}>{stats?.successfulDefenses || 0}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className={isRed ? 'text-blue-500' : 'text-red-500'}>{stats?.opponentSuccessfulDefenses || 0}</span>
                    </p>
                    <p className="text-[10px] text-gray-500">Άμυνα</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-none">
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">
                      <span className={isRed ? 'text-red-500' : 'text-blue-500'}>{stats?.landedStrikes || 0}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className={isRed ? 'text-blue-500' : 'text-red-500'}>{stats?.opponentLandedStrikes || 0}</span>
                    </p>
                    <p className="text-[10px] text-gray-500">Επίθεση (επιτυχ.)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline chart */}
          {!statsLoading && stats?.roundsTimelineData && (
            <FightTimelineChart roundsData={stats.roundsTimelineData} loading={statsLoading} />
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfileFights;

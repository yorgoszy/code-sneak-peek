import React, { useEffect, useState } from 'react';
import { isStoredFightVideo, resolveFightVideoUrl } from '@/utils/fightVideoStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, User, Clock, Trophy, FileText, Video, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { useFightStats } from '@/hooks/useFightStats';
import { FightTimelineChart } from './FightTimelineChart';
import { el } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  our_corner?: string | null;
  user_name?: string | null;
}

interface FightViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fight: Fight | null;
  onVideoSaved?: () => void;
}

export const FightViewDialog: React.FC<FightViewDialogProps> = ({ isOpen, onClose, fight, onVideoSaved }) => {
  const [playableUrl, setPlayableUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(fight?.video_url || null);
  const [linkInput, setLinkInput] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const { stats, loading: statsLoading } = useFightStats(isOpen && fight ? fight.id : null);

  useEffect(() => {
    setVideoUrl(fight?.video_url || null);
    setLinkInput('');
  }, [fight?.id, fight?.video_url]);

  useEffect(() => {
    let cancelled = false;
    setPlayableUrl(null);
    if (isOpen && videoUrl) {
      resolveFightVideoUrl(videoUrl).then((u) => { if (!cancelled) setPlayableUrl(u); });
    }
    return () => { cancelled = true; };
  }, [isOpen, videoUrl]);

  const handleSaveLink = async () => {
    const url = linkInput.trim();
    if (!url || !fight) return;
    setSavingLink(true);
    try {
      const { data, error } = await supabase
        .from('muaythai_fights')
        .update({ video_url: url, is_public: true } as any)
        .eq('id', fight.id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Δεν έχεις δικαίωμα αποθήκευσης');
      setVideoUrl(url);
      onVideoSaved?.();
      toast.success('Το βίντεο αποθηκεύτηκε!');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Σφάλμα κατά την αποθήκευση του link');
    } finally {
      setSavingLink(false);
    }
  };

  if (!fight) return null;

  const getResultLabel = (result: string | null) => {
    switch (result) {
      case 'win': return { label: 'Νίκη', color: 'bg-green-500', isKo: false };
      case 'win_ko':
      case 'win_tko': return { label: 'Νίκη', color: 'bg-green-500', isKo: true };
      case 'loss': return { label: 'Ήττα', color: 'bg-red-500', isKo: false };
      case 'loss_ko':
      case 'loss_tko': return { label: 'Ήττα', color: 'bg-red-500', isKo: true };
      case 'draw': return { label: 'Ισοπαλία', color: 'bg-yellow-500', isKo: false };
      case 'no_contest': return { label: 'Άκυρος', color: 'bg-gray-500', isKo: false };
      default: return { label: '-', color: 'bg-gray-300', isKo: false };
    }
  };

  const getFightTypeLabel = (type: string | null) => {
    switch (type) {
      case 'amateur': return 'Ερασιτεχνικός';
      case 'professional': return 'Επαγγελματικός';
      case 'sparring': return 'Sparring';
      default: return type || '-';
    }
  };

  const result = getResultLabel(fight.result);

  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('vimeo.com')) {
      const id = url.split('/').pop()?.split('?')[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  };

  const isStored = isStoredFightVideo(videoUrl);
  const embedUrl = videoUrl && !isStored ? getEmbedUrl(videoUrl) : null;
  const isDirectVideo = isStored || (videoUrl ? /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(videoUrl) : false);

  const fmtRounds = fight.total_rounds
    ? `${fight.total_rounds} γύροι${fight.round_duration_seconds ? ` × ${Math.floor(fight.round_duration_seconds / 60)}:${(fight.round_duration_seconds % 60).toString().padStart(2, '0')}` : ''}`
    : null;
  const ourBlue = fight.our_corner === 'blue';
  const rb = (ours: React.ReactNode, theirs: React.ReactNode) => (
    <span className="font-bold">
      <span className="text-competition-red">{ourBlue ? theirs : ours}</span>
      <span className="text-muted-foreground"> / </span>
      <span className="text-competition-blue">{ourBlue ? ours : theirs}</span>
    </span>
  );
  const StatCard = ({ label, value, sub, className = '' }: { label: string; value: React.ReactNode; sub?: React.ReactNode; className?: string }) => (
    <div className={`min-w-0 break-words border border-border p-2 ${className}`}>
      <div className="text-sm sm:text-base leading-tight">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none w-[calc(100vw-1rem)] max-w-[1400px] max-h-[calc(100dvh-1rem)] overflow-y-auto overflow-x-hidden p-3 sm:p-4">
        <DialogHeader className="min-w-0 text-left pr-6">
          <DialogTitle className="flex items-center gap-2 text-base flex-wrap">
            <Trophy className="w-4 h-4 shrink-0" />
            <span className="min-w-0 break-words">
              <span className="text-competition-red">{ourBlue ? (fight.opponent_name || '-') : (fight.user_name || '-')}</span>
              <span className="text-muted-foreground"> vs </span>
              <span className="text-competition-blue">{ourBlue ? (fight.user_name || '-') : (fight.opponent_name || '-')}</span>
            </span>
            <Badge className={`${result.color} rounded-none text-white`}>{result.label}</Badge>
            {result.isKo && <Badge className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-none">KO</Badge>}
            <Badge variant="outline" className="rounded-none">{getFightTypeLabel(fight.fight_type)}</Badge>
            <span className="w-full lg:w-auto min-w-0 text-xs font-normal text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(fight.fight_date), 'dd/MM/yyyy', { locale: el })}</span>
              {fight.location && <span className="flex min-w-0 items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /><span className="break-words">{fight.location}</span></span>}
              {fight.weight_class && <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{fight.weight_class}</span>}
              {fmtRounds && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtRounds}</span>}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3 sm:gap-4">
          <div className="min-w-0 space-y-2">
            {videoUrl ? (
              embedUrl ? (
                <div className="aspect-video w-full bg-black">
                  <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Fight video" />
                </div>
              ) : isDirectVideo ? (
                playableUrl ? (
                  <video src={playableUrl} controls className="w-full aspect-video bg-black" />
                ) : (
                  <div className="w-full aspect-video bg-muted flex items-center justify-center text-sm text-muted-foreground">Φόρτωση βίντεο...</div>
                )
              ) : (
                <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline break-all">Προβολή Video</a>
              )
            ) : (
              <div className="min-h-40 sm:aspect-video w-full border border-border flex flex-col items-center justify-center gap-2 p-3 sm:p-4">
                <Video className="w-6 h-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">Δεν υπάρχει βίντεο. Βάλε link YouTube για να εμφανίζεται εδώ και στην αρχική σελίδα:</p>
                <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0 max-w-md">
                  <Input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="rounded-none min-w-0 h-8 text-sm" />
                  <Button onClick={handleSaveLink} disabled={savingLink || !linkInput.trim()} className="rounded-none shrink-0 h-8">
                    {savingLink ? '...' : 'Αποθήκευση'}
                  </Button>
                </div>
              </div>
            )}
            {fight.notes && (
              <p className="text-xs text-muted-foreground flex min-w-0 items-start gap-1"><FileText className="w-3 h-3 mt-0.5 shrink-0" /><span className="min-w-0 whitespace-pre-wrap break-words">{fight.notes}</span></p>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold">Στατιστικά Ανάλυσης</p>
            {statsLoading ? (
              <p className="text-xs text-muted-foreground">Φόρτωση...</p>
            ) : !stats || (stats.totalStrikes === 0 && stats.opponentTotalStrikes === 0) ? (
              <p className="text-xs text-muted-foreground">Δεν υπάρχει αποθηκευμένη ανάλυση για αυτόν τον αγώνα.</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <StatCard label="Χτυπήματα" value={rb(stats.totalStrikes, stats.opponentTotalStrikes)} sub={<>Επιτυχ.: {rb(stats.landedStrikes, stats.opponentLandedStrikes)}</>} />
                  <StatCard label="Ορθότητα" value={rb(`${stats.correctnessRate}%`, `${stats.opponentCorrectnessRate}%`)} />
                  <StatCard label="Χρόνος" value={<span className="font-bold">{stats.actionTimeFormatted}</span>} sub={<><span className="text-competition-red">Επ: {stats.attackTimeFormatted}</span> | <span className="text-competition-blue">Άμ: {stats.defenseTimeFormatted}</span></>} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatCard label="Box" value={rb(stats.punchesTotal, stats.opponentPunchesTotal)} sub={<>Επιτυχ.: {rb(stats.punchesLanded, stats.opponentPunchesLanded)}</>} />
                  <StatCard label="Kicks" value={rb(stats.kicksTotal, stats.opponentKicksTotal)} sub={<>Επιτυχ.: {rb(stats.kicksLanded, stats.opponentKicksLanded)}</>} />
                  <StatCard label="Knees" value={rb(stats.kneesTotal, stats.opponentKneesTotal)} sub={<>Επιτυχ.: {rb(stats.kneesLanded, stats.opponentKneesLanded)}</>} />
                  <StatCard label="Elbows" value={rb(stats.elbowsTotal, stats.opponentElbowsTotal)} sub={<>Επιτυχ.: {rb(stats.elbowsLanded, stats.opponentElbowsLanded)}</>} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="Άμυνα" value={rb(`${stats.defenseSuccessRate}%`, `${stats.totalStrikes > 0 ? Math.round((stats.opponentSuccessfulDefenses / stats.totalStrikes) * 100) : 0}%`)} sub={<>Δέχτηκε: {rb(stats.totalHitsReceived, stats.opponentTotalHitsReceived)}</>} />
                  <StatCard label="Επίθεση" value={rb(`${stats.accuracy}%`, `${stats.opponentAccuracy}%`)} />
                </div>
                <div className="flex items-center justify-between gap-2 border border-border p-2">
                  <div>
                    <p className="text-sm font-bold">
                      {stats.attackDefenseRatio >= 1.5 ? 'Επιθετικός' : stats.attackDefenseRatio <= 0.7 ? 'Αμυντικός' : 'Ισορροπημένος'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Στυλ Μάχης</p>
                  </div>
                  <span className="text-xs font-semibold">Επ/Άμ: {stats.attackDefenseRatio.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {(statsLoading || stats.roundsTimelineData.length > 0) && (
          <FightTimelineChart roundsData={stats.roundsTimelineData} loading={statsLoading} ourIsBlue={ourBlue} responsiveLayout />
        )}
      </DialogContent>
    </Dialog>
  );
};

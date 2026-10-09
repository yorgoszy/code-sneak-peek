import React, { useEffect, useState } from 'react';
import { isStoredFightVideo, resolveFightVideoUrl } from '@/utils/fightVideoStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, User, Clock, Trophy, FileText, Video, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { useFightStats } from '@/hooks/useFightStats';
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
}

interface FightViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fight: Fight | null;
}

export const FightViewDialog: React.FC<FightViewDialogProps> = ({ isOpen, onClose, fight }) => {
  const [playableUrl, setPlayableUrl] = useState<string | null>(null);
  const { stats, loading: statsLoading } = useFightStats(isOpen && fight ? fight.id : null);

  useEffect(() => {
    let cancelled = false;
    setPlayableUrl(null);
    if (isOpen && fight?.video_url) {
      resolveFightVideoUrl(fight.video_url).then((u) => { if (!cancelled) setPlayableUrl(u); });
    }
    return () => { cancelled = true; };
  }, [isOpen, fight?.video_url]);

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

  const isStored = isStoredFightVideo(fight.video_url);
  const embedUrl = fight.video_url && !isStored ? getEmbedUrl(fight.video_url) : null;
  const isDirectVideo = isStored || (fight.video_url ? /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(fight.video_url) : false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Στοιχεία Αγώνα
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Result Badge */}
          <div className="flex items-center gap-2">
            <Badge className={`${result.color} rounded-none text-white`}>
              {result.label}
            </Badge>
            {result.isKo && (
              <Badge className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-none">
                KO
              </Badge>
            )}
            <Badge variant="outline" className="rounded-none">
              {getFightTypeLabel(fight.fight_type)}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {fight.opponent_name && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Αντίπαλος</p>
                  <p className="font-medium">{fight.opponent_name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Ημερομηνία</p>
                <p className="font-medium">
                  {format(new Date(fight.fight_date), 'dd MMMM yyyy', { locale: el })}
                </p>
              </div>
            </div>

            {fight.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Τοποθεσία</p>
                  <p className="font-medium">{fight.location}</p>
                </div>
              </div>
            )}

            {fight.weight_class && (
              <div className="flex items-center gap-3">
                <Scale className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Κατηγορία Βάρους</p>
                  <p className="font-medium">{fight.weight_class}</p>
                </div>
              </div>
            )}

            {fight.total_rounds && (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Γύροι</p>
                  <p className="font-medium">
                    {fight.total_rounds} γύροι
                    {fight.round_duration_seconds && (
                      <span className="text-gray-500">
                        {' '}× {fight.round_duration_seconds >= 60 
                          ? `${Math.floor(fight.round_duration_seconds / 60)}:${(fight.round_duration_seconds % 60).toString().padStart(2, '0')}`
                          : `${fight.round_duration_seconds}"`}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {fight.video_url && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-gray-500" />
                  <p className="text-xs text-gray-500">Video</p>
                </div>
                {embedUrl ? (
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Fight video"
                    />
                  </div>
                ) : isDirectVideo ? (
                  playableUrl ? (
                  <video
                    src={playableUrl}
                    controls
                    className="w-full aspect-video bg-black"
                  />
                  ) : (
                    <div className="w-full aspect-video bg-muted flex items-center justify-center text-sm text-muted-foreground">Φόρτωση βίντεο...</div>
                  )
                ) : (
                  <a
                    href={fight.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Προβολή Video
                  </a>
                )}
              </div>
            )}

            {!fight.video_url && (
              <div className="flex items-start gap-3 border border-border p-3">
                <Video className="w-4 h-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Δεν υπάρχει αποθηκευμένο βίντεο. Η ανάλυση έγινε από αρχείο του υπολογιστή, που δεν ανεβαίνει. Πάτα το μολύβι και ανέβασε το βίντεο ή πρόσθεσε link YouTube για να εμφανίζεται εδώ.
                </p>
              </div>
            )}

            {fight.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Σημειώσεις</p>
                  <p className="text-sm whitespace-pre-wrap">{fight.notes}</p>
                </div>
              </div>
            )}
          </div>
          {/* Analysis stats */}
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-sm font-semibold">Στατιστικά Ανάλυσης</p>
            {statsLoading ? (
              <p className="text-xs text-muted-foreground">Φόρτωση...</p>
            ) : !stats || (stats.totalStrikes === 0 && stats.opponentTotalStrikes === 0) ? (
              <p className="text-xs text-muted-foreground">Δεν υπάρχει αποθηκευμένη ανάλυση για αυτόν τον αγώνα.</p>
            ) : (() => {
              const ourBlue = fight.our_corner === 'blue';
              const rows: [string, string | number, string | number][] = [
                ['Χτυπήματα', stats.totalStrikes, stats.opponentTotalStrikes],
                ['Επιτυχημένα', stats.landedStrikes, stats.opponentLandedStrikes],
                ['Επίθεση (ποσοστό)', `${stats.accuracy}%`, `${stats.opponentAccuracy}%`],
                ['Ορθότητα', `${stats.correctStrikes} (${stats.correctnessRate}%)`, `${stats.opponentCorrectStrikes} (${stats.opponentCorrectnessRate}%)`],
                ['Χέρια', `${stats.punchesLanded}/${stats.punchesTotal}`, `${stats.opponentPunchesLanded}/${stats.opponentPunchesTotal}`],
                ['Πόδια', `${stats.kicksLanded}/${stats.kicksTotal}`, `${stats.opponentKicksLanded}/${stats.opponentKicksTotal}`],
                ['Αγκώνες', `${stats.elbowsLanded}/${stats.elbowsTotal}`, `${stats.opponentElbowsLanded}/${stats.opponentElbowsTotal}`],
                ['Γόνατα', `${stats.kneesLanded}/${stats.kneesTotal}`, `${stats.opponentKneesLanded}/${stats.opponentKneesTotal}`],
                ['Άμυνα', `${stats.defenseSuccessRate}%`, `${stats.totalStrikes > 0 ? Math.round((stats.opponentSuccessfulDefenses / stats.totalStrikes) * 100) : 0}%`],
                ['Χτυπήματα που δέχτηκε', stats.totalHitsReceived, stats.opponentTotalHitsReceived],
              ];
              return (
                <div className="border border-border">
                  <div className="grid grid-cols-3 text-xs font-semibold bg-muted">
                    <div className="p-1.5">Στατιστικό</div>
                    <div className="p-1.5 text-center text-competition-red">Κόκκινη</div>
                    <div className="p-1.5 text-center text-competition-blue">Μπλε</div>
                  </div>
                  {rows.map(([label, ours, theirs]) => (
                    <div key={label} className="grid grid-cols-3 text-xs border-t border-border">
                      <div className="p-1.5">{label}</div>
                      <div className="p-1.5 text-center font-medium">{ourBlue ? theirs : ours}</div>
                      <div className="p-1.5 text-center font-medium">{ourBlue ? ours : theirs}</div>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 text-xs border-t border-border">
                    <div className="p-1.5">Χρόνος επίθεσης / άμυνας</div>
                    <div className="p-1.5 text-center col-span-2">{stats.attackTimeFormatted} / {stats.defenseTimeFormatted}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

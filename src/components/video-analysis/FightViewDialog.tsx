import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, Clock, Trophy, FileText, Video, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

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

interface FightViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fight: Fight | null;
}

export const FightViewDialog: React.FC<FightViewDialogProps> = ({ isOpen, onClose, fight }) => {
  if (!fight) return null;

  const getResultLabel = (result: string | null) => {
    switch (result) {
      case 'win': return { label: 'Νίκη', color: 'bg-green-500' };
      case 'loss': return { label: 'Ήττα', color: 'bg-red-500' };
      case 'draw': return { label: 'Ισοπαλία', color: 'bg-yellow-500' };
      case 'no_contest': return { label: 'Άκυρος', color: 'bg-gray-500' };
      default: return { label: '-', color: 'bg-gray-300' };
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-md">
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
              <div className="flex items-center gap-3">
                <Video className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Video</p>
                  <a 
                    href={fight.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Προβολή Video
                  </a>
                </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

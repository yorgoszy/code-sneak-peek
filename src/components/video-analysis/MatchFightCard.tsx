import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

export interface MatchFightCardData {
  id: string;
  /** Whichever side is "ours" — controls which name gets the highlighted box. Use null to highlight BOTH equally (gallery mode). */
  ourCorner?: 'red' | 'blue' | null;
  /** Avatar of the highlighted (our) athlete */
  ourAvatarUrl?: string | null;
  redName: string;
  blueName: string;
  /** Date string (yyyy-mm-dd or ISO) */
  date?: string | null;
  location?: string | null;
  /** Optional small badge label e.g. age category, weight, fight type */
  metaLabels?: (string | null | undefined)[];
  /** Optional result badge node (shown on line 2) */
  resultBadge?: React.ReactNode;
}

interface MatchFightCardProps {
  data: MatchFightCardData;
  selected?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const MatchFightCard: React.FC<MatchFightCardProps> = ({
  data,
  selected = false,
  onClick,
  actions,
  className = '',
}) => {
  const galleryMode = data.ourCorner === null;
  const isBlueOurs = data.ourCorner === 'blue';
  const isRedOurs = data.ourCorner === 'red';
  const redHighlighted = galleryMode || isRedOurs;
  const blueHighlighted = galleryMode || isBlueOurs;
  const meta = (data.metaLabels || []).filter(Boolean) as string[];

  return (
    <Card
      className={`rounded-none transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      } ${selected ? 'ring-2 ring-[#00ffba] bg-[#00ffba]/5' : ''} ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-2 md:p-3">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {data.ourAvatarUrl ? (
              <img src={data.ourAvatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-gray-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Line 1: Names */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`truncate text-red-500 ${
                  isRedOurs
                    ? 'text-base font-bold border border-current px-1.5 py-0.5'
                    : 'text-xs font-medium'
                }`}
              >
                {data.redName || '—'}
              </span>
              <span className="text-xs text-gray-400">vs</span>
              <span
                className={`truncate text-blue-500 ${
                  isBlueOurs
                    ? 'text-base font-bold border border-current px-1.5 py-0.5'
                    : 'text-xs font-medium'
                }`}
              >
                {data.blueName || '—'}
              </span>
            </div>

            {/* Line 2: Result + meta */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
              {data.resultBadge}
              {data.date && (
                <div className="flex items-center gap-0.5">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(data.date), 'dd/MM/yy', { locale: el })}
                </div>
              )}
              {data.location && (
                <div className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{data.location}</span>
                </div>
              )}
              {meta.map((m, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="rounded-none text-[10px] px-1 py-0"
                >
                  {m}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          {actions && (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

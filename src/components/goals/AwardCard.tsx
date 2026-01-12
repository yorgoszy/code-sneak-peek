import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Award, 
  Trophy, 
  Medal, 
  Star,
  Flame,
  Target,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import type { UserAward } from '@/hooks/useUserGoals';

interface AwardCardProps {
  award: UserAward;
  onDelete?: (awardId: string) => void;
  onToggleDisplay?: (awardId: string, isDisplayed: boolean) => void;
  showControls?: boolean;
}

const awardIcons: Record<string, React.ElementType> = {
  Award: Award,
  Trophy: Trophy,
  Medal: Medal,
  Star: Star,
  Flame: Flame,
  Target: Target,
};

export const AwardCard: React.FC<AwardCardProps> = ({
  award,
  onDelete,
  onToggleDisplay,
  showControls = true,
}) => {
  const IconComponent = awardIcons[award.icon_name || 'Award'] || Award;
  const color = award.color || '#cb8954';

  return (
    <Card className="rounded-none hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-none flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <IconComponent 
              className="w-6 h-6" 
              style={{ color }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{award.title}</h3>
            {award.description && (
              <p className="text-xs text-muted-foreground truncate">{award.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(award.awarded_at), "dd MMM yyyy, HH:mm", { locale: el })}
            </p>
          </div>
          
          {showControls && (
            <div className="flex items-center gap-2">
              {onToggleDisplay && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Εμφάνιση</span>
                  <Switch
                    checked={award.is_displayed ?? true}
                    onCheckedChange={(checked) => onToggleDisplay(award.id, checked)}
                    className="rounded-none"
                  />
                </div>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-none text-destructive"
                  onClick={() => onDelete(award.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

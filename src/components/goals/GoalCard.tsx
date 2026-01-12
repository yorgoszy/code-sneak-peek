import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Edit,
  Dumbbell,
  TrendingDown,
  TrendingUp,
  Calendar,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import type { UserGoal } from '@/hooks/useUserGoals';

interface GoalCardProps {
  goal: UserGoal;
  onEdit?: (goal: UserGoal) => void;
  onDelete?: (goalId: string) => void;
  onComplete?: (goalId: string) => void;
  onUpdateProgress?: (goalId: string, newValue: number) => void;
}

const goalTypeIcons: Record<string, React.ElementType> = {
  workout_count: Dumbbell,
  weight_loss: TrendingDown,
  strength_gain: TrendingUp,
  attendance: Calendar,
  custom: Target,
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  in_progress: { label: 'Σε εξέλιξη', variant: 'default' },
  completed: { label: 'Ολοκληρώθηκε', variant: 'secondary' },
  failed: { label: 'Απέτυχε', variant: 'destructive' },
  cancelled: { label: 'Ακυρώθηκε', variant: 'outline' },
};

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onComplete,
  onUpdateProgress,
}) => {
  const Icon = goalTypeIcons[goal.goal_type] || Target;
  const progress = goal.target_value && goal.current_value 
    ? Math.min((goal.current_value / goal.target_value) * 100, 100)
    : 0;
  const status = statusConfig[goal.status] || statusConfig.in_progress;

  return (
    <Card className="rounded-none hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-none bg-[#00ffba]/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[#00ffba]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{goal.title}</h3>
                <Badge variant={status.variant} className="rounded-none text-xs">
                  {status.label}
                </Badge>
              </div>
              {goal.description && (
                <p className="text-xs text-muted-foreground mb-2">{goal.description}</p>
              )}
              
              {goal.target_value && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {goal.current_value || 0} / {goal.target_value} {goal.unit || ''}
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 rounded-none" />
                </div>
              )}

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Έναρξη: {format(new Date(goal.start_date), 'dd MMM yyyy', { locale: el })}</span>
                {goal.target_date && (
                  <span>Λήξη: {format(new Date(goal.target_date), 'dd MMM yyyy', { locale: el })}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {goal.status === 'in_progress' && (
              <>
                {onUpdateProgress && goal.target_value && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    onClick={() => {
                      const newValue = (goal.current_value || 0) + 1;
                      onUpdateProgress(goal.id, newValue);
                    }}
                    title="Προσθήκη +1"
                  >
                    <Zap className="h-4 w-4 text-[#00ffba]" />
                  </Button>
                )}
                {onComplete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    onClick={() => onComplete(goal.id)}
                    title="Ολοκλήρωση"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </Button>
                )}
              </>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={() => onEdit(goal)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none text-destructive"
                onClick={() => onDelete(goal.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

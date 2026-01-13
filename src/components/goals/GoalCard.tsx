import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Target, 
  CheckCircle, 
  Trash2, 
  Edit,
  Dumbbell,
  TrendingDown,
  TrendingUp,
  Calendar,
  Zap,
  ArrowUp,
  Timer,
  Activity,
  Scale
} from 'lucide-react';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import type { UserGoal } from '@/hooks/useUserGoals';
import type { UserGoalWithUser } from '@/hooks/useAllActiveGoals';
import { useGoalProgress } from '@/hooks/useGoalProgress';

interface GoalCardProps {
  goal: UserGoal | UserGoalWithUser;
  coachId?: string;
  showUserInfo?: boolean;
  onEdit?: (goal: UserGoal | UserGoalWithUser) => void;
  onDelete?: (goalId: string) => void;
  onComplete?: (goalId: string) => void;
  onUpdateProgress?: (goalId: string, newValue: number) => void;
}

const goalTypeIcons: Record<string, React.ElementType> = {
  weight_loss: TrendingDown,
  strength_gain: Dumbbell,
  endurance_gain: Zap,
  jump_gain: ArrowUp,
  sprint_gain: Timer,
  functional_gain: Activity,
  body_composition: Scale,
  attendance: Calendar,
  custom: Target,
};

const goalTypeLabels: Record<string, string> = {
  weight_loss: 'Απώλεια Βάρους',
  strength_gain: 'Αύξηση Δύναμης',
  endurance_gain: 'Αύξηση Αντοχής',
  jump_gain: 'Αύξηση Άλματος',
  sprint_gain: 'Αύξηση Sprint',
  functional_gain: 'Λειτουργικότητα',
  body_composition: 'Σύσταση Σώματος',
  attendance: 'Παρουσίες',
  custom: 'Προσαρμοσμένο',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  in_progress: { label: 'Σε εξέλιξη', variant: 'default' },
  completed: { label: 'Ολοκληρώθηκε', variant: 'secondary' },
  failed: { label: 'Απέτυχε', variant: 'destructive' },
  cancelled: { label: 'Ακυρώθηκε', variant: 'outline' },
};

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  coachId,
  showUserInfo = false,
  onEdit,
  onDelete,
  onComplete,
  onUpdateProgress,
}) => {
  const Icon = goalTypeIcons[goal.goal_type] || Target;
  const status = statusConfig[goal.status] || statusConfig.in_progress;
  
  // Check if goal has user info
  const goalWithUser = goal as UserGoalWithUser;
  const hasUserInfo = showUserInfo && 'user_name' in goal;
  
  const { progress, startTest, currentTest, isLoading } = useGoalProgress(
    goal.user_id,
    goal.goal_type,
    goal.start_date,
    goal.target_date,
    (goal as any).metadata,
    coachId
  );

  // Calculate progress percentage
  let progressPercent = 0;
  let displayValue = '';

  if (goal.goal_type === 'attendance' || goal.goal_type === 'custom') {
    // Manual tracking
    if (goal.target_value && goal.current_value) {
      progressPercent = Math.min((goal.current_value / goal.target_value) * 100, 100);
      displayValue = `${goal.current_value || 0} / ${goal.target_value} ${goal.unit || ''}`;
    }
  } else if (progress) {
    // Automatic tracking from tests
    if (progress.isPositive) {
      progressPercent = 100;
    }
    displayValue = progress.details || '';
  }

  return (
    <Card className="rounded-none hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        {/* User Info Header */}
        {hasUserInfo && (
          <div className="flex items-center gap-2 mb-3 pb-2 border-b">
            <Avatar className="h-8 w-8">
              <AvatarImage src={goalWithUser.user_avatar || undefined} />
              <AvatarFallback className="text-xs bg-[#00ffba]/20">
                {goalWithUser.user_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{goalWithUser.user_name}</p>
              <p className="text-xs text-muted-foreground truncate">{goalWithUser.user_email}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-[#00ffba]/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00ffba]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{goal.title}</h3>
                <Badge variant={status.variant} className="rounded-none text-[10px]">
                  {status.label}
                </Badge>
              </div>
              
              <div className="text-[10px] text-muted-foreground mb-1">
                {goalTypeLabels[goal.goal_type]}
              </div>

              {goal.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{goal.description}</p>
              )}
              
              {/* Progress Display */}
              {goal.status === 'in_progress' && (
                <div className="space-y-1.5">
                  {isLoading ? (
                    <div className="text-xs text-muted-foreground">Φόρτωση...</div>
                  ) : displayValue ? (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{displayValue}</span>
                        {progress?.isPositive !== undefined && (
                          <Badge 
                            variant="outline" 
                            className={`rounded-none text-[10px] ${progress.isPositive ? 'text-green-500 border-green-500' : 'text-red-500 border-red-500'}`}
                          >
                            {progress.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {progress.isPositive ? 'Βελτίωση' : 'Υποχώρηση'}
                          </Badge>
                        )}
                      </div>
                      {(goal.goal_type === 'attendance' || goal.goal_type === 'custom') && goal.target_value && (
                        <Progress value={progressPercent} className="h-1.5 rounded-none" />
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">
                      Δεν υπάρχουν δεδομένα τεστ
                    </div>
                  )}

                  {/* Test info */}
                  {startTest && currentTest && startTest.date !== currentTest.date && (
                    <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-2">
                      <span>Αρχικό: {format(new Date(startTest.date), 'dd/MM/yy', { locale: el })}</span>
                      <span>•</span>
                      <span>Τρέχον: {format(new Date(currentTest.date), 'dd/MM/yy', { locale: el })}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-[10px] sm:text-xs text-muted-foreground">
                <span>Έναρξη: {format(new Date(goal.start_date), 'dd MMM', { locale: el })}</span>
                {goal.target_date && (
                  <span>Λήξη: {format(new Date(goal.target_date), 'dd MMM', { locale: el })}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 self-end sm:self-start">
            {goal.status === 'in_progress' && (
              <>
                {onUpdateProgress && (goal.goal_type === 'attendance' || goal.goal_type === 'custom') && goal.target_value && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-none"
                    onClick={() => {
                      const newValue = (goal.current_value || 0) + 1;
                      onUpdateProgress(goal.id, newValue);
                    }}
                    title="Προσθήκη +1"
                  >
                    <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00ffba]" />
                  </Button>
                )}
                {onComplete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-none"
                    onClick={() => onComplete(goal.id)}
                    title="Ολοκλήρωση"
                  >
                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                  </Button>
                )}
              </>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-none"
                onClick={() => onEdit(goal)}
              >
                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-none text-destructive"
                onClick={() => onDelete(goal.id)}
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

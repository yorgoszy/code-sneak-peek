
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Ασκήσεις FMS - Shoulder Mobility και Straight Leg Raise έχουν L/R
const fmsExercises = [
  'Shoulder Mobility',
  'Straight Leg Raise',
  'Trunk Stability Push-Up', 
  'Rotary Stability',
  'Inline Lunge', 
  'Hurdle Step', 
  'Deep Squat'
];

const hasLeftRight = ['Shoulder Mobility', 'Straight Leg Raise'];

interface FMSTestProps {
  fmsScores: Record<string, number>;
  onFmsScoreChange: (scores: Record<string, number>) => void;
}

export const FMSTest = ({ fmsScores, onFmsScoreChange }: FMSTestProps) => {
  const handleFmsClick = (exercise: string) => {
    const currentScore = fmsScores[exercise] || 0;
    const nextScore = currentScore === 3 ? 0 : currentScore + 1;
    onFmsScoreChange({ ...fmsScores, [exercise]: nextScore });
  };

  const getFmsTotal = () => {
    let total = 0;
    fmsExercises.forEach(exercise => {
      if (hasLeftRight.includes(exercise)) {
        total += (fmsScores[`${exercise} L`] || 0);
        total += (fmsScores[`${exercise} R`] || 0);
      } else {
        total += (fmsScores[exercise] || 0);
      }
    });
    return total;
  };

  const fmsTotal = getFmsTotal();

  const renderScoreButtons = (exerciseKey: string) => (
    <div className="flex gap-0.5">
      {[0, 1, 2, 3].map((score) => (
        <div
          key={score}
          onClick={(e) => {
            e.stopPropagation();
            handleFmsClick(exerciseKey);
          }}
          className={cn(
            "w-5 h-5 border flex items-center justify-center text-[10px] font-bold cursor-pointer",
            fmsScores[exerciseKey] === score
              ? score === 0 
                ? "bg-red-500 text-white" 
                : "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          )}
        >
          {score}
        </div>
      ))}
    </div>
  );

  return (
    <Card className="rounded-none">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="flex items-center justify-between text-xs">
          FMS 
          <span className={cn(
            "text-xs font-bold px-2 py-0.5",
            fmsTotal < 14 ? "bg-red-500 text-white" : "bg-green-500 text-white"
          )}>
            Σκορ: {fmsTotal}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="grid grid-cols-7 gap-1.5">
          {fmsExercises.map((exercise) => {
            if (hasLeftRight.includes(exercise)) {
              // Special case: exercises με L/R στο ίδιο container
              return (
                <div
                  key={exercise}
                  className="p-1.5 border text-center"
                >
                  <div className="font-medium text-[10px] leading-tight mb-1">{exercise}</div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="text-[10px] font-bold w-3">L</span>
                      {renderScoreButtons(`${exercise} L`)}
                    </div>
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="text-[10px] font-bold w-3">R</span>
                      {renderScoreButtons(`${exercise} R`)}
                    </div>
                  </div>
                </div>
              );
            }
            
            // Regular exercises
            return (
              <div
                key={exercise}
                onClick={() => handleFmsClick(exercise)}
                className="p-1.5 border cursor-pointer text-center transition-colors hover:bg-gray-50"
              >
                <div className="font-medium text-[10px] leading-tight mb-1">{exercise}</div>
                <div className="flex justify-center gap-0.5">
                  {[0, 1, 2, 3].map((score) => (
                    <div
                      key={score}
                      className={cn(
                        "w-5 h-5 border flex items-center justify-center text-[10px] font-bold",
                        fmsScores[exercise] === score
                          ? score === 0 
                            ? "bg-red-500 text-white" 
                            : "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {score}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

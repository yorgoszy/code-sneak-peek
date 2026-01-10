
import { cn } from "@/lib/utils";

// FMS exercises organized by rows
const fmsRows = [
  ['Shoulder Mobility', 'Straight Leg Raise'],
  ['Trunk Stability Push-Up', 'Rotary Stability'],
  ['Inline Lunge', 'Hurdle Step', 'Deep Squat']
];

const allFmsExercises = fmsRows.flat();
const hasLeftRight = ['Shoulder Mobility', 'Straight Leg Raise', 'Rotary Stability', 'Inline Lunge', 'Hurdle Step'];

interface FMSTestProps {
  fmsScores: Record<string, number>;
  onFmsScoreChange: (scores: Record<string, number>) => void;
}

export const FMSTest = ({ fmsScores, onFmsScoreChange }: FMSTestProps) => {
  const handleFmsClick = (exercise: string) => {
    const currentScore = fmsScores[exercise];
    let nextScore: number | undefined;
    
    if (currentScore === undefined) {
      nextScore = 0;
    } else if (currentScore === 3) {
      nextScore = undefined;
    } else {
      nextScore = currentScore + 1;
    }
    
    const newScores = { ...fmsScores };
    if (nextScore === undefined) {
      delete newScores[exercise];
    } else {
      newScores[exercise] = nextScore;
    }
    onFmsScoreChange(newScores);
  };

  const getFmsTotal = () => {
    let total = 0;
    allFmsExercises.forEach(exercise => {
      if (hasLeftRight.includes(exercise)) {
        const leftScore = fmsScores[`${exercise} L`];
        const rightScore = fmsScores[`${exercise} R`];
        
        if (leftScore !== undefined && rightScore !== undefined) {
          total += Math.min(leftScore, rightScore);
        } else if (leftScore !== undefined) {
          total += leftScore;
        } else if (rightScore !== undefined) {
          total += rightScore;
        }
      } else {
        total += (fmsScores[exercise] || 0);
      }
    });
    return total;
  };

  const fmsTotal = getFmsTotal();

  const renderScoreButtons = (exerciseKey: string) => (
    <div className="flex gap-0.5 md:gap-1">
      {[0, 1, 2, 3].map((score) => (
        <div
          key={score}
          onClick={(e) => {
            e.stopPropagation();
            handleFmsClick(exerciseKey);
          }}
          className={cn(
            "w-5 h-5 md:w-7 md:h-7 border flex items-center justify-center text-[10px] md:text-xs font-bold cursor-pointer",
            fmsScores[exerciseKey] === score
              ? score === 0 
                ? "bg-red-500 text-white" 
                : "bg-black text-white"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          )}
        >
          {score}
        </div>
      ))}
    </div>
  );

  const renderExercise = (exercise: string) => {
    if (hasLeftRight.includes(exercise)) {
      return (
        <div key={exercise} className="p-1.5 md:p-3 border border-gray-300 text-center">
          <div className="font-medium text-[10px] md:text-sm leading-tight mb-1 md:mb-2">{exercise}</div>
          <div className="space-y-0.5 md:space-y-1">
            <div className="flex items-center justify-center gap-0.5 md:gap-1">
              <span className="text-[10px] md:text-sm font-bold w-3 md:w-4">L</span>
              {renderScoreButtons(`${exercise} L`)}
            </div>
            <div className="flex items-center justify-center gap-0.5 md:gap-1">
              <span className="text-[10px] md:text-sm font-bold w-3 md:w-4">R</span>
              {renderScoreButtons(`${exercise} R`)}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div
        key={exercise}
        onClick={() => handleFmsClick(exercise)}
        className="p-1.5 md:p-3 border border-gray-300 cursor-pointer text-center transition-colors hover:bg-gray-50"
      >
        <div className="font-medium text-[10px] md:text-sm leading-tight mb-1 md:mb-2">{exercise}</div>
        <div className="flex justify-center gap-0.5 md:gap-1">
          {[0, 1, 2, 3].map((score) => (
            <div
              key={score}
              className={cn(
                "w-5 h-5 md:w-7 md:h-7 border flex items-center justify-center text-[10px] md:text-xs font-bold",
                fmsScores[exercise] === score
                  ? score === 0 
                    ? "bg-red-500 text-white" 
                    : "bg-black text-white"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {score}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h3 className="font-semibold text-sm md:text-base">FMS</h3>
        <span className={cn(
          "text-xs md:text-sm font-bold px-2 md:px-3 py-0.5 md:py-1",
          fmsTotal < 14 ? "bg-red-500 text-white" : "bg-green-500 text-white"
        )}>
          Σκορ: {fmsTotal}
        </span>
      </div>
      <div className="space-y-1 md:space-y-2">
        {fmsRows.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className={cn(
              "grid gap-1 md:gap-2",
              rowIndex === 2 ? "grid-cols-3" : "grid-cols-2"
            )}
          >
            {row.map(exercise => renderExercise(exercise))}
          </div>
        ))}
      </div>
    </div>
  );
};

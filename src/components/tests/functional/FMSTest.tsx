
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fmsExercises = [
  // Πρώτη σειρά
  ['Shoulder Mobility', 'Active Straight Leg Raise'],
  // Δεύτερη σειρά  
  ['Trunk Stability Push-Up', 'Rotary Stability'],
  // Τρίτη σειρά
  ['Inline Lunge', 'Hurdle Step', 'Deep Squat']
];

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
    return fmsExercises.flat().reduce((total, exercise) => total + (fmsScores[exercise] || 0), 0);
  };

  const fmsTotal = getFmsTotal();

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
          {fmsExercises.flat().map((exercise) => (
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

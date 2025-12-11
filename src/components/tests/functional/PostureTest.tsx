
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const postureOptions = ['Κύφωση', 'Λόρδωση', 'Πρηνισμός', 'Σκολίωση'];

interface PostureTestProps {
  selectedPosture: string[];
  onPostureChange: (posture: string[]) => void;
}

export const PostureTest = ({ selectedPosture, onPostureChange }: PostureTestProps) => {
  const toggleSelection = (item: string) => {
    if (selectedPosture.includes(item)) {
      onPostureChange(selectedPosture.filter(i => i !== item));
    } else {
      onPostureChange([...selectedPosture, item]);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-xs">Στάση Σώματος</CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="space-y-1">
          {postureOptions.map((option) => (
            <div
              key={option}
              onClick={() => toggleSelection(option)}
              className={cn(
                "py-0.5 px-1 border cursor-pointer text-center text-[10px] transition-colors",
                selectedPosture.includes(option)
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              )}
            >
              {option}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

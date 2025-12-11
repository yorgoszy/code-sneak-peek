
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
    <div>
      <h3 className="font-semibold text-sm mb-2">Στάση Σώματος</h3>
      <table className="w-full border-collapse text-xs">
        <tbody>
          {postureOptions.map((option) => (
            <tr
              key={option}
              onClick={() => toggleSelection(option)}
              className={cn(
                "cursor-pointer transition-colors",
                selectedPosture.includes(option)
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-50"
              )}
            >
              <td className="border border-gray-300 py-1.5 px-3 text-center">
                {option}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

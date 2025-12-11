
import { cn } from "@/lib/utils";

const singleLegSquatOptions = [
  'ΑΝΗΨΩΣΗ ΙΣΧΙΟΥ',
  'ΠΤΩΣΗ ΙΣΧΙΟΥ',
  'ΕΣΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ',
  'ΕΞΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ'
];

interface SingleLegSquatTestProps {
  selectedSingleLegIssues: string[];
  onSingleLegChange: (issues: string[]) => void;
}

export const SingleLegSquatTest = ({ selectedSingleLegIssues, onSingleLegChange }: SingleLegSquatTestProps) => {
  const toggleSingleLegSelection = (item: string, side: 'ΑΡΙΣΤΕΡΑ' | 'ΔΕΞΙΑ') => {
    const fullItem = `${item} ${side}`;
    if (selectedSingleLegIssues.includes(fullItem)) {
      onSingleLegChange(selectedSingleLegIssues.filter(i => i !== fullItem));
    } else {
      onSingleLegChange([...selectedSingleLegIssues, fullItem]);
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-sm mb-2">Μονοποδικά Καθήματα</h3>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-gray-300 py-1.5 px-3 text-left font-semibold">Επιλογή</th>
            <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Α</th>
            <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Δ</th>
          </tr>
        </thead>
        <tbody>
          {singleLegSquatOptions.map((option) => (
            <tr key={option}>
              <td className="border border-gray-300 py-1.5 px-3">{option}</td>
              <td 
                className={cn(
                  "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                  selectedSingleLegIssues.includes(`${option} ΑΡΙΣΤΕΡΑ`)
                    ? "bg-black text-white"
                    : "hover:bg-gray-50"
                )}
                onClick={() => toggleSingleLegSelection(option, 'ΑΡΙΣΤΕΡΑ')}
              >
                ✓
              </td>
              <td 
                className={cn(
                  "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                  selectedSingleLegIssues.includes(`${option} ΔΕΞΙΑ`)
                    ? "bg-black text-white"
                    : "hover:bg-gray-50"
                )}
                onClick={() => toggleSingleLegSelection(option, 'ΔΕΞΙΑ')}
              >
                ✓
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

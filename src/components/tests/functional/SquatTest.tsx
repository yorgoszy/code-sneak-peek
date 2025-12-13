
import { cn } from "@/lib/utils";

// Επάνω τμήμα - χωρίς Α/Δ
const squatTopOptions = [
  'ΕΜΠΡΟΣ ΚΛΙΣΗ ΤΟΥ ΚΟΡΜΟΥ',
  'ΥΠΕΡΕΚΤΑΣΗ ΣΤΗΝ Σ.Σ.',
  'ΚΥΦΩΤΙΚΗ ΘΕΣΗ ΣΤΗ Σ.Σ.',
  'ΠΤΩΣΗ ΧΕΡΙΩΝ'
];

// Κάτω τμήμα - με Α/Δ
const squatBottomOptions = [
  'ΠΡΗΝΙΣΜΟΣ ΠΕΛΜΑΤΩΝ',
  'ΕΣΩ ΣΤΡΟΦΗ ΓΟΝΑΤΩΝ',
  'ΕΞΩ ΣΤΡΟΦΗ ΓΟΝΑΤΩΝ',
  'ΑΝΥΨΩΣΗ ΦΤΕΡΝΩΝ',
  'ΜΕΤΑΦΟΡΑ ΒΑΡΟΥΣ'
];

interface SquatTestProps {
  selectedSquatIssues: string[];
  onSquatChange: (issues: string[]) => void;
}

export const SquatTest = ({ selectedSquatIssues, onSquatChange }: SquatTestProps) => {
  const toggleSelection = (item: string) => {
    if (selectedSquatIssues.includes(item)) {
      onSquatChange(selectedSquatIssues.filter(i => i !== item));
    } else {
      onSquatChange([...selectedSquatIssues, item]);
    }
  };

  const toggleSideSelection = (item: string, side: 'Α' | 'Δ') => {
    const fullItem = `${item} ${side}`;
    if (selectedSquatIssues.includes(fullItem)) {
      onSquatChange(selectedSquatIssues.filter(i => i !== fullItem));
    } else {
      onSquatChange([...selectedSquatIssues, fullItem]);
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-sm mb-2">Καθήματα</h3>
      <table className="w-full border-collapse text-xs">
        <tbody>
          {squatTopOptions.map((option) => (
            <tr
              key={option}
              onClick={() => toggleSelection(option)}
              className={cn(
                "cursor-pointer transition-colors",
                selectedSquatIssues.includes(option)
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-50"
              )}
            >
              <td className="border border-gray-300 py-1.5 px-3" colSpan={3}>
                {option}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="w-full border-collapse text-xs mt-2">
        <thead>
          <tr>
            <th className="border border-gray-300 py-1.5 px-3 text-left font-semibold">Επιλογή</th>
            <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Α</th>
            <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Δ</th>
          </tr>
        </thead>
        <tbody>
          {squatBottomOptions.map((option) => (
            <tr key={option}>
              <td className="border border-gray-300 py-1.5 px-3">{option}</td>
              <td 
                className={cn(
                  "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                  selectedSquatIssues.includes(`${option} Α`)
                    ? "bg-black text-white"
                    : "hover:bg-gray-50"
                )}
                onClick={() => toggleSideSelection(option, 'Α')}
              >
                ✓
              </td>
              <td 
                className={cn(
                  "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                  selectedSquatIssues.includes(`${option} Δ`)
                    ? "bg-black text-white"
                    : "hover:bg-gray-50"
                )}
                onClick={() => toggleSideSelection(option, 'Δ')}
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

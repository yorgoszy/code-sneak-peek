
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const squatOptions = [
  'ΠΡΗΝΙΣΜΟΣ ΠΕΛΜΑΤΩΝ',
  'ΕΣΩ ΣΤΡΟΦΗ ΓΩΝΑΤΩΝ',
  'ΕΞΩ ΣΤΡΟΦΗ ΓΩΝΑΤΩΝ',
  'ΑΝΥΨΩΣΗ ΦΤΕΡΝΩΝ',
  'ΜΕΤΑΦΟΡΑ ΒΑΡΟΥΣ',
  'ΕΜΠΡΟΣ ΚΛΙΣΗ ΤΟΥ ΚΟΡΜΟΥ',
  'ΥΠΕΡΕΚΤΑΣΗ ΣΤΗΝ Σ.Σ.',
  'ΚΥΦΩΤΙΚΗ ΘΕΣΗ ΣΤΗ Σ.Σ.',
  'ΠΤΩΣΗ ΧΕΡΙΩΝ'
];

interface SquatTestProps {
  selectedSquatIssues: string[];
  onSquatChange: (issues: string[]) => void;
}

export const SquatTest = ({ selectedSquatIssues, onSquatChange }: SquatTestProps) => {
  const toggleSquatSelection = (item: string, side: 'ΑΡΙΣΤΕΡΑ' | 'ΔΕΞΙΑ') => {
    const fullItem = `${item} ${side}`;
    if (selectedSquatIssues.includes(fullItem)) {
      onSquatChange(selectedSquatIssues.filter(i => i !== fullItem));
    } else {
      onSquatChange([...selectedSquatIssues, fullItem]);
    }
  };

  const toggleSelection = (item: string) => {
    if (selectedSquatIssues.includes(item)) {
      onSquatChange(selectedSquatIssues.filter(i => i !== item));
    } else {
      onSquatChange([...selectedSquatIssues, item]);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Καθήματα</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {/* Επιλογές χωρίς αριστερά/δεξιά */}
          {squatOptions.slice(5).map((option) => (
            <div
              key={option}
              onClick={() => toggleSelection(option)}
              className={cn(
                "p-1 border cursor-pointer text-center text-xs transition-colors",
                selectedSquatIssues.includes(option)
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              )}
            >
              {option}
            </div>
          ))}
          
          {/* Πίνακας για αριστερά/δεξιά */}
          <div className="text-xs">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-1 text-left text-xs">Επιλογή</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Α</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Δ</th>
                </tr>
              </thead>
              <tbody>
                {squatOptions.slice(0, 5).map((option) => (
                  <tr key={option}>
                    <td className="border border-gray-300 p-1 text-xs">{option}</td>
                    <td className="border border-gray-300 p-0 text-center">
                      <div
                        onClick={() => toggleSquatSelection(option, 'ΑΡΙΣΤΕΡΑ')}
                        className={cn(
                          "w-8 h-6 border cursor-pointer flex items-center justify-center mx-auto text-xs",
                          selectedSquatIssues.includes(`${option} ΑΡΙΣΤΕΡΑ`)
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        ✓
                      </div>
                    </td>
                    <td className="border border-gray-300 p-0 text-center">
                      <div
                        onClick={() => toggleSquatSelection(option, 'ΔΕΞΙΑ')}
                        className={cn(
                          "w-8 h-6 border cursor-pointer flex items-center justify-center mx-auto text-xs",
                          selectedSquatIssues.includes(`${option} ΔΕΞΙΑ`)
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        ✓
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

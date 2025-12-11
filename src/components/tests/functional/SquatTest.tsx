
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
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-xs">Καθήματα</CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="space-y-1">
          {squatOptions.slice(5).map((option) => (
            <div
              key={option}
              onClick={() => toggleSelection(option)}
              className={cn(
                "py-1 px-2 border cursor-pointer text-center text-[11px] transition-colors",
                selectedSquatIssues.includes(option)
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              )}
            >
              {option}
            </div>
          ))}
          
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="border border-gray-300 p-1 text-left">Επιλογή</th>
                <th className="border border-gray-300 p-1 text-center w-8">Α</th>
                <th className="border border-gray-300 p-1 text-center w-8">Δ</th>
              </tr>
            </thead>
            <tbody>
              {squatOptions.slice(0, 5).map((option) => (
                <tr key={option}>
                  <td className="border border-gray-300 p-1">{option}</td>
                  <td className="border border-gray-300 p-0 text-center">
                    <div
                      onClick={() => toggleSquatSelection(option, 'ΑΡΙΣΤΕΡΑ')}
                      className={cn(
                        "w-6 h-5 cursor-pointer flex items-center justify-center mx-auto",
                        selectedSquatIssues.includes(`${option} ΑΡΙΣΤΕΡΑ`)
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-50"
                      )}
                    >
                      ✓
                    </div>
                  </td>
                  <td className="border border-gray-300 p-0 text-center">
                    <div
                      onClick={() => toggleSquatSelection(option, 'ΔΕΞΙΑ')}
                      className={cn(
                        "w-6 h-5 cursor-pointer flex items-center justify-center mx-auto",
                        selectedSquatIssues.includes(`${option} ΔΕΞΙΑ`)
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-50"
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
      </CardContent>
    </Card>
  );
};

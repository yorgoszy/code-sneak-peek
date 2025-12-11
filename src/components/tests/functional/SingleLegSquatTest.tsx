
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="rounded-none">
      <CardHeader className="p-1.5 pb-1">
        <CardTitle className="text-[10px]">Μονοποδικά Καθήματα</CardTitle>
      </CardHeader>
      <CardContent className="p-1.5 pt-0">
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr>
              <th className="border border-gray-300 p-0.5 text-left">Επιλογή</th>
              <th className="border border-gray-300 p-0.5 text-center w-6">Α</th>
              <th className="border border-gray-300 p-0.5 text-center w-6">Δ</th>
            </tr>
          </thead>
          <tbody>
            {singleLegSquatOptions.map((option) => (
              <tr key={option}>
                <td className="border border-gray-300 p-0.5">{option}</td>
                <td className="border border-gray-300 p-0 text-center">
                  <div
                    onClick={() => toggleSingleLegSelection(option, 'ΑΡΙΣΤΕΡΑ')}
                    className={cn(
                      "w-5 h-4 cursor-pointer flex items-center justify-center mx-auto",
                      selectedSingleLegIssues.includes(`${option} ΑΡΙΣΤΕΡΑ`)
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-50"
                    )}
                  >
                    ✓
                  </div>
                </td>
                <td className="border border-gray-300 p-0 text-center">
                  <div
                    onClick={() => toggleSingleLegSelection(option, 'ΔΕΞΙΑ')}
                    className={cn(
                      "w-5 h-4 cursor-pointer flex items-center justify-center mx-auto",
                      selectedSingleLegIssues.includes(`${option} ΔΕΞΙΑ`)
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
      </CardContent>
    </Card>
  );
};


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
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-xs">Μονοποδικά Καθήματα</CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="border border-gray-300 p-1 text-left">Επιλογή</th>
              <th className="border border-gray-300 p-1 text-center w-8">Α</th>
              <th className="border border-gray-300 p-1 text-center w-8">Δ</th>
            </tr>
          </thead>
          <tbody>
            {singleLegSquatOptions.map((option) => (
              <tr key={option}>
                <td className="border border-gray-300 p-1">{option}</td>
                <td className="border border-gray-300 p-0 text-center">
                  <div
                    onClick={() => toggleSingleLegSelection(option, 'ΑΡΙΣΤΕΡΑ')}
                    className={cn(
                      "w-6 h-5 cursor-pointer flex items-center justify-center mx-auto",
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
                      "w-6 h-5 cursor-pointer flex items-center justify-center mx-auto",
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

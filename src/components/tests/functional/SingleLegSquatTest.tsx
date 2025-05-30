
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Μονοποδικά Καθήματα</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
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
              {singleLegSquatOptions.map((option) => (
                <tr key={option}>
                  <td className="border border-gray-300 p-1 text-xs">{option}</td>
                  <td className="border border-gray-300 p-0 text-center">
                    <div
                      onClick={() => toggleSingleLegSelection(option, 'ΑΡΙΣΤΕΡΑ')}
                      className={cn(
                        "w-8 h-6 border cursor-pointer flex items-center justify-center mx-auto text-xs",
                        selectedSingleLegIssues.includes(`${option} ΑΡΙΣΤΕΡΑ`)
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      ✓
                    </div>
                  </td>
                  <td className="border border-gray-300 p-0 text-center">
                    <div
                      onClick={() => toggleSingleLegSelection(option, 'ΔΕΞΙΑ')}
                      className={cn(
                        "w-8 h-6 border cursor-pointer flex items-center justify-center mx-auto text-xs",
                        selectedSingleLegIssues.includes(`${option} ΔΕΞΙΑ`)
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
      </CardContent>
    </Card>
  );
};

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ExternalLink } from "lucide-react";

export default function InstallSubscriptionsWidget() {
  const handleInstallClick = () => {
    window.open('/subscriptions-widget', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-none">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-6 h-6 text-[#00ffba]" />
            <CardTitle>Widget Συνδρομών</CardTitle>
          </div>
          <CardDescription>
            Εγκατάσταση του widget διαχείρισης συνδρομών και MyData
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-gray-600">
            <p>Αυτό το widget σας επιτρέπει να:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Διαχειρίζεστε τις συνδρομές</li>
              <li>Πρόσβαση στο MyData AADE</li>
              <li>Άμεση πρόσβαση στο E-timologio</li>
            </ul>
          </div>

          <div className="space-y-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-none border border-blue-200">
            <p className="font-semibold text-blue-900">Οδηγίες εγκατάστασης:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Πατήστε "Άνοιγμα Widget"</li>
              <li>Στο Chrome: Κάντε κλικ στο εικονίδιο εγκατάστασης (⊕) στη γραμμή διευθύνσεων</li>
              <li>Επιλέξτε "Εγκατάσταση"</li>
            </ol>
          </div>

          <Button 
            onClick={handleInstallClick}
            className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Άνοιγμα Widget Συνδρομών
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

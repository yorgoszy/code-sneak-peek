import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InstallDashboardWidget() {
  const navigate = useNavigate();

  const handleInstallClick = () => {
    window.open('/dashboard-widget', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 rounded-none">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Download className="h-16 w-16 mx-auto text-[#cb8954]" />
            <h1 className="text-3xl font-bold text-gray-900">Κατέβασε το Dashboard</h1>
            <p className="text-gray-600">
              Εγκατάστησε το Dashboard ως εφαρμογή στην οθόνη σου
            </p>
          </div>

          <div className="space-y-4 bg-gray-50 p-6 rounded-none">
            <h2 className="font-semibold text-gray-900">Οδηγίες Εγκατάστασης:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Πάτησε το κουμπί "Άνοιξε το Dashboard Widget"</li>
              <li>Στο κινητό σου:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li><strong>iPhone/iPad:</strong> Πάτησε το κουμπί Share (εικονίδιο κοινής χρήσης) και επέλεξε "Add to Home Screen"</li>
                  <li><strong>Android:</strong> Πάτησε το μενού του browser (3 τελείες) και επέλεξε "Add to Home Screen" ή "Install App"</li>
                </ul>
              </li>
              <li>Η εφαρμογή θα εμφανιστεί στην αρχική σου οθόνη</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleInstallClick}
              className="w-full bg-[#cb8954] hover:bg-[#b5794a] text-white rounded-none py-6 text-lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Άνοιξε το Dashboard Widget
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full rounded-none"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Επιστροφή
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

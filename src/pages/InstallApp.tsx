import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Check, Monitor, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Έλεγχος αν είναι mobile
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full rounded-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-[#cb8954]/10 flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-[#cb8954]" />
          </div>
          <CardTitle className="text-2xl">Εγκατάσταση HYPERKIDS App</CardTitle>
          <CardDescription>
            Εγκατάστησε την εφαρμογή για γρήγορη πρόσβαση από το κινητό ή tablet σου
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isMobile && (
            <Alert className="rounded-none border-[#cb8954]/20 bg-[#cb8954]/5">
              <Monitor className="h-4 w-4 text-[#cb8954]" />
              <AlertDescription>
                <strong>Σημαντικό:</strong> Για να εγκαταστήσεις την εφαρμογή, πρέπει να ανοίξεις αυτή τη σελίδα από το κινητό ή tablet σου.
                Στείλε τον σύνδεσμο στο κινητό σου: <strong>{window.location.origin}/install</strong>
              </AlertDescription>
            </Alert>
          )}

          {isInstalled ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[#00ffba]/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-[#00ffba]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Η εφαρμογή είναι εγκατεστημένη!</h3>
              <p className="text-sm text-muted-foreground">
                Μπορείς να τη βρεις στην αρχική οθόνη της συσκευής σου
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Πλεονεκτήματα:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00ffba]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#00ffba]">1</span>
                    </div>
                    <p className="text-sm">Πρόσβαση χωρίς σύνδεση στο διαδίκτυο</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00ffba]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#00ffba]">2</span>
                    </div>
                    <p className="text-sm">Γρήγορη φόρτωση και καλύτερη απόδοση</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00ffba]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#00ffba]">3</span>
                    </div>
                    <p className="text-sm">Εύκολη πρόσβαση από την αρχική οθόνη - σαν κανονική εφαρμογή!</p>
                  </div>
                </div>
              </div>

              {isInstallable && isMobile ? (
                <Button
                  onClick={handleInstall}
                  className="w-full bg-[#cb8954] hover:bg-[#b5794a] text-white rounded-none"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Εγκατάσταση Τώρα
                </Button>
              ) : isMobile ? (
                <div className="space-y-4 pt-4 border-t">
                  <Alert className="rounded-none">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Βήμα 1:</strong> Ανάλογα με τη συσκευή σου, ακολούθησε τις παρακάτω οδηγίες
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3 text-sm">
                    <div className="bg-gray-50 p-4 rounded-none">
                      <p className="font-semibold mb-2 flex items-center gap-2">
                        <span>📱</span> iPhone / iPad:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Πάτησε το κουμπί "Κοινή χρήση" <span className="inline-block">↗️</span> στο κάτω μέρος της οθόνης</li>
                        <li>Κύλησε κάτω και επίλεξε "Προσθήκη στην Αφετηρία"</li>
                        <li>Πάτησε "Προσθήκη" για επιβεβαίωση</li>
                      </ol>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-none">
                      <p className="font-semibold mb-2 flex items-center gap-2">
                        <span>🤖</span> Android:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Πάτησε το μενού του browser (⋮) πάνω δεξιά</li>
                        <li>Επίλεξε "Εγκατάσταση εφαρμογής" ή "Προσθήκη στην αρχική οθόνη"</li>
                        <li>Πάτησε "Εγκατάσταση" για επιβεβαίωση</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

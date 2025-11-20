import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Check } from 'lucide-react';

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
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
      <Card className="max-w-md w-full rounded-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-[#00ffba]/10 flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-[#00ffba]" />
          </div>
          <CardTitle className="text-2xl">Εγκατάσταση HYPERKIDS</CardTitle>
          <CardDescription>
            Εγκατάστησε την εφαρμογή στη συσκευή σου για γρήγορη πρόσβαση
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <p className="text-sm">Εύκολη πρόσβαση από την αρχική οθόνη</p>
                </div>
              </div>

              {isInstallable ? (
                <Button
                  onClick={handleInstall}
                  className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Εγκατάσταση
                </Button>
              ) : (
                <div className="space-y-3 pt-4 border-t">
                  <p className="text-sm font-semibold">Οδηγίες εγκατάστασης:</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>iPhone/iPad:</strong> Πάτησε το κουμπί "Κοινή χρήση" 
                    <span className="inline-block mx-1">↗️</span> και επίλεξε "Προσθήκη στην Αφετηρία"</p>
                    <p><strong>Android:</strong> Άνοιξε το μενού του browser (⋮) και επίλεξε 
                    "Εγκατάσταση εφαρμογής" ή "Προσθήκη στην αρχική οθόνη"</p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

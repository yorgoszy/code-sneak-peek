import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Check, Monitor, ArrowLeft, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function InstallDashboardWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const checkIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const checkAndroid = /Android/i.test(userAgent);
    
    setIsMobile(checkMobile);
    setIsIOS(checkIOS);
    setIsAndroid(checkAndroid);

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

  const handleOpenWidget = () => {
    if (user) {
      window.open(`/dashboard-widget/${user.id}`, '_blank');
    }
  };

  const handleBack = () => {
    // Go back to user profile
    if (user?.id) {
      navigate(`/user/${user.id}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full rounded-none relative">
        <Button
          onClick={handleBack}
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 rounded-none"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <CardHeader className="text-center pt-12">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-[#00ffba]/10 flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-[#00ffba]" />
          </div>
          <CardTitle className="text-2xl">Dashboard App</CardTitle>
          <CardDescription>
            Εγκατάστησε το Dashboard για γρήγορη πρόσβαση στο προφίλ σου
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isMobile && (
            <Alert className="rounded-none border-[#cb8954]/20 bg-[#cb8954]/5">
              <Monitor className="h-4 w-4 text-[#cb8954]" />
              <AlertDescription>
                <strong>Σημαντικό:</strong> Για να εγκαταστήσεις την εφαρμογή, πρέπει να ανοίξεις αυτή τη σελίδα από το κινητό ή tablet σου.
                Στείλε τον σύνδεσμο: <strong>{window.location.origin}/install-dashboard</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-[#00ffba]/5 border border-[#00ffba]/20 p-4 rounded-none">
            <h3 className="font-semibold mb-2 text-sm">Πώς λειτουργεί:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Άνοιξε το Dashboard σε νέο tab</li>
              <li>Πρόσθεσέ το στην αρχική οθόνη</li>
              <li>Θα έχεις άμεση πρόσβαση στο προφίλ σου!</li>
            </ol>
          </div>

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
              <Button
                onClick={handleOpenWidget}
                className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                size="lg"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Άνοιγμα Dashboard
              </Button>

              {isMobile && (
                <div className="space-y-4">
                  {isAndroid && (
                    <>
                      {isInstallable ? (
                        <Button
                          onClick={handleInstall}
                          variant="outline"
                          className="w-full rounded-none"
                          size="lg"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Εγκατάσταση (Android)
                        </Button>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-none">
                          <p className="font-semibold mb-2 flex items-center gap-2">
                            <span>🤖</span> Οδηγίες για Android:
                          </p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Άνοιξε το Dashboard πατώντας το κουμπί παραπάνω</li>
                            <li>Πάτησε το μενού του browser (⋮) πάνω δεξιά</li>
                            <li>Επίλεξε "Εγκατάσταση εφαρμογής" ή "Προσθήκη στην αρχική οθόνη"</li>
                            <li>Πάτησε "Εγκατάσταση" για επιβεβαίωση</li>
                          </ol>
                        </div>
                      )}
                    </>
                  )}
                  
                  {isIOS && (
                    <div className="bg-gray-50 p-4 rounded-none">
                      <p className="font-semibold mb-2 flex items-center gap-2">
                        <span>📱</span> Οδηγίες για iPhone / iPad:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Άνοιξε το Dashboard πατώντας το κουμπί παραπάνω</li>
                        <li>Πάτησε το κουμπί "Κοινή χρήση" <span className="inline-block">↗️</span> στο κάτω μέρος</li>
                        <li>Κύλησε κάτω και επίλεξε "Προσθήκη στην Αφετηρία"</li>
                        <li>Πάτησε "Προσθήκη" για επιβεβαίωση</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

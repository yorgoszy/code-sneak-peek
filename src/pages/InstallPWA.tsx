import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle } from 'lucide-react';
import { useIsPWA } from '@/hooks/useIsPWA';

export default function InstallPWA() {
  const navigate = useNavigate();
  const isPWA = useIsPWA();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
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
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  if (isPWA) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center rounded-none">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-[#00ffba]" />
          <h1 className="text-2xl font-bold mb-2">Ήδη Εγκατεστημένο!</h1>
          <p className="text-gray-600 mb-6">
            Η εφαρμογή HYPERKIDS είναι ήδη εγκατεστημένη στη συσκευή σου.
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            Μετάβαση στο Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 rounded-none">
        <div className="text-center mb-6">
          <Smartphone className="w-16 h-16 mx-auto mb-4 text-[#00ffba]" />
          <h1 className="text-2xl font-bold mb-2">Εγκατάσταση HYPERKIDS</h1>
          <p className="text-gray-600">
            Εγκατέστησε την εφαρμογή στη συσκευή σου για καλύτερη εμπειρία!
          </p>
        </div>

        {isInstallable ? (
          <Button
            onClick={handleInstall}
            className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none mb-4"
          >
            <Download className="w-4 h-4 mr-2" />
            Εγκατάσταση Τώρα
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
              <h3 className="font-semibold mb-2">📱 iOS (iPhone/iPad)</h3>
              <ol className="text-sm space-y-1 text-gray-700">
                <li>1. Άνοιξε το Safari</li>
                <li>2. Πάτησε το κουμπί "Share" (μοιράζω)</li>
                <li>3. Επίλεξε "Add to Home Screen"</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-none p-4">
              <h3 className="font-semibold mb-2">📱 Android</h3>
              <ol className="text-sm space-y-1 text-gray-700">
                <li>1. Άνοιξε το Chrome</li>
                <li>2. Πάτησε το menu (3 τελείες)</li>
                <li>3. Επίλεξε "Install app" ή "Add to Home Screen"</li>
              </ol>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-2">✨ Οφέλη της εγκατάστασης:</h3>
          <ul className="text-sm space-y-2 text-gray-700">
            <li>✓ Πρόσβαση με ένα άγγιγμα από την αρχική οθόνη</li>
            <li>✓ Πλήρης οθόνη χωρίς browser UI</li>
            <li>✓ Offline λειτουργία</li>
            <li>✓ Ταχύτερη φόρτωση</li>
          </ul>
        </div>

        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="w-full mt-6 rounded-none"
        >
          Επιστροφή στην Αρχική
        </Button>
      </Card>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle } from 'lucide-react';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useTranslation } from 'react-i18next';

export default function InstallPWA() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
          <h1 className="text-2xl font-bold mb-2">{t('install.alreadyInstalled')}</h1>
          <p className="text-gray-600 mb-6">
            {t('install.alreadyInstalledDesc')}
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            {t('install.goToDashboard')}
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
          <h1 className="text-2xl font-bold mb-2">{t('install.title')}</h1>
          <p className="text-gray-600">
            {t('install.subtitle')}
          </p>
        </div>

        {isInstallable ? (
          <Button
            onClick={handleInstall}
            className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none mb-4"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('install.installNow')}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
              <h3 className="font-semibold mb-2">📱 {t('install.ios')}</h3>
              <ol className="text-sm space-y-1 text-gray-700">
                <li>{t('install.iosStep1')}</li>
                <li>{t('install.iosStep2')}</li>
                <li>{t('install.iosStep3')}</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-none p-4">
              <h3 className="font-semibold mb-2">📱 {t('install.android')}</h3>
              <ol className="text-sm space-y-1 text-gray-700">
                <li>{t('install.androidStep1')}</li>
                <li>{t('install.androidStep2')}</li>
                <li>{t('install.androidStep3')}</li>
              </ol>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-2">✨ {t('install.benefits')}</h3>
          <ul className="text-sm space-y-2 text-gray-700">
            <li>✓ {t('install.benefit1')}</li>
            <li>✓ {t('install.benefit2')}</li>
            <li>✓ {t('install.benefit3')}</li>
            <li>✓ {t('install.benefit4')}</li>
          </ul>
        </div>

        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="w-full mt-6 rounded-none"
        >
          {t('install.backToHome')}
        </Button>
      </Card>
    </div>
  );
}
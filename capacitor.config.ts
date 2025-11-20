import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.caecd137de8c4f159ad74eeb588073c6',
  appName: 'hyperkids',
  webDir: 'dist',
  server: {
    url: 'https://caecd137-de8c-4f15-9ad7-4eeb588073c6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#00ffba"
    }
  }
};

export default config;
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.twostones.pricing',
  appName: 'TwoStones Pricing',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;

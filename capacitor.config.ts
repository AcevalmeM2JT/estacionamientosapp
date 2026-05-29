import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dondeestaciono',
  appName: 'DondeEstaciono',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://dondeestaciono.cl',
    cleartext: true,
    hostname: 'estacionamientosapp',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;

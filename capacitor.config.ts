import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bachduong.remixvideo',
  appName: 'Remix Bach Translator & Video Editor',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    Device: {},
    App: {},
    Haptics: {}
  }
};

export default config;

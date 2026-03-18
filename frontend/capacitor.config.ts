import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.college.attendance',
  appName: 'Smart Attendance',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['ronak-pc.tailf0fdeb.ts.net', '*.ts.net']
  }
};

export default config;

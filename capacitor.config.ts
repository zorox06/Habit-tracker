import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.habittracker.app',
  appName: 'HabitTracker',
  webDir: 'dist',
  server: {
    // Allow navigation to external OAuth URLs
    allowNavigation: ['*.google.com', '*.supabase.co', '*.googleapis.com'],
  },
  plugins: {
    Browser: {
      // No special config needed
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '821756408417-6u9qbhbd755mu65gll0p46cf4vqri1de.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;

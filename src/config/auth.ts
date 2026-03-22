import { Capacitor } from '@capacitor/core';

// Detect if running inside Capacitor native app
const isNative = Capacitor.isNativePlatform();

// Google OAuth Configuration
export const GOOGLE_OAUTH_CONFIG = {
  clientId: "821756408417-6u9qbhbd755mu65gll0p46cf4vqri1de.apps.googleusercontent.com",
  projectId: "fast-fire-466616-n3",
  // In native app, redirect to custom scheme so the OS routes back to the app.
  // On web, redirect to the current origin.
  redirectUri: isNative
    ? 'com.habittracker.app://login'
    : (typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:5173/'),
};

// Auth configuration
export const AUTH_CONFIG = {
  google: {
    clientId: GOOGLE_OAUTH_CONFIG.clientId,
    redirectTo: GOOGLE_OAUTH_CONFIG.redirectUri,
  },
};

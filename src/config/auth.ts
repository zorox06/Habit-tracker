// Google OAuth Configuration
export const GOOGLE_OAUTH_CONFIG = {
  clientId: "821756408417-6u9qbhbd755mu65gll0p46cf4vqri1de.apps.googleusercontent.com",
  projectId: "fast-fire-466616-n3",
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:5173/',
};

// Auth configuration
export const AUTH_CONFIG = {
  google: {
    clientId: GOOGLE_OAUTH_CONFIG.clientId,
    redirectTo: GOOGLE_OAUTH_CONFIG.redirectUri,
  },
};

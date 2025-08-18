# Google OAuth Setup Guide

## Prerequisites
You have already obtained your Google OAuth client credentials:
- Client ID: `821756408417-6u9qbhbd755mu65gll0p46cf4vqri1de.apps.googleusercontent.com`
- Project ID: `fast-fire-466616-n3`

## Step 1: Configure Google OAuth in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `cwrkdwbyuxsdzznutham`
3. Navigate to **Authentication** → **Providers**
4. Find **Google** and click **Enable**
5. Configure the following settings:

### Google OAuth Configuration in Supabase:
- **Client ID**: `821756408417-6u9qbhbd755mu65gll0p46cf4vqri1de.apps.googleusercontent.com`
- **Client Secret**: `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`
- **Redirect URL**: `https://cwrkdwbyuxsdzznutham.supabase.co/auth/v1/callback`

### Authorized Redirect URIs in Google Console:
You need to add these URLs to your Google OAuth app:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `fast-fire-466616-n3`
3. Go to **APIs & Services** → **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add these Authorized redirect URIs:
   - `https://cwrkdwbyuxsdzznutham.supabase.co/auth/v1/callback`
   - `http://localhost:5173/` (for local development)
   - `http://localhost:3000/` (alternative local port)

## Step 2: Environment Variables (Optional)

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://cwrkdwbyuxsdzznutham.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cmtkd2J5dXhzZHp6bnV0aGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MTEwNzIsImV4cCI6MjA3MDk4NzA3Mn0.SnDJ5-czcI8C23QQ-Xcg4fkpeYow_7N9EXDLMZYRKVc
```

## Step 3: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the login page
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you should be redirected back to your app

## Security Notes

⚠️ **Important**: Never commit client secrets to your repository. The client secret should only be configured in your Supabase dashboard, not in your frontend code.

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**:
   - Make sure the redirect URI in Google Console matches exactly
   - Check that the Supabase redirect URL is correct

2. **"Client ID not found" error**:
   - Verify the client ID is correctly configured in Supabase
   - Check that Google OAuth is enabled in Supabase

3. **"Access denied" error**:
   - Ensure your Google OAuth app is properly configured
   - Check that the app is not in testing mode (or add your email as a test user)

### Debug Steps:
1. Check browser console for errors
2. Verify Supabase logs in the dashboard
3. Test with a fresh browser session
4. Clear browser cache and cookies

## Production Deployment

When deploying to production:
1. Update the redirect URIs in Google Console to include your production domain
2. Update the redirect URL in Supabase to use your production domain
3. Ensure your production domain is added to authorized domains in Google Console

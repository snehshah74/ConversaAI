# Vercel Deployment Checklist

If deployments fail, follow these steps:

## 1. Set Root Directory (Required)

Your Next.js app is in the `frontend/` subdirectory. Vercel must be configured to build from there:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (**conversa-ai** or **conversa-voiceai**)
3. **Settings** → **General**
4. Under **Root Directory**, click **Edit**
5. Enter: `frontend`
6. Save

## 2. Environment Variables

In **Settings** → **Environment Variables**, add:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_API_URL` | Your backend URL (e.g. `https://your-backend.onrender.com`) | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | For auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | For auth |

## 3. Redeploy

After changing settings, go to **Deployments** → select latest → **Redeploy**.

## 4. Social Login (Google, GitHub)

To enable "Sign in with Google" and "Sign in with GitHub":

1. **Supabase Dashboard** → **Authentication** → **Providers**
2. Enable **Google** and/or **GitHub**
3. Add credentials (Client ID, Client Secret) from each provider's developer console
4. **Authentication** → **URL Configuration** → add to **Redirect URLs**:
   - `https://conversa-voiceai.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

## 5. Duplicate Projects

You have both **conversa-ai** and **conversa-voiceai**. If one works, you can delete the other to avoid confusion. Ensure both have Root Directory = `frontend` if you keep them.

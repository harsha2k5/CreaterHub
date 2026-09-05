# 🌐 CreaterHub Production Hosting & Deployment Guide

## Why did the backend not work on Netlify?
**Netlify is a static website host.** When you deploy to Netlify:
1. It runs `npm run build` to generate static React files (`dist/`).
2. It **does NOT run** `node server/index.cjs`. There is no Node.js backend server listening on Netlify.
3. In `netlify.toml`, `from = "/*"` redirects all unknown URLs (including `/api/...`) to `index.html`. As a result, your frontend receives HTML instead of JSON from API calls, causing crashes.
4. Furthermore, CreaterHub uses a **relational SQLite database** on disk (`server/data/creatorhub.db`). Serverless functions (like AWS Lambda or Netlify Functions) have read-only or ephemeral filesystems where all user accounts, briefs, and escrow records would be wiped whenever the function goes idle.

---

## 🚀 Recommended Solution: Free Deployment on Render (2 Minutes)

Deploying on **Render.com** (Free tier) runs both the React Frontend and the Node.js Express server + SQLite database in one place with zero configuration.

### Step-by-Step Instructions:
1. Go to **[render.com](https://render.com)** and sign in with your GitHub account.
2. Click **New +** ➔ **Web Service**.
3. Select your repository: **`harsha2k5/CreaterHub`**.
4. Configure the settings (Render will auto-detect from `render.yaml`):
   - **Name**: `creatorhub`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. In the **Environment Variables** section, add:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (Click "Generate" or type any secure random string)
6. Click **Create Web Service**.

🎉 **Done!** Render will build your app and give you a live URL like:
`https://creatorhub-xxxx.onrender.com`
- Your full React frontend works.
- Your complete Express API works.
- Your SQLite database persists on disk.
- Zero CORS errors.

---

## ⚡ Alternative: Keep Frontend on Netlify + Backend on Render

If you prefer keeping your frontend hosted on **Netlify**:

1. Deploy the backend on **Render** (as explained above).
2. Note your Render URL (e.g., `https://creatorhub-api.onrender.com`).
3. Open your **Netlify Site Settings**:
   - Go to **Site configuration** ➔ **Environment variables**.
   - Click **Add a variable**:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://creatorhub-api.onrender.com`
4. Trigger a new deployment on Netlify (or push a commit).
   - The React frontend will now automatically direct all `/api/...` calls to your live Render backend!

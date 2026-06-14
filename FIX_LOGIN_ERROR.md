# Fix Login 500 Error - Set Environment Variable in Vercel

## Problem
Login returns a **500 error** because the backend URL environment variable is not set in Vercel.

## Solution - Add Environment Variable to Vercel Dashboard

### Step 1: Go to Vercel Project Settings
1. Open https://vercel.com/dashboard
2. Click on your `divencoopmain` project
3. Go to **Settings** tab

### Step 2: Add Environment Variable
1. Click **Environment Variables** (left sidebar)
2. Click **Add New**
3. Fill in:
   - **Name:** `GOOGLE_APPS_SCRIPT_URL`
   - **Value:** `https://script.google.com/macros/s/AKfycbwgbBWCgRyXXiamfROupZjouV5IBNQXSNiqNcsypi7mBMfke1QOqfAfqN4Amf07koqX/exec`
   - **Select Environments:** Check all (Production, Preview, Development)
4. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **3-dot menu** → **Redeploy**
4. Confirm redeploy

### Step 4: Test Login
1. Wait 1-2 minutes for redeployment
2. Go to https://divencoopmain.vercel.app/
3. Login with:
   - Username: `admin`
   - Password: `Admin@DGCoop2024`
4. ✅ You should now see the dashboard!

---

## Why This Happened
Environment variables need to be manually set in Vercel's dashboard for security reasons. They're not automatically read from `.env` or `vercel.json` at runtime. This prevents hardcoding secrets in your repository.

---

## Quick Reference
**Backend URL:**
```
https://script.google.com/macros/s/AKfycbwgbBWCgRyXXiamfROupZjouV5IBNQXSNiqNcsypi7mBMfke1QOqfAfqN4Amf07koqX/exec
```

**Environment Variable Name:** `GOOGLE_APPS_SCRIPT_URL`

# Vercel Environment Variables Import Guide

## Option 1: Automatic Import (Recommended)

When you connect your GitHub repository to Vercel, it will automatically detect the `.env` file in the root directory. The variables will be available for preview environments.

**Steps:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `divencoop` project
3. Click **Settings** → **Environment Variables**
4. The variables from `.env` will be auto-filled ✅
5. Click **Save**

## Option 2: Manual Import

If automatic import doesn't work:

1. Go to **Settings** → **Environment Variables**
2. Click **Import From .env**
3. Copy the contents of `.env` file:
   ```
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwgbBWCgRyXXiamfROupZjouV5IBNQXSNiqNcsypi7mBMfke1QOqfAfqN4Amf07koqX/exec
   ```
4. Paste it in the input field
5. Click **Add**

## Option 3: Add During Project Import

When first importing your GitHub repo to Vercel:

1. Go to **New Project**
2. Click **Import Git Repository**
3. Select `divencoop`
4. Scroll to **Environment Variables**
5. Click **Add .env.local file content**
6. Paste the contents of `.env`
7. Click **Continue**
8. Click **Deploy**

## ✅ Current Variables

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwgbBWCgRyXXiamfROupZjouV5IBNQXSNiqNcsypi7mBMfke1QOqfAfqN4Amf07koqX/exec
```

That's it! No more manual setup needed. Just deploy and test! 🚀

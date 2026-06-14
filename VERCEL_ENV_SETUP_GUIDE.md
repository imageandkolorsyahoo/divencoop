# 🔧 Vercel Environment Variable Setup - Complete Guide

## Problem
Login returns: `❌ Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

This means the environment variable `GOOGLE_APPS_SCRIPT_URL` is **NOT SET** in Vercel.

---

## ✅ Solution - Set Environment Variable Correctly

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Click on the **`divencoopmain`** project

### Step 2: Open Settings
- Click the **⚙️ Settings** tab (top right area)

### Step 3: Navigate to Environment Variables  
- In the left sidebar, click **Environment Variables**

### Step 4: Add New Variable
1. Click the **"Add New"** button
2. Fill in the form:
   - **Name:** `GOOGLE_APPS_SCRIPT_URL`
   - **Value:** Copy and paste exactly:
   ```
   https://script.google.com/macros/s/AKfycbwgbBWCgRyXXiamfROupZjouV5IBNQXSNiqNcsypi7mBMfke1QOqfAfqN4Amf07koqX/exec
   ```
   - **Select All Environments** checkbox: ✅ CHECK THIS
     (Check: Production, Preview, Development)

3. Click **"Save"**

### Step 5: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment (top one)
3. Click the **three dots (⋮)** menu
4. Select **"Redeploy"**
5. Confirm - **wait 2-3 minutes** for redeploy to complete

### Step 6: Test
1. Hard refresh: `https://divencoopmain.vercel.app/` (Ctrl+Shift+R)
2. Login with:
   - Username: `admin`
   - Password: `Admin@DGCoop2024`
3. You should see the Dashboard! ✅

---

## 📋 Checklist
- [ ] Environment variable `GOOGLE_APPS_SCRIPT_URL` is set
- [ ] It's set in ALL environments (Production, Preview, Development)
- [ ] Value is exactly: `https://script.google.com/macros/s/AKfycbwgbBWCgRyXXiamfROupZjouV5IBNQXSNiqNcsypi7mBMfke1QOqfAfqN4Amf07koqX/exec`
- [ ] You clicked "Redeploy" and waited 2-3 minutes
- [ ] Hard refresh the page (Ctrl+Shift+R)

---

## 🆘 If it still doesn't work:
1. Check Vercel **Logs** (Deployments → Select deployment → Logs tab)
2. Look for errors from the proxy function
3. Verify the URL can be accessed directly in browser
4. Check browser **Console** (F12) for error details

---

## What the Settings button does
Once logged in as Admin, you'll see a **⚙️ Settings** button in the sidebar footer (bottom left) to access app configuration.

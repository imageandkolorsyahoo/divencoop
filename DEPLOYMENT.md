# 🚀 Deployment Guide - GitHub & Vercel

## Step 1: Push to GitHub

### Option A: Create a NEW GitHub Repository

1. Go to [github.com](https://github.com) and login
2. Click **+** → **New repository**
3. Name it: `divine-grace-coop`
4. Click **Create repository** (don't add README/gitignore)
5. Copy the commands shown and run them in your terminal:

```bash
cd c:\DivinGrace_FINAL\DivinGrace_FINAL
git remote add origin https://github.com/YOUR_USERNAME/divine-grace-coop.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Option B: Use Existing GitHub Repository

If you already have a repo:

```bash
cd c:\DivinGrace_FINAL\DivinGrace_FINAL
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### A. Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign up** (or login if you have an account)
3. Choose **GitHub** and authorize
4. You're now connected!

### B. Create a New Vercel Project

1. In Vercel dashboard, click **New Project**
2. Click **Import Git Repository**
3. Find `divine-grace-coop` in your repositories
4. Click **Import**

### C. Configure Environment Variables

1. In the import screen, look for **Environment Variables**
2. Add the following:
   - **Name:** `GOOGLE_APPS_SCRIPT_URL`
   - **Value:** `https://script.google.com/macros/s/AKfycbwgbBWCgRyXXiamfROupZjouV5IBNQXSNiqNcsypi7mBMfke1QOqfAfqN4Amf07koqX/exec`
3. Click **Add**

### D. Configure Build Settings

1. **Framework Preset:** Other/Static
2. **Build Command:** `echo 'No build needed'`
3. **Output Directory:** `frontend`
4. **Install Command:** (leave empty)

### E. Deploy!

1. Click **Deploy**
2. Wait 1-2 minutes for deployment
3. You'll get a URL like: `https://divine-grace-coop.vercel.app`

---

## Step 3: Set Vercel URL in App

Once deployed:

1. Go to your Vercel URL
2. Click **⚙️ Settings**
3. Enter Vercel URL in **Apps Script Backend URL** field
4. Click **Save & Apply**
5. Click **Test** to verify

---

## Step 4: Update Netlify (Optional)

If you want to keep both Netlify and Vercel running:

1. Go to [netlify.com](https://netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect GitHub
4. Select `divine-grace-coop`
5. Set Environment Variables:
   - `GOOGLE_APPS_SCRIPT_URL` = your Apps Script URL
6. Deploy!

---

## ✅ Verification Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set in Vercel
- [ ] Deployment successful
- [ ] Can access the app at Vercel URL
- [ ] Login works with `admin` / `Admin@DGCoop2024`
- [ ] Backend test passes in Settings ⚙️

---

## 🔄 Future Deployments

Once connected to GitHub and Vercel:
- **Any push to `main` branch** automatically deploys to Vercel
- No manual steps needed!
- Check deployment status at [vercel.com/dashboard](https://vercel.com/dashboard)

---

## 🆘 Troubleshooting

**"500 error on login?"**
- Check environment variable `GOOGLE_APPS_SCRIPT_URL` is set correctly

**"Backend test fails?"**
- Verify the Google Apps Script URL is deployed and accessible
- Check the URL doesn't have typos

**"Can't see changes after push?"**
- Wait 1-2 minutes for Vercel to rebuild
- Hard refresh browser (Ctrl+Shift+R)
- Check deployment status in Vercel dashboard

---

## 📊 Both Platforms Running

You can have both Netlify AND Vercel running the same code:

| Platform | URL | Status |
|----------|-----|--------|
| Netlify  | https://jovial-donut-38fd20.netlify.app | Current |
| Vercel   | https://divine-grace-coop.vercel.app | Set up new |

Both will work identically!

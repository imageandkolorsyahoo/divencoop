# Divine Grace Cooperative Portal — Setup Guide

Stack: **Google Sheets (database)** + **Apps Script (backend)** + **Netlify (frontend hosting)**

Your Google Sheet ID: `1pNUQjENh55PVDt_M8zVmWx4O8lX9Eo9i`

---

## STEP 1 — Backend Setup (Apps Script) — 5 minutes

1. Open your Google Sheet:
   https://docs.google.com/spreadsheets/d/1pNUQjENh55PVDt_M8zVmWx4O8lX9Eo9i/edit

2. Go to **Extensions → Apps Script**

3. Delete any existing code in `Code.gs`

4. Open `backend/DivinGrace_BACKEND.gs` from this package
   → Copy ALL the content → Paste into the Apps Script editor

5. Click **Save** (💾 icon or Ctrl+S)

6. At the top, select function: **setup**
   → Click **▶ Run**
   → Grant permissions when prompted (click through "Advanced" → "Go to project (unsafe)" — this is your own script, it's safe)

7. You'll see a popup: "✅ Setup Complete!"
   This created:
   - All 11 sheets with correct columns
   - Default settings (₦2,000 weekly, 60/40 proration, 5% interest, etc.)
   - Admin user: `admin` / `Admin@DGCoop2024`
   - Sample branch: Head Office (BR001)

8. **Deploy as Web App:**
   - Click **Deploy → New deployment**
   - Click the gear ⚙️ next to "Select type" → choose **Web app**
   - Description: `DG Coop API v2`
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**
   - **Copy the Web App URL** (looks like `https://script.google.com/macros/s/AKfycby.../exec`)

---

## STEP 2 — Frontend Setup (Netlify) — 2 minutes

1. Go to https://app.netlify.com → Sign up free
2. Click **"Add new site" → "Deploy manually"**
3. Drag the **`frontend`** folder into the drop zone
4. Wait ~30 seconds → you get a URL like `https://your-site.netlify.app`

---

## STEP 3 — Connect Frontend to Backend — 1 minute

1. Open your Netlify URL
2. Log in:
   - Username: `admin`
   - Password: `Admin@DGCoop2024`
3. Go to **Settings** (sidebar)
4. Paste your Apps Script Web App URL (from Step 1.8)
5. Click **Save URL**
6. Page reloads — you're connected! 🎉

The URL is saved permanently in the browser — never needs re-entry.

---

## DEFAULT LOGINS

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | Admin@DGCoop2024 |
| Members | [firstname.lastname] | Welcome@1234 |

⚠️ Change the admin password after first login (My Profile page)

---

## FEATURES

✅ Dark / Light mode (🌙 button, persists)
✅ Collapsible sidebar (desktop) with tooltips
✅ Mobile bottom navigation — feels like a native app
✅ Tablet slide-over sidebar with overlay
✅ Profile pictures — every user can upload their own
✅ Member preview card before posting (photo + balances + active loan)
✅ Flexible weekly contribution — admin sets default, but always editable
✅ Live proration preview as you type
✅ Full loan lifecycle: apply → guarantor verify → approve → disburse → repay → auto-close
✅ 2 guarantors required, cross-checked for eligibility
✅ 6-month membership rule before loan eligibility (configurable)
✅ Max loan = 2× savings (configurable)
✅ Offline support — actions queue and sync when reconnected
✅ Audit log — every action recorded
✅ Multi-branch support with branch managers
✅ Real-time passbook generation + print
✅ Install as native app (PWA) on Android/iOS/Desktop

---

## INSTALL AS APP

- **Android:** Chrome → ⋮ menu → "Add to Home Screen"
- **iPhone:** Safari → Share → "Add to Home Screen"
- **Desktop:** Click install icon (⊕) in Chrome address bar

---

## TROUBLESHOOTING

**"API not configured" message**
→ Make sure you pasted the Apps Script URL correctly in Settings,
  and that you deployed with "Anyone" access.

**"Invalid username or password"**
→ Re-run the `setup` function in Apps Script — it only creates
  the admin user if one doesn't exist.

**Changes to Apps Script not reflecting**
→ After editing `.gs` code, you must create a **New deployment**
  (not just save) for changes to take effect, OR use
  "Manage deployments" → edit → New version.

---
Divine Grace Cooperative Multipurpose Society Ltd
REG: LSCS 18377 | TEL: 08038593189

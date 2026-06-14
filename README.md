# Divine Grace Cooperative Application

A modern web-based cooperative management system built with vanilla JavaScript and Google Apps Script.

## 📋 Features

- **Member Management** - Register, approve, and manage cooperative members
- **Savings & Contributions** - Track weekly contributions and savings
- **Loan Management** - Apply for loans, track repayments, guarantor verification
- **Transaction Tracking** - Complete audit trail of all transactions
- **Admin Dashboard** - Real-time statistics and branch reporting
- **Offline Support** - Service Worker enables offline functionality
- **Mobile Responsive** - Works on desktop, tablet, and mobile devices

## 🏗️ Architecture

```
frontend/          - Static Vue-free SPA (HTML/CSS/JS)
├── index.html     - Main application shell
├── assets/
│   ├── js/        - Core application logic (api, app, db, modals)
│   └── css/       - Responsive styling
├── sw.js          - Service worker for offline support
└── netlify/
    └── functions/ - Vercel/Netlify serverless function (proxy)

backend/           - Google Apps Script
└── DivinGrace_BACKEND.gs - All-in-one backend API

vercel.json        - Vercel deployment configuration
netlify.toml       - Netlify deployment configuration
```

## 🚀 Deployment

### Netlify Deployment

1. Connect your GitHub repo to Netlify
2. Set Environment Variable in Netlify:
   - Key: `GOOGLE_APPS_SCRIPT_URL`
   - Value: `https://script.google.com/macros/s/AKfycbwgbBWCgRyXXiamfROupZjouV5IBNQXSNiqNcsypi7mBMfke1QOqfAfqN4Amf07koqX/exec`
3. Deploy!

### Vercel Deployment

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository
4. Set Environment Variables:
   - Key: `GOOGLE_APPS_SCRIPT_URL`
   - Value: `https://script.google.com/macros/s/AKfycbwgbBWCgRyXXiamfROupZjouV5IBNQXSNiqNcsypi7mBMfke1QOqfAfqN4Amf07koqX/exec`
5. Root Directory: `frontend`
6. Deploy!

## 🔧 Configuration

### Environment Variables

Create a `.env` file (or set in deployment platform):

```
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Backend Setup

1. Open your Google Sheet: [Sheet Link](https://docs.google.com/spreadsheets/d/1pNUQjENh55PVDt_M8zVmWx4O8lX9Eo9i)
2. Go to **Extensions → Apps Script**
3. Delete all code, paste `backend/DivinGrace_BACKEND.gs`
4. Select `setup` function → Click **Run**
5. Deploy as **Web App** (Execute as: Me, Access: Anyone)
6. Copy the Web App URL to your environment variables

## 👤 Default Credentials

- **Username:** `admin`
- **Password:** `Admin@DGCoop2024`

## 📱 Frontend Technologies

- **Vanilla JavaScript** - No frameworks (lightweight, fast)
- **IndexedDB** - Offline data storage
- **Service Worker** - Offline-first architecture
- **CSS Grid/Flexbox** - Responsive design
- **LocalStorage** - Session management

## 🔐 Security Notes

- Passwords are hashed with SHA-256 + Salt on backend
- JWT tokens expire after 8 hours
- CORS enabled through Vercel/Netlify functions
- Input validation on both frontend and backend

## 📊 Database

Uses Google Sheets with the following sheets:
- `SETTINGS` - App configuration
- `BRANCHES` - Branch information
- `MEMBERS` - Cooperative members
- `USERS` - Login credentials
- `TRANSACTIONS` - All financial transactions
- `LOANS` - Loan applications and tracking
- `LOAN_REPAYMENTS` - Repayment history
- `GUARANTORS` - Loan guarantors
- `COMMODITIES` - Member commodities
- `SUMMARY` - Aggregated member data
- `AUDIT_LOG` - System audit trail

## 🐛 Troubleshooting

### Login not working?
- Check backend URL in Settings ⚙️
- Verify Google Apps Script is deployed
- Check environment variables are set correctly

### Offline mode activating unexpectedly?
- Check browser console for network errors
- Verify API endpoint is accessible
- Try clearing Service Worker cache

## 📄 License

Divine Grace Cooperative - All Rights Reserved

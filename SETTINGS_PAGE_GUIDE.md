# Settings Page - Features & Navigation

## 🎯 Overview
The Settings page is the admin control center for configuring all cooperative rules, rates, and system preferences.

**Access:** Admin users can click:
- ⚙️ **Settings** in the left sidebar navigation (under "Reports & Config" section)
- ⚙️ **Settings** button in the sidebar footer (bottom left)

---

## 📋 Settings Page Features

### 1️⃣ Cooperative Rules (Left Column)
Configure the core business logic:
- **Default Weekly Contribution** (₦) - Default contribution amount for members
- **Savings Proration %** - Percentage of contribution that goes to savings when member has active loan
- **Loan Repayment Proration %** - Percentage that goes to loan repayment
- **Allow Member 100% Loan Override** - YES/NO toggle to let members override loan limits
- **Loan Interest Rate** (%) - Interest rate on approved loans
- **Max Loan = X × Savings** - Maximum loan multiplier based on savings balance
- **Min Months Before Loan Eligible** - How long member must be in system before eligible
- **Max Guarantees Per Member** - Maximum number of loans a member can guarantee
- **Session Timeout** (minutes) - How long before auto-logout

### 2️⃣ Apps Script Connection (Right Top)
Shows backend connectivity status:
- 🟢 **Connected** (green) - Backend is properly configured
- 🔴 **Not Set** (red) - Backend URL not configured
- Contains field to paste and save the Google Apps Script Web App URL

### 3️⃣ Preferences (Right Bottom)
User preferences:
- **Dark / Light Mode Toggle** - Switch between dark and light themes

---

## 🧭 Navigation

### Getting to Settings:
1. Login as Admin
2. Click ⚙️ **Settings** from sidebar
3. OR click ⚙️ button in sidebar footer

### Leaving Settings:
1. Click **← Dashboard** button at top
2. OR click another page in sidebar (Members, Loans, Transactions, etc.)
3. OR click **Sign Out** in sidebar footer

---

## 💾 Saving Settings
- All settings have a **"💾 Save All Settings"** button
- Click it to save all changes at once
- You'll see a ✅ confirmation toast

---

## 🔒 Who Can Access
- **Admin** users only (full access)
- **Branch Managers** cannot access this page
- **Members** cannot access this page

---

## 🚀 Next Steps
Once you're logged in successfully:
1. Navigate to Settings
2. Verify backend connection shows 🟢 **Connected**
3. Configure your cooperative rules
4. Click **Save All Settings** to apply changes

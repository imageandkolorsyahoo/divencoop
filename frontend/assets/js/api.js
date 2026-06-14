// ============================================================
// api.js — Divine Grace Cooperative API Client
// Calls Google Apps Script Web App URL (set once by admin)
// ============================================================

const Auth = (() => {
  const K = "DG_SESSION";
  return {
    save:     d  => localStorage.setItem(K, JSON.stringify(d)),
    load:     () => { try { return JSON.parse(localStorage.getItem(K)); } catch { return null; } },
    clear:    () => localStorage.removeItem(K),
    getToken: () => Auth.load()?.token || null,
    getUser:  () => Auth.load(),
    isAdmin:  () => Auth.load()?.role === "Admin",
    isManager:() => ["Admin","BranchManager"].includes(Auth.load()?.role),
    isMember: () => Auth.load()?.role === "Member",
  };
})();

const API = (() => {
  function getUrl() {
    return localStorage.getItem("DG_API_URL") || "";
  }

  async function call(action, data = {}, params = {}) {
    const url   = getUrl();
    const token = Auth.getToken();

    const body = { action, token: token || "", data, params };

    try {
      // Try Vercel first (/api/proxy), then Netlify (/.netlify/functions/api)
      let endpoint = "/.netlify/functions/api";
      
      // Check if we're on Vercel by looking for vercel domain or /api prefix
      if (window.location.hostname.includes("vercel")) {
        endpoint = "/api/proxy";
      }
      
      // If a custom URL is set, use it directly
      if (url) {
        endpoint = url;
      }

      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body)
      });
      const json = await res.json();

      if (json.code === 401) {
        Auth.clear();
        if (typeof App !== "undefined") App.go("login");
        if (typeof UI  !== "undefined") UI.toast("Session expired — please log in again.", "warning");
        return null;
      }
      return json;
    } catch (e) {
      // Offline handling
      const readOnly = ["GET_MEMBERS","GET_LOANS","GET_TRANSACTIONS",
        "MEMBER_DASHBOARD","ADMIN_DASHBOARD","GET_SETTINGS","GET_BRANCHES",
        "GET_AUDIT_LOG","GENERATE_PASSBOOK","BRANCH_REPORT","GET_MEMBER",
        "GET_MEMBER_TRANSACTIONS","CHECK_LOAN_ELIGIBILITY"];

      if (!readOnly.includes(action) && typeof DB !== "undefined") {
        await DB.queueAction({ action, data, params, timestamp: Date.now() });
        if (typeof UI !== "undefined")
          UI.toast("Offline — action saved and will sync when reconnected.", "info");
      } else if (typeof UI !== "undefined") {
        UI.toast("Connection issue. Check your internet.", "warning");
      }
      return null;
    }
  }

  // Set API URL (called from admin settings)
  function setUrl(url) {
    localStorage.setItem("DG_API_URL", url.trim());
  }
  function hasUrl() { return !!getUrl(); }
  function getUrlValue() { return getUrl(); }

  // ── API Methods ─────────────────────────────────────────
  const auth = {
    login:  (u, p) => call("LOGIN",  { username: u, password: p }),
    logout: ()     => call("LOGOUT")
  };
  const settings = {
    getAll:  ()       => call("GET_SETTINGS"),
    update:  (k, v)   => call("UPDATE_SETTING", { key: k, value: v })
  };
  const branches = {
    getAll:  ()       => call("GET_BRANCHES"),
    get:     id       => call("GET_BRANCH",    {}, { branchId: id }),
    add:     d        => call("ADD_BRANCH",     d),
    update:  (id, d)  => call("UPDATE_BRANCH",  d, { branchId: id })
  };
  const members = {
    getAll:        bId => call("GET_MEMBERS",              {}, { branchId: bId||"" }),
    get:            id => call("GET_MEMBER",               {}, { memberId: id }),
    add:             d => call("ADD_MEMBER",                d),
    update:    (id, d) => call("UPDATE_MEMBER",             d, { memberId: id }),
    approve:        id => call("APPROVE_MEMBER",           {}, { memberId: id }),
    suspend: (id, r)   => call("SUSPEND_MEMBER", { reason: r }, { memberId: id }),
    dashboard:      id => call("MEMBER_DASHBOARD",         {}, { memberId: id }),
    loanEligibility:(id, amt) => call("CHECK_LOAN_ELIGIBILITY", {}, { memberId: id, amount: amt })
  };
  const transactions = {
    postContribution:   d      => call("POST_CONTRIBUTION",     d),
    post:               d      => call("POST_TRANSACTION",      d),
    getAll:             f      => call("GET_TRANSACTIONS",      {}, f||{}),
    getMember: (id, lim)       => call("GET_MEMBER_TRANSACTIONS",{}, { memberId: id, limit: lim||100 })
  };
  const loans = {
    apply:           d => call("APPLY_LOAN",          d),
    approve:        id => call("APPROVE_LOAN",        {}, { loanId: id }),
    reject:   (id, r)  => call("REJECT_LOAN",  { reason: r }, { loanId: id }),
    disburse:       id => call("DISBURSE_LOAN",       {}, { loanId: id }),
    repay:           d => call("POST_REPAYMENT",       d),
    getAll:          f => call("GET_LOANS",            {}, f||{}),
    getRepayments:  id => call("GET_LOAN_REPAYMENTS",  {}, { loanId: id }),
    getGuarantors:  id => call("GET_LOAN_GUARANTORS",  {}, { loanId: id }),
    verifyGuarantor:id => call("VERIFY_GUARANTOR",     {}, { guarantorId: id }),
    checkGuarantor: id => call("CHECK_GUARANTOR_ELIG", {}, { memberId: id })
  };
  const commodities = {
    getAll:             f => call("GET_COMMODITIES",              {}, f||{}),
    add:                d => call("ADD_COMMODITY",                 d),
    updatePayment:(id, amt)=> call("UPDATE_COMMODITY_PAYMENT", { amountPaid: amt }, { commodityId: id })
  };
  const reports = {
    adminDashboard: ()    => call("ADMIN_DASHBOARD"),
    branchReport:   id    => call("BRANCH_REPORT",    {}, { branchId: id }),
    passbook:       id    => call("GENERATE_PASSBOOK",{}, { memberId: id }),
    rebuildSummary: ()    => call("REBUILD_SUMMARY"),
    auditLog:       lim   => call("GET_AUDIT_LOG",    {}, { limit: lim||50 })
  };
  const sync = {
    push: queue => call("SYNC_OFFLINE_QUEUE", { queue })
  };

  return { auth, settings, branches, members, transactions, loans,
           commodities, reports, sync, setUrl, hasUrl, getUrlValue };
})();

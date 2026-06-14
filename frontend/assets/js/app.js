// ============================================================
// app.js — Divine Grace Cooperative Portal SPA
// Router · UI Helpers · Avatars · All Pages
// ============================================================

// ── UI Helpers ────────────────────────────────────────────
const UI = {
  toast(msg, type = "success", ms = 4000) {
    const c = document.getElementById("toast-container");
    const t = document.createElement("div");
    const icons = { success:"✅", warning:"⚠️", error:"❌", info:"ℹ️" };
    t.className = `toast ${type}`;
    t.innerHTML = `<span style="font-size:1rem;flex-shrink:0">${icons[type]||"ℹ️"}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => {
      t.classList.add("toast-out");
      setTimeout(() => t.remove(), 350);
    }, ms);
  },
  setTitle(t) {
    const el = document.getElementById("topbar-title");
    if (!el) return;
    el.style.opacity = "0";
    setTimeout(() => { el.textContent = t; el.style.transition = "opacity .2s"; el.style.opacity = "1"; }, 100);
  },
  setActive(page) {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.toggle("active", i.dataset.page === page));
    document.querySelectorAll(".bnav-item").forEach(i => i.classList.toggle("active", i.dataset.page === page));
  },
  modal: id => ({
    open:  () => { const m = document.getElementById(id); if(m) m.classList.add("open"); },
    close: () => { const m = document.getElementById(id); if(m) m.classList.remove("open"); }
  }),
  fmt: {
    money:     n => "₦" + Number(n||0).toLocaleString("en-NG", {minimumFractionDigits:2,maximumFractionDigits:2}),
    moneyShort:n => { const v=Number(n||0); return v>=1e6?"₦"+(v/1e6).toFixed(1)+"M":v>=1e3?"₦"+(v/1e3).toFixed(0)+"K":"₦"+v.toLocaleString(); },
    date:      d => d ? new Date(d).toLocaleDateString("en-NG",{day:"2-digit",month:"short",year:"numeric"}) : "—",
    datetime:  d => d ? new Date(d).toLocaleString("en-NG") : "—",
    initials:  n => (n||"??").split(" ").map(p=>p[0]||"").join("").toUpperCase().slice(0,2)||"??"
  },
  badge(status) {
    const m = {
      "Active":"green","Approved":"green","Verified":"green","Paid":"green","Closed":"green",
      "Pending":"gold","Partial":"gold","Active Loan":"gold",
      "Inactive":"grey","Suspended":"grey","None":"grey","Locked":"grey",
      "Rejected":"red","Failed":"red","Unpaid":"red"
    };
    return `<span class="badge b-${m[status]||"grey"}">${status||"—"}</span>`;
  },
  skeleton(rows, cols) {
    return Array(rows).fill(0).map(() =>
      `<tr>${Array(cols).fill(0).map(() =>
        `<td><div class="skeleton" style="height:13px;width:${50+Math.random()*45}%;border-radius:4px"></div></td>`
      ).join("")}</tr>`
    ).join("");
  },
  confirm: msg => window.confirm(msg)
};

// ── Avatar helpers ────────────────────────────────────────
const Avatar = {
  key:     uid => `DG_AV_${uid}`,
  save:   (uid, b64) => { try { localStorage.setItem(Avatar.key(uid), b64); } catch {} },
  get:     uid => localStorage.getItem(Avatar.key(uid)),
  remove:  uid => localStorage.removeItem(Avatar.key(uid)),

  render(uid, name, size=36) {
    const src = Avatar.get(uid);
    const init = UI.fmt.initials(name || uid);
    const colors = ["#1a7a4a","#2563eb","#7c3aed","#db2777","#dc2626","#0891b2","#059669"];
    const bg = colors[(init.charCodeAt(0)||0) % colors.length];
    if (src) return `<img src="${src}" class="avatar" style="width:${size}px;height:${size}px" alt="${init}">`;
    return `<div class="avatar" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,${bg},${bg}bb);font-size:${Math.floor(size*.35)}px">${init}</div>`;
  },

  uploadWidget(uid, name, onDone) {
    const wid = `av_${uid}`;
    return `
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
        <div id="${wid}_prev">${Avatar.render(uid, name, 60)}</div>
        <div>
          <div class="font-bold" style="margin-bottom:.4rem">${name||uid}</div>
          <label style="cursor:pointer;display:inline-flex;align-items:center;gap:.35rem;
            padding:.38rem .8rem;background:var(--coop-light);color:var(--coop-green);
            border:1.5px solid var(--coop-green);border-radius:var(--r-sm);font-size:.75rem;font-weight:600">
            📷 Upload Photo
            <input type="file" accept="image/*" style="display:none"
              onchange="Avatar._upload('${uid}','${wid}',this,${onDone||null})">
          </label>
          ${Avatar.get(uid)?`<button onclick="Avatar._clear('${uid}','${wid}')"
            style="margin-left:.35rem;padding:.38rem .65rem;background:var(--coop-red-lt);color:var(--coop-red);
            border:1px solid var(--coop-red);border-radius:var(--r-sm);font-size:.72rem;cursor:pointer">Remove</button>`:""}
        </div>
      </div>`;
  },

  _upload(uid, wid, input, cb) {
    const file = input.files[0]; if (!file) return;
    if (file.size > 3*1024*1024) { UI.toast("Max 3MB","warning"); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = c.height = 200;
        const ctx = c.getContext("2d");
        const s = Math.min(img.width,img.height);
        ctx.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,200,200);
        const b64 = c.toDataURL("image/jpeg",.85);
        Avatar.save(uid, b64);
        const p = document.getElementById(`${wid}_prev`);
        if (p) p.innerHTML = Avatar.render(uid, null, 60);
        UI.toast("Photo updated ✅","success",2000);
        if (cb) try { cb(b64); } catch {}
        // refresh topbar avatar
        const ub = document.getElementById("sb_avatar");
        if (ub) ub.innerHTML = Avatar.render(uid, null, 34);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },
  _clear(uid, wid) {
    Avatar.remove(uid);
    const p = document.getElementById(`${wid}_prev`);
    if (p) p.innerHTML = Avatar.render(uid, null, 60);
    const ub = document.getElementById("sb_avatar");
    if (ub) ub.innerHTML = Avatar.render(uid, null, 34);
  }
};

// ── App Router ─────────────────────────────────────────────
const App = {
  _cur: null,
  _user: null,

  boot(user) {
    this._user = user;
    document.getElementById("login-page").style.display = "none";
    const shell = document.getElementById("app-shell");
    shell.style.display = "flex"; shell.classList.add("visible");
    this._buildSidebar(user);
    this._buildTopbar(user);
    this._buildBnav(user);
    Sidebar.apply();
    this.go(user.role === "Member" ? "member-dashboard" : "admin-dashboard");
  },

  go(page) {
    const user = this._user || Auth.getUser();
    if (!user) { this._showLogin(); return; }
    // Role guards
    if (page.startsWith("admin-") && user.role === "Member")  { this.go("member-dashboard"); return; }
    if (page.startsWith("member-") && user.role !== "Member") { this.go("admin-dashboard");  return; }

    this._cur = page;
    UI.setActive(page);
    Sidebar.close();

    const el = document.getElementById("page-content");
    el.innerHTML = `<div class="flex-center" style="min-height:300px"><div class="spinner spinner-lg"></div></div>`;
    el.className = "page-content page-enter";

    const fn = Pages[page];
    if (fn) fn(el);
    else el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Page not found: ${page}</p></div>`;
  },

  cur: () => App._cur,

  _showLogin() {
    document.getElementById("app-shell").classList.remove("visible");
    document.getElementById("app-shell").style.display = "none";
    document.getElementById("login-page").style.display = "flex";
  },

  _buildSidebar(user) {
    const isAdmin = ["Admin","BranchManager"].includes(user.role);
    const isMem   = user.role === "Member";
    document.getElementById("sb-nav").innerHTML = isAdmin ? `
      <div class="nav-section">
        <div class="nav-section-label">Overview</div>
        <button class="nav-item" data-page="admin-dashboard"    onclick="App.go('admin-dashboard')"><span class="nav-icon">📊</span><span class="nav-label">Dashboard</span><span class="nav-tooltip">Dashboard</span></button>
      </div>
      <div class="nav-section">
        <div class="nav-section-label">Management</div>
        <button class="nav-item" data-page="admin-members"      onclick="App.go('admin-members')"><span class="nav-icon">👥</span><span class="nav-label">Members</span><span class="nav-tooltip">Members</span></button>
        <button class="nav-item" data-page="admin-loans"        onclick="App.go('admin-loans')"><span class="nav-icon">💰</span><span class="nav-label">Loans</span><span id="loan-badge" class="nav-badge" style="display:none">0</span><span class="nav-tooltip">Loans</span></button>
        <button class="nav-item" data-page="admin-transactions" onclick="App.go('admin-transactions')"><span class="nav-icon">📋</span><span class="nav-label">Transactions</span><span class="nav-tooltip">Transactions</span></button>
        <button class="nav-item" data-page="admin-branches"     onclick="App.go('admin-branches')"><span class="nav-icon">🏢</span><span class="nav-label">Branches</span><span class="nav-tooltip">Branches</span></button>
        <button class="nav-item" data-page="admin-commodities"  onclick="App.go('admin-commodities')"><span class="nav-icon">📦</span><span class="nav-label">Commodities</span><span class="nav-tooltip">Commodities</span></button>
      </div>
      <div class="nav-section">
        <div class="nav-section-label">Reports & Config</div>
        <button class="nav-item" data-page="admin-reports"      onclick="App.go('admin-reports')"><span class="nav-icon">📈</span><span class="nav-label">Reports</span><span class="nav-tooltip">Reports</span></button>
        ${user.role==="Admin"?`
        <button class="nav-item" data-page="admin-settings"     onclick="App.go('admin-settings')"><span class="nav-icon">⚙️</span><span class="nav-label">Settings</span><span class="nav-tooltip">Settings</span></button>
        <button class="nav-item" data-page="admin-audit"        onclick="App.go('admin-audit')"><span class="nav-icon">🔒</span><span class="nav-label">Audit Log</span><span class="nav-tooltip">Audit Log</span></button>`:""}
      </div>
      <div class="nav-section">
        <div class="nav-section-label">Account</div>
        <button class="nav-item" data-page="admin-profile"      onclick="App.go('admin-profile')"><span class="nav-icon">👤</span><span class="nav-label">My Profile</span><span class="nav-tooltip">My Profile</span></button>
      </div>` :
      `<div class="nav-section">
        <div class="nav-section-label">My Account</div>
        <button class="nav-item" data-page="member-dashboard"    onclick="App.go('member-dashboard')"><span class="nav-icon">🏠</span><span class="nav-label">Dashboard</span><span class="nav-tooltip">Dashboard</span></button>
        <button class="nav-item" data-page="member-transactions" onclick="App.go('member-transactions')"><span class="nav-icon">📋</span><span class="nav-label">Transactions</span><span class="nav-tooltip">Transactions</span></button>
        <button class="nav-item" data-page="member-loans"        onclick="App.go('member-loans')"><span class="nav-icon">💰</span><span class="nav-label">My Loan</span><span class="nav-tooltip">My Loan</span></button>
        <button class="nav-item" data-page="member-passbook"     onclick="App.go('member-passbook')"><span class="nav-icon">📖</span><span class="nav-label">Passbook</span><span class="nav-tooltip">Passbook</span></button>
        <button class="nav-item" data-page="member-profile"      onclick="App.go('member-profile')"><span class="nav-icon">👤</span><span class="nav-label">My Profile</span><span class="nav-tooltip">My Profile</span></button>
      </div>`;

    // Loan badge
    if (isAdmin) API.loans.getAll({status:"Pending"}).then(r => {
      const b = document.getElementById("loan-badge");
      if (!b) return;
      b.style.display = r?.data?.length > 0 ? "inline-flex" : "none";
      if (r?.data?.length > 0) b.textContent = r.data.length;
    }).catch(()=>{});

    // User card
    const uc = document.getElementById("sb-user");
    if (uc) uc.innerHTML = `
      <div id="sb_avatar">${Avatar.render(user.userId, user.username, 34)}</div>
      <div class="sb-user-info">
        <div class="sb-uname">${user.username||"User"}</div>
        <div class="sb-urole">${user.role}${user.branchId&&user.branchId!=="ALL"?" · "+user.branchId:""}</div>
      </div>`;

    // Settings button - show for Admins only
    const sb = document.getElementById("sb-settings-btn");
    if (sb) sb.style.display = isAdmin ? "flex" : "none";
  },

  _buildTopbar(user) {
    document.getElementById("topbar-hamburger")?.addEventListener("click", Sidebar.open);
  },

  _buildBnav(user) {
    const bn = document.getElementById("bottom-nav"); if (!bn) return;
    const items = user.role === "Member"
      ? [["member-dashboard","🏠","Home"],["member-transactions","📋","History"],
         ["member-loans","💰","Loan"],["member-passbook","📖","Passbook"],["member-profile","👤","Profile"]]
      : [["admin-dashboard","📊","Home"],["admin-members","👥","Members"],
         ["admin-loans","💰","Loans"],["admin-transactions","📋","Txns"],["admin-reports","📈","Reports"]];
    bn.innerHTML = `<div class="bnav-inner">${
      items.map(([pg,ic,lb]) =>
        `<button class="bnav-item" data-page="${pg}"
           onclick="App.go('${pg}');navigator.vibrate&&navigator.vibrate(8)">
           <span class="bnav-icon">${ic}</span>${lb}
         </button>`
      ).join("")
    }</div>`;
  }
};

// ════════════════════════════════════════════════════════════
// PAGES
// ════════════════════════════════════════════════════════════
const Pages = {};

// ── Helpers ───────────────────────────────────────────────
const $ = id => document.getElementById(id);
const set = (id, html) => { const e=$("page-content"); if(e) e.innerHTML = html; };

// Member profile mini-card shown before posting
async function memberCard(memberId) {
  if (!memberId || memberId.length < 3) return "";
  const res = await API.members.get(memberId);
  if (!res?.success) return `<div class="form-error">❌ Member not found: ${memberId}</div>`;
  const m = res.data;
  const nm = `${m["First Name"]||""} ${m["Last Name"]||""}`.trim();
  return `
    <div class="member-profile-card">
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
        ${Avatar.render(m["UserID"]||memberId, nm, 44)}
        <div style="flex:1">
          <div class="font-bold">${nm}</div>
          <div class="text-muted text-xs">${m["MemberID"]} · Coop: ${m["CoopNo"]||"—"} · ${m["BranchID"]||"—"}</div>
          <div class="text-muted text-xs">${m["Phone"]||"—"}</div>
        </div>
        ${UI.badge(m["Status"]||"Active")}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;font-size:.72rem">
        <div style="background:var(--coop-light);border-radius:7px;padding:.45rem;text-align:center">
          <div class="text-muted">Savings</div>
          <div class="font-bold text-green">${UI.fmt.moneyShort(m["Total Savings (₦)"]||0)}</div>
        </div>
        <div style="background:var(--bg);border-radius:7px;padding:.45rem;text-align:center;border:1px solid var(--border)">
          <div class="text-muted">Join Date</div>
          <div class="font-bold">${UI.fmt.date(m["Join Date"])}</div>
        </div>
        <div style="background:var(--bg);border-radius:7px;padding:.45rem;text-align:center;border:1px solid var(--border)">
          <div class="text-muted">Loan</div>
          <div class="font-bold">${UI.badge(m["Loan Status"]||"None")}</div>
        </div>
      </div>
    </div>`;
}

// Live member lookup input
let _lookupTimer = null;
function memberLookup(inputId, previewId) {
  return `
    <div class="input-wrap">
      <input class="form-control" id="${inputId}" placeholder="Member ID (e.g. MEM001)…"
        style="padding-right:2.5rem"
        oninput="(async()=>{clearTimeout(_lookupTimer);const v=this.value.trim();const p=$(\'${previewId}\');if(!p)return;if(!v||v.length<3){p.innerHTML='';return;}p.innerHTML='<div class=text-muted style=padding:.35rem>Looking up…</div>';_lookupTimer=setTimeout(async()=>{p.innerHTML=await memberCard(v);},500)})()">
      <span class="input-icon-right" style="pointer-events:none">🔍</span>
    </div>
    <div id="${previewId}"></div>`;
}

// ════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════
Pages["admin-dashboard"] = async function() {
  UI.setTitle("Dashboard");
  $("page-content").innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Good day 👋</h1><p>Overview across all branches</p></div>
      <div class="page-header-right">
        <button class="btn btn-primary btn-sm" onclick="Modals.postContribution()">💵 Post Contribution</button>
        <button class="btn btn-secondary btn-sm" onclick="Pages['admin-dashboard']()">🔄 Refresh</button>
      </div>
    </div>
    <div id="stat-cards" class="stats-grid">
      ${[0,1,2,3].map(i=>`<div class="stat-card ${["green","navy","gold","red"][i]}" style="min-height:120px"><div class="skeleton" style="height:100%;border-radius:var(--r-md)"></div></div>`).join("")}
    </div>
    <div class="grid-2 gap-2 mb-2">
      <div class="card" id="pending-card">
        <div class="card-header"><span class="card-title">⏳ Pending Loans</span>
          <button class="btn btn-text btn-sm" onclick="App.go('admin-loans')">View All →</button></div>
        <div class="table-wrap"><table><thead><tr><th>Member</th><th>Amount</th><th>Purpose</th><th>Action</th></tr></thead>
          <tbody id="pending-tbody">${UI.skeleton(3,4)}</tbody></table></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">📊 Branch Overview</span></div>
        <div class="card-body" id="branch-overview"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">🕒 Recent Transactions</span>
        <button class="btn btn-text btn-sm" onclick="App.go('admin-transactions')">View All →</button></div>
      <div class="table-wrap"><table><thead><tr>
        <th>TxnID</th><th>Date</th><th>Member</th><th>Category</th><th>Type</th><th>Amount</th><th>Balance</th>
      </tr></thead><tbody id="recent-tbody">${UI.skeleton(5,7)}</tbody></table></div>
    </div>`;

  const [dash, pending] = await Promise.all([
    API.reports.adminDashboard(),
    API.loans.getAll({status:"Pending"})
  ]);

  if (!dash?.success) { UI.toast("Failed to load dashboard","error"); return; }
  const d = dash.data;

  $("stat-cards").innerHTML = `
    <div class="stat-card green" onclick="App.go('admin-members')" style="cursor:pointer">
      <div class="stat-icon">👥</div>
      <div class="stat-value">${d.totalMembers||0}</div>
      <div class="stat-label">Active Members</div>
    </div>
    <div class="stat-card navy">
      <div class="stat-icon">💵</div>
      <div class="stat-value">${UI.fmt.moneyShort(d.totalSavings||0)}</div>
      <div class="stat-label">Total Savings</div>
    </div>
    <div class="stat-card gold">
      <div class="stat-icon">📋</div>
      <div class="stat-value">${d.activeLoans||0}</div>
      <div class="stat-label">Active Loans</div>
    </div>
    <div class="stat-card red" onclick="App.go('admin-loans')" style="cursor:pointer">
      <div class="stat-icon">⏳</div>
      <div class="stat-value">${d.pendingLoans||0}</div>
      <div class="stat-label">Pending Approvals</div>
    </div>`;

  const pLoans = pending?.data||[];
  $("pending-tbody").innerHTML = pLoans.length === 0
    ? `<tr><td colspan="4" class="text-center text-muted" style="padding:1.5rem">🎉 No pending loans</td></tr>`
    : pLoans.slice(0,5).map(l=>`
      <tr>
        <td><div class="td-bold">${l["MemberID"]}</div></td>
        <td class="font-bold">${UI.fmt.money(l["Principal (₦)"])}</td>
        <td class="text-muted text-xs">${(l["Purpose"]||"—").slice(0,20)}</td>
        <td><button class="btn btn-sm btn-primary" onclick="Modals.reviewLoan('${l["LoanID"]}','approve')">Review</button></td>
      </tr>`).join("");

  $("branch-overview").innerHTML = (d.branchStats||[]).length === 0
    ? `<div class="empty-state" style="padding:1rem"><p>No branches</p></div>`
    : (d.branchStats||[]).map(b=>`
      <div class="flex-between" style="padding:.65rem 0;border-bottom:1px solid var(--border)">
        <div>
          <div class="font-bold" style="font-size:.875rem">${b.name||b.branchId}</div>
          <div class="text-muted text-xs">${b.members} members · ${b.activeLoans} active loans</div>
        </div>
        <button class="btn btn-text btn-sm" onclick="App.go('admin-reports')">View →</button>
      </div>`).join("");

  $("recent-tbody").innerHTML = (d.recentTxns||[]).slice(0,8).map(t=>`
    <tr>
      <td class="td-mono td-muted">${t["TxnID"]||"—"}</td>
      <td>${UI.fmt.date(t["Date"])}</td>
      <td class="td-bold">${t["MemberID"]}</td>
      <td>${t["Category"]}</td>
      <td><span class="badge b-${t["Type"]==="CR"?"green":"red"}">${t["Type"]}</span></td>
      <td class="${t["Type"]==="CR"?"text-green":"text-red"} font-bold">${UI.fmt.money(t["Amount (₦)"])}</td>
      <td class="text-muted">${UI.fmt.money(t["Running Balance (₦)"])}</td>
    </tr>`).join("") || `<tr><td colspan="7" class="text-center text-muted" style="padding:1.5rem">No transactions yet</td></tr>`;
};

// ════════════════════════════════════════════════════════════
// ADMIN MEMBERS
// ════════════════════════════════════════════════════════════
Pages["admin-members"] = async function() {
  UI.setTitle("Members");
  $("page-content").innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Members</h1><p id="mbr-count"></p></div>
      <div class="page-header-right">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Name, ID, phone…" oninput="filterMembers(this.value)">
        </div>
        <select class="form-control" style="width:155px" id="branch-filter" onchange="filterBranch(this.value)">
          <option value="">All Branches</option>
        </select>
        <button class="btn btn-primary" onclick="Modals.addMember()">+ Add Member</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap"><table id="members-table">
        <thead><tr>
          <th>Member</th><th>Coop No</th><th>Phone</th><th>Branch</th>
          <th>Join Date</th><th>Status</th><th>Savings</th><th>Actions</th>
        </tr></thead>
        <tbody id="members-tbody">${UI.skeleton(8,8)}</tbody>
      </table></div>
    </div>`;

  const [mRes, brRes] = await Promise.all([API.members.getAll(), API.branches.getAll()]);
  if (brRes?.data) {
    $("branch-filter").innerHTML = `<option value="">All Branches</option>` +
      brRes.data.map(b=>`<option value="${b["BranchID"]}">${b["Branch Name"]}</option>`).join("");
  }
  window._allMembers = mRes?.data || [];
  $("mbr-count").textContent = `${window._allMembers.length} total members`;
  renderMembers(window._allMembers);
};

function renderMembers(data) {
  const tbody = $("members-tbody"); if (!tbody) return;
  tbody.innerHTML = data.length === 0
    ? `<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">No members found</td></tr>`
    : data.map(m => {
        const nm  = `${m["First Name"]||""} ${m["Last Name"]||""}`.trim();
        const uid = m["UserID"]||m["MemberID"];
        return `<tr>
          <td>
            <div style="display:flex;align-items:center;gap:.6rem">
              ${Avatar.render(uid, nm, 34)}
              <div>
                <div class="td-bold">${nm}</div>
                <div class="td-muted">${m["MemberID"]}</div>
              </div>
            </div>
          </td>
          <td>${m["CoopNo"]||"—"}</td>
          <td>${m["Phone"]||"—"}</td>
          <td>${m["BranchID"]||"—"}</td>
          <td>${UI.fmt.date(m["Join Date"])}</td>
          <td>${UI.badge(m["Status"]||"Active")}</td>
          <td class="text-green font-bold">${UI.fmt.money(m["Total Savings (₦)"]||0)}</td>
          <td>
            <div style="display:flex;gap:.3rem;flex-wrap:wrap">
              <button class="btn btn-sm btn-ghost" onclick="Modals.viewMember('${m["MemberID"]}')">View</button>
              <button class="btn btn-sm btn-primary" onclick="Modals.postContribution('${m["MemberID"]}')">💵 Post</button>
              ${m["Onboarding Status"]==="Pending"
                ?`<button class="btn btn-sm btn-gold" onclick="Modals.approveMember('${m["MemberID"]}')">Approve</button>`:""
              }
            </div>
          </td>
        </tr>`;
      }).join("");
}

window.filterMembers = q => {
  const f = q.toLowerCase();
  renderMembers((window._allMembers||[]).filter(m =>
    [m["First Name"],m["Last Name"],m["MemberID"],m["Phone"],m["CoopNo"]].join(" ").toLowerCase().includes(f)));
};
window.filterBranch = b => renderMembers(b ? (window._allMembers||[]).filter(m=>m["BranchID"]===b) : window._allMembers||[]);

// ════════════════════════════════════════════════════════════
// ADMIN LOANS
// ════════════════════════════════════════════════════════════
Pages["admin-loans"] = async function() {
  UI.setTitle("Loans");
  $("page-content").innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Loan Management</h1><p>Full lifecycle — apply, approve, disburse, repay</p></div>
      <div class="page-header-right">
        <select class="form-control" style="width:150px" id="loan-sf" onchange="filterLoans(this.value)">
          <option value="">All Status</option>
          ${["Pending","Approved","Active","Closed","Rejected"].map(s=>`<option>${s}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr><th>Loan ID</th><th>Member</th><th>Principal</th><th>Total Due</th><th>Repaid</th><th>Outstanding</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody id="loans-tbody">${UI.skeleton(5,9)}</tbody>
      </table></div>
    </div>`;

  const res = await API.loans.getAll();
  window._allLoans = res?.data||[];
  renderLoans(window._allLoans);
};

function renderLoans(data) {
  const tb = $("loans-tbody"); if (!tb) return;
  tb.innerHTML = data.length===0
    ? `<tr><td colspan="9" class="text-center text-muted" style="padding:2rem">No loans</td></tr>`
    : data.map(l => {
        const repaid = Number(l["Total Repaid (₦)"])||0;
        const due    = Number(l["Total Due (₦)"])||0;
        const pct    = due>0?Math.min(100,(repaid/due)*100).toFixed(0):0;
        return `<tr>
          <td class="td-mono td-muted">${l["LoanID"]}</td>
          <td class="td-bold">${l["MemberID"]}</td>
          <td>${UI.fmt.money(l["Principal (₦)"])}</td>
          <td>${UI.fmt.money(due)}</td>
          <td>
            <div>${UI.fmt.money(repaid)}</div>
            <div style="background:var(--border);border-radius:99px;height:4px;width:70px;margin-top:3px">
              <div style="background:var(--coop-green);height:4px;border-radius:99px;width:${pct}%"></div>
            </div>
          </td>
          <td class="${Number(l["Outstanding (₦)"])>0?"text-red":"text-green"} font-bold">
            ${UI.fmt.money(l["Outstanding (₦)"])}</td>
          <td>${UI.badge(l["Status"])}</td>
          <td>${UI.fmt.date(l["Application Date"])}</td>
          <td>
            <div style="display:flex;gap:.3rem;flex-wrap:wrap">
              ${l["Status"]==="Pending"?`
                <button class="btn btn-sm btn-primary" onclick="Modals.reviewLoan('${l["LoanID"]}','approve')">✅</button>
                <button class="btn btn-sm btn-danger"  onclick="Modals.reviewLoan('${l["LoanID"]}','reject')">❌</button>`:""}
              ${l["Status"]==="Approved"?`<button class="btn btn-sm btn-gold" onclick="loanDisburse('${l["LoanID"]}')">💸 Disburse</button>`:""}
              ${l["Status"]==="Active"  ?`<button class="btn btn-sm btn-ghost" onclick="Modals.postRepayment('${l["LoanID"]}','${l["MemberID"]}')">💳 Repay</button>`:""}
            </div>
          </td>
        </tr>`;
      }).join("");
}

window.filterLoans = s => renderLoans(s?(window._allLoans||[]).filter(l=>l["Status"]===s):window._allLoans||[]);
window.loanDisburse = async id => {
  if (!UI.confirm(`Disburse loan ${id}?`)) return;
  const r = await API.loans.disburse(id);
  if (r?.success) { UI.toast(r.message,"success"); Pages["admin-loans"](); }
  else UI.toast(r?.message||"Failed","error");
};

// ════════════════════════════════════════════════════════════
// ADMIN TRANSACTIONS
// ════════════════════════════════════════════════════════════
Pages["admin-transactions"] = async function() {
  UI.setTitle("Transactions");
  $("page-content").innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Transactions</h1></div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="Modals.postContribution()">💵 Post Contribution</button>
        <button class="btn btn-ghost"   onclick="Modals.postTransaction()">+ Manual Entry</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Ledger</span>
        <div style="display:flex;gap:.5rem">
          <select class="form-control" style="width:135px" id="txn-cf" onchange="filterTxns()">
            <option value="">All Categories</option>
            ${["Shares","Savings","Loan","Deposit","Commodity"].map(c=>`<option>${c}</option>`).join("")}
          </select>
          <select class="form-control" style="width:100px" id="txn-tf" onchange="filterTxns()">
            <option value="">CR & DR</option>
            <option value="CR">CR only</option>
            <option value="DR">DR only</option>
          </select>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>TxnID</th><th>Date</th><th>Member</th><th>Category</th><th>Type</th><th>Amount</th><th>Balance</th><th>Proration</th><th>Remark</th></tr></thead>
        <tbody id="txns-tbody">${UI.skeleton(8,9)}</tbody>
      </table></div>
    </div>`;

  const res = await API.transactions.getAll();
  window._allTxns = res?.data||[];
  renderTxns(window._allTxns);
};

function renderTxns(data) {
  const tb = $("txns-tbody"); if (!tb) return;
  tb.innerHTML = data.length===0
    ? `<tr><td colspan="9" class="text-center text-muted" style="padding:2rem">No transactions</td></tr>`
    : data.map(t=>`<tr>
        <td class="td-mono td-muted">${t["TxnID"]||"—"}</td>
        <td>${UI.fmt.date(t["Date"])}</td>
        <td class="td-bold">${t["MemberID"]}</td>
        <td>${t["Category"]}</td>
        <td><span class="badge b-${t["Type"]==="CR"?"green":"red"}">${t["Type"]}</span></td>
        <td class="${t["Type"]==="CR"?"text-green":"text-red"} font-bold">${UI.fmt.money(t["Amount (₦)"])}</td>
        <td class="text-muted">${UI.fmt.money(t["Running Balance (₦)"])}</td>
        <td>${t["Proration Applied"]==="Yes"?`<span class="badge b-gold">${t["Split Type"]}</span>`:"—"}</td>
        <td class="text-muted text-xs">${(t["Remark"]||"").slice(0,35)}</td>
      </tr>`).join("");
}
window.filterTxns = () => {
  const c=$("txn-cf")?.value, t=$("txn-tf")?.value;
  renderTxns((window._allTxns||[]).filter(tx=>(!c||tx["Category"]===c)&&(!t||tx["Type"]===t)));
};

// ════════════════════════════════════════════════════════════
// ADMIN SETTINGS
// ════════════════════════════════════════════════════════════
Pages["admin-settings"] = async function() {
  UI.setTitle("Settings");
  $("page-content").innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Settings</h1><p>Configure all cooperative rules and rates</p></div>
    </div>
    <div class="grid-2 gap-2">
      <div class="card">
        <div class="card-header"><span class="card-title">⚙️ Cooperative Rules</span></div>
        <div class="card-body" id="coop-settings-body">
          <div class="flex-center" style="height:200px"><div class="spinner"></div></div>
        </div>
      </div>
      <div>
        <div class="card mb-2">
          <div class="card-header">
            <span class="card-title">🔗 Apps Script Connection</span>
            <span class="badge b-${API.hasUrl()?"green":"red"}">${API.hasUrl()?"Connected":"Not Set"}</span>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Web App URL (set once, saved permanently)</label>
              <input class="form-control" id="api-url-inp" value="${API.getUrlValue()}"
                placeholder="https://script.google.com/macros/s/…/exec">
              <div class="form-hint">Paste your deployed Apps Script URL. Saved permanently — never needs to be re-entered.</div>
            </div>
            <button class="btn btn-primary" onclick="saveApiUrl()">💾 Save URL</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">🎨 Preferences</span></div>
          <div class="card-body">
            <div class="flex-between">
              <span class="font-bold text-sm">Dark / Light Mode</span>
              <button class="btn btn-secondary btn-sm" onclick="Theme.toggle()">Toggle 🌙/☀️</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  window.saveApiUrl = () => {
    const url = $("api-url-inp")?.value?.trim();
    if (!url) { UI.toast("Paste the Apps Script URL first","warning"); return; }
    API.setUrl(url);
    UI.toast("URL saved permanently ✅ — reloading…","success");
    setTimeout(() => location.reload(), 1500);
  };

  const res = await API.settings.getAll();
  if (!res?.success) {
    $("coop-settings-body").innerHTML = `
      <div class="warning-box">⚠️ Could not load settings — make sure the Apps Script URL is set above.</div>`;
    return;
  }
  const s = res.data;
  const rows = [
    { k:"WEEKLY_CONTRIBUTION",    l:"Default Weekly Contribution (₦)", t:"number", v:s.weeklyContribution||2000, hint:"Members can contribute different amounts — this is just the default" },
    { k:"SAVINGS_PRORATION_PCT",  l:"Savings Proration % (on active loan)", t:"number", v:s.savingsProrationPct||60 },
    { k:"LOAN_REPAY_PRORATE_PCT", l:"Loan Repayment Proration %",      t:"number", v:s.loanRepayPct||40 },
    { k:"ALLOW_MEMBER_OVERRIDE",  l:"Allow Member 100% Loan Override",  t:"select", v:s.allowMemberOverride?"YES":"NO", opts:["YES","NO"] },
    { k:"LOAN_INTEREST_RATE",     l:"Loan Interest Rate (%)",           t:"number", v:s.loanInterestRate||5 },
    { k:"MAX_LOAN_MULTIPLIER",    l:"Max Loan = X × Savings",           t:"number", v:s.maxLoanMultiplier||2 },
    { k:"MIN_MEMBERSHIP_MONTHS",  l:"Min Months Before Loan Eligible",  t:"number", v:s.minMembershipMonths||6 },
    { k:"MAX_GUARANTEES_PER_MBR", l:"Max Guarantees Per Member",        t:"number", v:s.maxGuaranteesPerMember||2 },
    { k:"SESSION_TIMEOUT_MINS",   l:"Session Timeout (minutes)",        t:"number", v:s.sessionTimeoutMins||30 },
  ];
  $("coop-settings-body").innerHTML = `
    ${rows.map(r=>`
      <div class="form-group">
        <label class="form-label">${r.l}</label>
        ${r.t==="select"
          ? `<select class="form-control" id="set_${r.k}">${(r.opts||[]).map(o=>`<option ${o===r.v?"selected":""}>${o}</option>`).join("")}</select>`
          : `<input class="form-control" type="number" id="set_${r.k}" value="${r.v}">`
        }
        ${r.hint?`<div class="form-hint">${r.hint}</div>`:""}
      </div>`).join("")}
    <button class="btn btn-primary w-full" onclick="saveAllSettings()">💾 Save All Settings</button>`;

  window.saveAllSettings = async () => {
    for (const r of rows) {
      const el = $(`set_${r.k}`); if (!el) continue;
      await API.settings.update(r.k, el.value);
    }
    UI.toast("All settings saved ✅","success");
  };
};

// ════════════════════════════════════════════════════════════
// ADMIN BRANCHES
// ════════════════════════════════════════════════════════════
Pages["admin-branches"] = async function() {
  UI.setTitle("Branches");
  $("page-content").innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Branches</h1></div>
      <button class="btn btn-primary" onclick="Modals.addBranch()">+ Add Branch</button>
    </div>
    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Address</th><th>Phone</th><th>Created</th><th>Status</th></tr></thead>
        <tbody id="branches-tbody">${UI.skeleton(3,6)}</tbody>
      </table></div>
    </div>`;
  const res = await API.branches.getAll();
  $("branches-tbody").innerHTML = (res?.data||[]).map(b=>`
    <tr>
      <td class="td-mono td-muted">${b["BranchID"]}</td>
      <td class="td-bold">${b["Branch Name"]}</td>
      <td class="text-muted">${b["Address"]||"—"}</td>
      <td>${b["Phone"]||"—"}</td>
      <td>${UI.fmt.date(b["Date Created"])}</td>
      <td>${UI.badge(b["Status"]||"Active")}</td>
    </tr>`).join("") || `<tr><td colspan="6" class="text-center text-muted" style="padding:2rem">No branches</td></tr>`;
};

// ════════════════════════════════════════════════════════════
// ADMIN COMMODITIES
// ════════════════════════════════════════════════════════════
Pages["admin-commodities"] = async function() {
  UI.setTitle("Commodities");
  $("page-content").innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Commodities</h1></div>
      <button class="btn btn-primary" onclick="Modals.addCommodity()">+ Add Record</button>
    </div>
    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Member</th><th>Item</th><th>Qty</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
        <tbody id="comm-tbody">${UI.skeleton(4,8)}</tbody>
      </table></div>
    </div>`;
  const res = await API.commodities.getAll();
  $("comm-tbody").innerHTML = (res?.data||[]).map(c=>`
    <tr>
      <td class="td-mono td-muted">${c["CommodityID"]}</td>
      <td class="td-bold">${c["MemberID"]}</td>
      <td>${c["Item Description"]}</td>
      <td>${c["Quantity"]||0}</td>
      <td>${UI.fmt.money(c["Total Value (₦)"])}</td>
      <td class="text-green">${UI.fmt.money(c["Amount Paid (₦)"])}</td>
      <td class="text-red">${UI.fmt.money(c["Balance Due (₦)"])}</td>
      <td>${UI.badge(c["Payment Status"])}</td>
    </tr>`).join("") || `<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">No records</td></tr>`;
};

// ════════════════════════════════════════════════════════════
// ADMIN REPORTS
// ════════════════════════════════════════════════════════════
Pages["admin-reports"] = async function() {
  UI.setTitle("Reports");
  $("page-content").innerHTML = `
    <div class="page-header"><div class="page-header-left"><h1>Reports</h1><p>Passbooks and branch summaries</p></div></div>
    <div class="grid-2 gap-2 mb-2">
      <div class="card">
        <div class="card-header"><span class="card-title">📖 Member Passbook</span></div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Member ID</label>
            ${memberLookup("pb-mid","pb-preview")}
          </div>
          <button class="btn btn-primary w-full" onclick="genPassbook($('pb-mid')?.value)">
            📖 Generate Passbook</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">🏢 Branch Report</span></div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Select Branch</label>
            <select class="form-control" id="br-report-sel"><option value="">Select…</option></select>
          </div>
          <button class="btn btn-primary w-full" onclick="genBranchReport()">📊 Generate</button>
        </div>
      </div>
    </div>
    <div id="report-out"></div>`;

  API.branches.getAll().then(r => {
    if (r?.data) $("br-report-sel").innerHTML = `<option value="">Select…</option>` +
      r.data.map(b=>`<option value="${b["BranchID"]}">${b["Branch Name"]}</option>`).join("");
  });
};

window.genPassbook = async function(mid) {
  if (!mid?.trim()) { UI.toast("Enter a Member ID","warning"); return; }
  const res = await API.reports.passbook(mid.trim());
  if (!res?.success) { UI.toast(res?.message||"Failed","error"); return; }
  const d = res.data;
  const cats = ["Shares","Savings","Loan","Deposit","Commodity"];
  $("report-out").innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">📖 ${d.member.name} — Coop No: ${d.member.coopNo}</span>
        <button class="btn btn-sm btn-secondary" onclick="window.print()">🖨️ Print</button>
      </div>
      <div class="card-body">
        <div class="passbook-hdr">
          <div class="passbook-org">Divine Grace Cooperative Multipurpose Society Ltd</div>
          <div class="text-muted text-sm">REG: LSCS 18377 | Branch: ${d.member.branch}</div>
          <div style="margin-top:.5rem;font-size:.875rem">
            <strong>${d.member.name}</strong> | Coop No: ${d.member.coopNo}
            | Joined: ${UI.fmt.date(d.member.joinDate)}
            | Generated: ${UI.fmt.datetime(d.generatedAt)}
          </div>
        </div>
        ${cats.map(cat => {
          const entries = d.passbook[cat]?.entries||[];
          if (!entries.length) return "";
          return `
            <h3 style="font-family:var(--f-display);font-size:1.1rem;margin:1.25rem 0 .5rem;color:var(--text)">${cat}</h3>
            <div class="table-wrap passbook-table">
            <table><thead><tr><th>Date</th><th>CR (₦)</th><th>DR (₦)</th><th>Balance (₦)</th><th>Remark</th></tr></thead>
            <tbody>
              ${entries.map(e=>`<tr>
                <td>${UI.fmt.date(e.date)}</td>
                <td style="color:var(--coop-green);font-weight:600">${e.type==="CR"?UI.fmt.money(e.amount):"—"}</td>
                <td style="color:var(--coop-red);font-weight:600">${e.type==="DR"?UI.fmt.money(e.amount):"—"}</td>
                <td class="font-bold">${UI.fmt.money(e.balance)}</td>
                <td class="text-muted text-xs">${e.remark||"—"}</td>
              </tr>`).join("")}
              <tr style="background:var(--coop-light)">
                <td colspan="3" class="font-bold">Closing Balance</td>
                <td class="font-bold text-green">${UI.fmt.money(d.passbook[cat].balance)}</td>
                <td></td>
              </tr>
            </tbody></table></div>`;
        }).join("")}
      </div>
    </div>`;
};

window.genBranchReport = async function() {
  const id = $("br-report-sel")?.value; if (!id) { UI.toast("Select a branch","warning"); return; }
  const res = await API.reports.branchReport(id);
  if (!res?.success) { UI.toast(res?.message||"Failed","error"); return; }
  const d = res.data;
  $("report-out").innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">${id} — ${d.count} members</span>
        <button class="btn btn-sm btn-secondary" onclick="window.print()">🖨️ Print</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Member</th><th>Shares</th><th>Savings</th><th>Loan</th><th>Deposit</th><th>Loan Status</th></tr></thead>
        <tbody>${d.members.map(m=>`<tr>
          <td><div class="td-bold">${m.name}</div><div class="td-muted">${m.memberId} · #${m.coopNo}</div></td>
          <td>${UI.fmt.money(m.shares)}</td>
          <td class="text-green font-bold">${UI.fmt.money(m.savings)}</td>
          <td class="${m.loan>0?"text-red":""}">${UI.fmt.money(m.loan)}</td>
          <td>${UI.fmt.money(m.deposit)}</td>
          <td>${UI.badge(m.loanStatus)}</td>
        </tr>`).join("")}</tbody>
      </table></div>
    </div>`;
};

// ════════════════════════════════════════════════════════════
// ADMIN AUDIT
// ════════════════════════════════════════════════════════════
Pages["admin-audit"] = async function() {
  UI.setTitle("Audit Log");
  $("page-content").innerHTML = `
    <div class="page-header"><div class="page-header-left"><h1>Audit Log</h1><p>Every action permanently recorded</p></div></div>
    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
        <tbody id="audit-tbody">${UI.skeleton(8,4)}</tbody>
      </table></div>
    </div>`;
  const res = await API.reports.auditLog(100);
  $("audit-tbody").innerHTML = (res?.data||[]).map(a=>`<tr>
    <td class="td-muted text-xs">${a["Timestamp"]||""}</td>
    <td class="td-bold">${a["UserID"]||""}</td>
    <td><span class="badge b-blue">${a["Action"]||""}</span></td>
    <td class="text-muted text-xs">${(a["Details"]||"").slice(0,60)}</td>
  </tr>`).join("") || `<tr><td colspan="4" class="text-center text-muted" style="padding:2rem">No log entries</td></tr>`;
};

// ════════════════════════════════════════════════════════════
// PROFILE
// ════════════════════════════════════════════════════════════
Pages["admin-profile"] = Pages["member-profile"] = async function() {
  const user = App._user || Auth.getUser();
  UI.setTitle("My Profile");
  $("page-content").innerHTML = `
    <div class="page-header"><div class="page-header-left"><h1>My Profile</h1></div></div>
    <div class="grid-2 gap-2">
      <div class="card">
        <div class="card-header"><span class="card-title">👤 Photo & Info</span></div>
        <div class="card-body">
          ${Avatar.uploadWidget(user.userId, user.username)}
          <div class="divider"></div>
          ${[["Username",user.username],["Role",user.role],["Branch",user.branchId||"—"],["Member ID",user.memberId||"—"]]
            .map(([l,v])=>`<div class="form-group"><label class="form-label">${l}</label>
              <div class="form-control" style="background:var(--bg);color:var(--text3)">${v}</div></div>`).join("")}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">🔒 Change Password</span></div>
        <div class="card-body">
          <div class="form-group"><label class="form-label">Current Password</label><input class="form-control" type="password" id="pwd-curr" placeholder="Current password"></div>
          <div class="form-group"><label class="form-label">New Password</label><input class="form-control" type="password" id="pwd-new" placeholder="Min 8 characters"></div>
          <div class="form-group"><label class="form-label">Confirm New Password</label><input class="form-control" type="password" id="pwd-conf" placeholder="Repeat new password"></div>
          <button class="btn btn-primary w-full" onclick="changePwd()">🔒 Change Password</button>
        </div>
      </div>
    </div>`;

  window.changePwd = async () => {
    const c=$("pwd-curr")?.value, n=$("pwd-new")?.value, cf=$("pwd-conf")?.value;
    if (!c||!n||!cf) { UI.toast("Fill all fields","warning"); return; }
    if (n!==cf) { UI.toast("Passwords do not match","error"); return; }
    if (n.length<8) { UI.toast("Min 8 characters","warning"); return; }
    UI.toast("Password change coming soon — contact your admin for now.","info");
  };
};

// ════════════════════════════════════════════════════════════
// MEMBER DASHBOARD
// ════════════════════════════════════════════════════════════
Pages["member-dashboard"] = async function() {
  const user = App._user || Auth.getUser();
  UI.setTitle("My Dashboard");
  $("page-content").innerHTML = `
    <div style="background:linear-gradient(135deg,var(--coop-navy),var(--coop-dark));
         border-radius:var(--r-xl);padding:1.5rem;margin-bottom:1.25rem;color:#fff;position:relative;overflow:hidden">
      <div style="position:absolute;top:-30px;right:-30px;width:150px;height:150px;
           background:rgba(26,122,74,.15);border-radius:50%;pointer-events:none"></div>
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;position:relative">
        ${Avatar.render(user.userId, user.username, 44)}
        <div style="flex:1">
          <div style="font-size:.72rem;color:rgba(255,255,255,.5)">Welcome back</div>
          <div style="font-family:var(--f-display);font-size:1.2rem">${user.username}</div>
          <div style="font-size:.65rem;color:rgba(255,255,255,.4)" id="m-coop"></div>
        </div>
        <button class="btn btn-sm" style="background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2)"
          onclick="App.go('member-profile')">Edit Profile</button>
      </div>
      <div id="m-main-bal" style="position:relative">
        <div style="font-size:.7rem;color:rgba(255,255,255,.45)">SAVINGS BALANCE</div>
        <div style="font-family:var(--f-display);font-size:2.2rem">Loading…</div>
      </div>
    </div>
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)" id="m-cat-cards">
      ${[0,1,2].map(()=>`<div class="stat-card green" style="min-height:90px"><div class="skeleton" style="height:100%;border-radius:var(--r-md)"></div></div>`).join("")}
    </div>
    <div class="grid-2 gap-2">
      <div class="card" id="m-loan-card">
        <div class="card-header"><span class="card-title">💰 Loan</span>
          <button class="btn btn-text btn-sm" onclick="App.go('member-loans')">Manage →</button></div>
        <div class="card-body" id="m-loan-body">
          <div class="flex-center" style="height:60px"><div class="spinner spinner-sm"></div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">📋 Recent Activity</span>
          <button class="btn btn-text btn-sm" onclick="App.go('member-transactions')">All →</button></div>
        <div id="m-recent-txns">
          <div class="flex-center" style="height:60px"><div class="spinner spinner-sm"></div></div>
        </div>
      </div>
    </div>`;

  const res = await API.members.dashboard(user.memberId);
  if (!res?.success) { UI.toast("Failed to load","error"); return; }
  const d = res.data;

  $("m-coop").textContent = `Coop No: ${d.member?.["CoopNo"]||d.member?.coopNo||"—"}`;
  $("m-main-bal").innerHTML = `
    <div style="font-size:.7rem;color:rgba(255,255,255,.45);margin-bottom:.2rem">SAVINGS BALANCE</div>
    <div style="font-family:var(--f-display);font-size:2.2rem">${UI.fmt.money(d.balances?.Savings||0)}</div>
    <div style="font-size:.7rem;color:rgba(255,255,255,.4);margin-top:.15rem">
      Max loan: ${UI.fmt.money((d.balances?.Savings||0)*2)}</div>`;

  $("m-cat-cards").innerHTML = `
    <div class="stat-card navy"><div class="stat-icon">📊</div>
      <div class="stat-value" style="font-size:1.1rem">${UI.fmt.moneyShort(d.balances?.Shares||0)}</div>
      <div class="stat-label">Shares</div></div>
    <div class="stat-card gold"><div class="stat-icon">🏦</div>
      <div class="stat-value" style="font-size:1.1rem">${UI.fmt.moneyShort(d.balances?.Deposit||0)}</div>
      <div class="stat-label">Deposit</div></div>
    <div class="stat-card ${d.activeLoan?"red":"green"}"><div class="stat-icon">💰</div>
      <div class="stat-value" style="font-size:1.1rem">
        ${d.activeLoan?UI.fmt.moneyShort(d.activeLoan["Outstanding (₦)"]||0):"₦0"}</div>
      <div class="stat-label">Loan Due</div></div>`;

  if (d.activeLoan) {
    const l=d.activeLoan, rep=Number(l["Total Repaid (₦)"])||0, due=Number(l["Total Due (₦)"])||1;
    const pct=Math.min(100,(rep/due)*100).toFixed(0);
    $("m-loan-body").innerHTML = `
      <div class="flex-between mb-2"><div><div class="font-bold">${l["LoanID"]}</div>
        <div class="text-muted text-xs">${l["Purpose"]||"—"}</div></div>${UI.badge(l["Status"])}</div>
      <div class="grid-2 gap-1 mb-2 text-sm">
        <div><div class="text-muted text-xs">Total Due</div><div class="font-bold">${UI.fmt.money(due)}</div></div>
        <div><div class="text-muted text-xs">Outstanding</div><div class="font-bold text-red">${UI.fmt.money(l["Outstanding (₦)"])}</div></div>
      </div>
      <div class="progress-track mb-1"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="flex-between text-xs text-muted"><span>${UI.fmt.money(rep)} repaid</span><span>${pct}%</span></div>`;
  } else {
    $("m-loan-body").innerHTML = `
      <div class="empty-state" style="padding:1rem">
        <div class="empty-icon" style="font-size:2rem">✅</div>
        <p>No active loan</p>
        ${d.eligibility?.eligible
          ? `<button class="btn btn-primary btn-sm mt-1" onclick="App.go('member-loans')">Apply for Loan</button>`
          : `<p class="text-xs text-muted mt-1">${d.eligibility?.reasons?.[0]||""}</p>`}
      </div>`;
  }

  const txns = d.recentTxns||[];
  $("m-recent-txns").innerHTML = txns.length===0
    ? `<div class="empty-state" style="padding:1.5rem"><p>No transactions yet</p></div>`
    : txns.map(t=>`
      <div style="display:flex;align-items:center;justify-content:space-between;
           padding:.7rem 1.25rem;border-bottom:1px solid var(--border)">
        <div>
          <div class="font-bold text-sm">${t["Category"]} — ${t["Type"]}</div>
          <div class="text-muted text-xs">${UI.fmt.date(t["Date"])}
            ${t["Proration Applied"]==="Yes"?`<span class="badge b-gold" style="margin-left:.3rem">${t["Split Type"]}</span>`:""}
          </div>
        </div>
        <div class="${t["Type"]==="CR"?"text-green":"text-red"} font-bold">
          ${t["Type"]==="CR"?"+":"−"}${UI.fmt.money(t["Amount (₦)"])}</div>
      </div>`).join("");
};

// ════════════════════════════════════════════════════════════
// MEMBER LOANS
// ════════════════════════════════════════════════════════════
Pages["member-loans"] = async function() {
  const user = App._user || Auth.getUser();
  UI.setTitle("My Loan");
  $("page-content").innerHTML = `<div class="flex-center" style="min-height:300px"><div class="spinner spinner-lg"></div></div>`;
  const res = await API.members.dashboard(user.memberId);
  if (!res?.success) { UI.toast("Failed","error"); return; }
  const d = res.data;
  const elig = d.eligibility;

  if (d.activeLoan) {
    const l=d.activeLoan, rep=Number(l["Total Repaid (₦)"])||0, due=Number(l["Total Due (₦)"])||1;
    const pct=Math.min(100,(rep/due)*100).toFixed(0);
    $("page-content").innerHTML = `
      <div class="page-header"><div class="page-header-left"><h1>My Loan</h1></div>${UI.badge(l["Status"])}</div>
      <div class="card" style="max-width:580px;margin:0 auto">
        <div class="card-header"><span class="card-title">${l["LoanID"]}</span></div>
        <div class="card-body">
          <div class="grid-2 gap-2 mb-3">
            <div style="background:var(--coop-light);border-radius:var(--r-md);padding:1rem;text-align:center">
              <div class="text-muted text-xs mb-1">Principal</div>
              <div style="font-family:var(--f-display);font-size:1.6rem">${UI.fmt.money(l["Principal (₦)"])}</div>
            </div>
            <div style="background:var(--coop-red-lt);border-radius:var(--r-md);padding:1rem;text-align:center">
              <div class="text-muted text-xs mb-1">Outstanding</div>
              <div style="font-family:var(--f-display);font-size:1.6rem;color:var(--coop-red)">${UI.fmt.money(l["Outstanding (₦)"])}</div>
            </div>
          </div>
          <div class="progress-track mb-2" style="height:12px"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="flex-between text-sm text-muted mb-3"><span>${UI.fmt.money(rep)} repaid</span><span>${pct}% complete</span></div>
          <div class="info-box">Your weekly contributions are automatically split — part goes to Savings, part repays this loan. You can ask admin to redirect 100% to the loan.</div>
        </div>
      </div>`;
    return;
  }

  if (!elig.eligible) {
    $("page-content").innerHTML = `
      <div class="page-header"><div class="page-header-left"><h1>Loan Centre</h1></div></div>
      <div class="card" style="max-width:480px;margin:0 auto">
        <div class="card-body text-center">
          <div style="font-size:3.5rem;margin-bottom:.75rem">🔒</div>
          <h3 style="font-family:var(--f-display);margin-bottom:.75rem">Not Yet Eligible</h3>
          ${elig.reasons.map(r=>`<p class="text-red text-sm mb-1">${r}</p>`).join("")}
          <div class="divider"></div>
          <div class="grid-2 gap-1 text-sm">
            <div><div class="text-muted text-xs">Months as Member</div><div class="font-bold">${elig.monthsAsMember||0}</div></div>
            <div><div class="text-muted text-xs">Eligible From</div><div class="font-bold">${UI.fmt.date(elig.loanEligibleDate)}</div></div>
            <div><div class="text-muted text-xs">Savings Balance</div><div class="font-bold text-green">${UI.fmt.money(elig.savingsBalance||0)}</div></div>
            <div><div class="text-muted text-xs">Max When Eligible</div><div class="font-bold">${UI.fmt.money(elig.maxLoanAmount||0)}</div></div>
          </div>
        </div>
      </div>`;
    return;
  }

  $("page-content").innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Apply for Loan</h1></div>
      <span class="badge b-green">✅ Eligible</span>
    </div>
    <div class="card" style="max-width:600px;margin:0 auto">
      <div class="card-header"><span class="card-title">Loan Application</span></div>
      <div class="card-body">
        <div class="info-box">
          Savings: <strong>${UI.fmt.money(elig.savingsBalance||0)}</strong> &nbsp;·&nbsp;
          Max loan: <strong>${UI.fmt.money(elig.maxLoanAmount||0)}</strong>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Loan Amount (₦) *</label>
            <input class="form-control" type="number" id="la-amount" max="${elig.maxLoanAmount||0}"
              placeholder="50000" oninput="previewLoan(this.value,${elig.maxLoanAmount||0})">
          </div>
          <div class="form-group">
            <label class="form-label">Duration *</label>
            <select class="form-control" id="la-duration">
              ${[3,6,9,12].map(m=>`<option value="${m}">${m} months</option>`).join("")}
            </select>
          </div>
        </div>
        <div id="loan-preview"></div>
        <div class="form-group">
          <label class="form-label">Purpose *</label>
          <input class="form-control" id="la-purpose" placeholder="Business capital, School fees…">
        </div>
        <div style="background:var(--bg);border-radius:var(--r-md);padding:1rem;margin-bottom:1rem">
          <div class="font-bold text-sm mb-2">👤 Guarantor 1</div>
          <div class="form-row">
            <div class="form-group mb-0"><label class="form-label">Member ID</label><input class="form-control" id="g1-id" placeholder="MEM002"></div>
            <div class="form-group mb-0"><label class="form-label">Phone</label><input class="form-control" id="g1-ph" placeholder="08012345678"></div>
          </div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r-md);padding:1rem;margin-bottom:1rem">
          <div class="font-bold text-sm mb-2">👤 Guarantor 2</div>
          <div class="form-row">
            <div class="form-group mb-0"><label class="form-label">Member ID</label><input class="form-control" id="g2-id" placeholder="MEM003"></div>
            <div class="form-group mb-0"><label class="form-label">Phone</label><input class="form-control" id="g2-ph" placeholder="08098765432"></div>
          </div>
        </div>
        <button class="btn btn-primary btn-full btn-lg" onclick="submitLoanApp('${user.memberId}','${user.branchId}')">
          Submit Application →</button>
      </div>
    </div>`;
};

window.previewLoan = async (amount, max) => {
  const el = $("loan-preview"); if (!el) return;
  const amt = Number(amount);
  if (!amt) { el.innerHTML=""; return; }
  if (amt > max) { el.innerHTML=`<div class="form-error">Exceeds max ${UI.fmt.money(max)}</div>`; return; }
  const s = await API.settings.getAll();
  const rate = s?.data?.loanInterestRate||5;
  const interest = amt*rate/100;
  el.innerHTML = `
    <div style="background:var(--coop-gold-lt);border:1px solid rgba(245,158,11,.25);border-radius:var(--r-md);padding:.75rem;margin-bottom:.75rem;font-size:.82rem">
      <div class="flex-between"><span>Principal</span><span class="font-bold">${UI.fmt.money(amt)}</span></div>
      <div class="flex-between"><span>Interest (${rate}%)</span><span class="font-bold">${UI.fmt.money(interest)}</span></div>
      <div class="divider" style="margin:.4rem 0"></div>
      <div class="flex-between"><span class="font-bold">Total Due</span><span class="font-bold">${UI.fmt.money(amt+interest)}</span></div>
    </div>`;
};

window.submitLoanApp = async (memberId, branchId) => {
  const data = {
    memberId, branchId,
    amount: Number($("la-amount")?.value)||0,
    purpose: $("la-purpose")?.value?.trim()||"",
    durationMonths: Number($("la-duration")?.value)||6,
    guarantor1MemberId: $("g1-id")?.value?.trim()||"",
    guarantor1Phone:    $("g1-ph")?.value?.trim()||"",
    guarantor1Consent: "YES",
    guarantor2MemberId: $("g2-id")?.value?.trim()||"",
    guarantor2Phone:    $("g2-ph")?.value?.trim()||"",
    guarantor2Consent: "YES",
  };
  if (!data.amount||!data.purpose||!data.guarantor1MemberId||!data.guarantor2MemberId)
    { UI.toast("Fill all required fields","warning"); return; }
  const res = await API.loans.apply(data);
  if (res?.success) { UI.toast("Application submitted! Awaiting admin review ✅","success"); Pages["member-loans"](); }
  else UI.toast(res?.message||"Failed","error");
};

// ════════════════════════════════════════════════════════════
// MEMBER TRANSACTIONS
// ════════════════════════════════════════════════════════════
Pages["member-transactions"] = async function() {
  const user = App._user || Auth.getUser();
  UI.setTitle("Transactions");
  $("page-content").innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Transaction History</h1></div>
      <select class="form-control" style="width:145px" id="mtxn-cat" onchange="filterMemberTxns()">
        <option value="">All Categories</option>
        ${["Shares","Savings","Loan","Deposit","Commodity"].map(c=>`<option>${c}</option>`).join("")}
      </select>
    </div>
    <div class="card" id="mtxn-list">
      <div class="flex-center" style="height:200px"><div class="spinner"></div></div>
    </div>`;

  const res = await API.transactions.getMember(user.memberId, 200);
  window._mTxns = res?.data||[];
  renderMemberTxns(window._mTxns);
};

function renderMemberTxns(data) {
  const el = $("mtxn-list"); if (!el) return;
  el.innerHTML = data.length===0
    ? `<div class="empty-state" style="padding:2rem"><p>No transactions yet</p></div>`
    : data.map(t=>`
      <div style="display:flex;align-items:center;justify-content:space-between;
           padding:.85rem 1.25rem;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:.6rem">
          <div style="width:38px;height:38px;border-radius:50%;flex-shrink:0;
               background:${t["Type"]==="CR"?"var(--coop-light)":"var(--coop-red-lt)"};
               display:flex;align-items:center;justify-content:center;font-size:1rem">
            ${t["Type"]==="CR"?"📈":"📉"}</div>
          <div>
            <div class="font-bold text-sm">${t["Category"]}</div>
            <div class="text-muted text-xs">${UI.fmt.date(t["Date"])}
              ${t["Proration Applied"]==="Yes"?`<span class="badge b-gold" style="margin-left:.3rem">${t["Split Type"]}</span>`:""}
            </div>
          </div>
        </div>
        <div style="text-align:right">
          <div class="${t["Type"]==="CR"?"text-green":"text-red"} font-bold">
            ${t["Type"]==="CR"?"+":"−"}${UI.fmt.money(t["Amount (₦)"])}</div>
          <div class="text-muted text-xs">Bal: ${UI.fmt.money(t["Running Balance (₦)"])}</div>
        </div>
      </div>`).join("");
}
window.filterMemberTxns = () => {
  const c = $("mtxn-cat")?.value;
  renderMemberTxns(c?(window._mTxns||[]).filter(t=>t["Category"]===c):window._mTxns||[]);
};

// ════════════════════════════════════════════════════════════
// MEMBER PASSBOOK
// ════════════════════════════════════════════════════════════
Pages["member-passbook"] = async function() {
  const user = App._user || Auth.getUser();
  UI.setTitle("My Passbook");
  $("page-content").innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>My Passbook</h1></div>
      <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print</button>
    </div>
    <div id="report-out"><div class="flex-center" style="height:200px"><div class="spinner"></div></div></div>`;
  await genPassbook(user.memberId);
};

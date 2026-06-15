// ============================================================
// modals.js — All Modal Dialogs
// ============================================================

const Modals = {};

function buildModal(id, title, body, footer, size="") {
  document.getElementById(id)?.remove();
  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal-backdrop" id="${id}">
      <div class="modal ${size}">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close" onclick="UI.modal('${id}').close()">✕</button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-footer">${footer}</div>
      </div>
    </div>`);
  document.getElementById(id).addEventListener("click", e => { if(e.target.id===id) UI.modal(id).close(); });
  UI.modal(id).open();
}

const cancel = id => `<button class="btn btn-secondary" onclick="UI.modal('${id}').close()">Cancel</button>`;

// ── Post Contribution ─────────────────────────────────────
Modals.postContribution = async function(prefill="") {
  const [settRes, brRes] = await Promise.all([API.settings.getAll(), API.branches.getAll()]);
  const s  = settRes?.data||{};
  const def = s.weeklyContribution||2000;
  const savPct = s.savingsProrationPct||60;
  const lnPct  = s.loanRepayPct||40;
  const allowOv = s.allowMemberOverride!==false;

  buildModal("mod-contrib", "💵 Post Weekly Contribution", `
    <div style="background:var(--coop-light);border:1px solid rgba(26,122,74,.2);border-radius:var(--r-md);padding:.9rem;margin-bottom:1rem;font-size:.82rem">
      <div class="flex-between mb-1">
        <span class="font-bold">Proration Rules</span>
        <button class="btn btn-text btn-sm" onclick="App.go('admin-settings');UI.modal('mod-contrib').close()">Edit →</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;text-align:center">
        <div style="background:var(--surface);border-radius:7px;padding:.4rem">
          <div class="text-muted text-xs">Default</div>
          <div class="font-bold text-green">${UI.fmt.money(def)}</div>
        </div>
        <div style="background:var(--surface);border-radius:7px;padding:.4rem">
          <div class="text-muted text-xs">Savings</div>
          <div class="font-bold">${savPct}%</div>
        </div>
        <div style="background:var(--surface);border-radius:7px;padding:.4rem">
          <div class="text-muted text-xs">Loan Repay</div>
          <div class="font-bold">${lnPct}%</div>
        </div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Member ID / Name *</label>
      <div class="input-wrap">
        <input class="form-control" id="ct-mid" value="${prefill}" placeholder="MEM001…"
          style="padding-right:2.5rem"
          oninput="ctLookup(this.value)">
        <span class="input-icon-right" style="pointer-events:none">🔍</span>
      </div>
      <div id="ct-preview"></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Amount (₦) *<span class="text-muted text-xs"> — editable</span></label>
        <input class="form-control" id="ct-amount" type="number" value="${def}" min="1"
          oninput="ctPreview()">
        <div class="form-hint">Default: ${UI.fmt.money(def)}</div>
      </div>
      <div class="form-group">
        <label class="form-label">Date *</label>
        <input class="form-control" id="ct-date" type="date" value="${new Date().toISOString().split("T")[0]}">
      </div>
    </div>
    <div id="ct-proration-preview"></div>
    ${allowOv?`<div id="ct-override-wrap" style="display:none">
      <div style="background:var(--coop-gold-lt);border:1px solid rgba(245,158,11,.25);border-radius:var(--r-md);padding:.9rem">
        <label style="display:flex;align-items:flex-start;gap:.65rem;cursor:pointer">
          <input type="checkbox" id="ct-override" style="width:16px;height:16px;margin-top:2px" onchange="ctPreview()">
          <div>
            <div class="font-bold text-sm">Override: 100% to Loan Repayment</div>
            <div class="text-muted text-xs mt-1">Redirect entire contribution to clear the loan balance faster.</div>
          </div>
        </label>
      </div>
    </div>`:""}`,
    `${cancel("mod-contrib")}
     <button class="btn btn-primary" id="ct-submit" onclick="Modals.submitContrib()">✅ Post Contribution</button>`
  );
  window._ctMember = null; window._ctLoan = null;
  if (prefill) setTimeout(()=>ctLookup(prefill), 300);
};

window._ctTimer = null;
window.ctLookup = async function(val) {
  clearTimeout(window._ctTimer);
  const prev = document.getElementById("ct-preview");
  const ow   = document.getElementById("ct-override-wrap");
  if (!prev) return;
  if (!val||val.length<3) { prev.innerHTML=""; window._ctMember=null; ctPreview(); return; }
  prev.innerHTML = `<div class="text-muted text-xs" style="padding:.35rem 0;display:flex;align-items:center;gap:.4rem"><div class="spinner spinner-sm"></div> Looking up…</div>`;
  window._ctTimer = setTimeout(async () => {
    const mRes = await API.members.get(val.trim());
    if (!mRes?.success) { prev.innerHTML=`<div class="form-error">Member not found</div>`; return; }
    const m = mRes.data;
    window._ctMember = m;
    // Check active loan
    const lRes = await API.loans.getAll({memberId:m["MemberID"]});
    const loan = (lRes?.data||[]).find(l=>["Pending","Approved","Active"].includes(l["Status"]));
    window._ctLoan = loan||null;
    const nm = `${m["First Name"]||""} ${m["Last Name"]||""}`.trim();
    prev.innerHTML = `
      <div class="member-profile-card">
        <div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.65rem">
          ${Avatar.render(m["UserID"]||m["MemberID"], nm, 40)}
          <div style="flex:1">
            <div class="font-bold">${nm}</div>
            <div class="text-muted text-xs">${m["MemberID"]} · ${m["BranchID"]||"—"} · ${m["Phone"]||"—"}</div>
          </div>${UI.badge(m["Status"]||"Active")}
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem;font-size:.72rem">
          <div style="background:var(--coop-light);border-radius:6px;padding:.4rem;text-align:center">
            <div class="text-muted">Savings</div>
            <div class="font-bold text-green">${UI.fmt.moneyShort(m["Total Savings (₦)"]||0)}</div>
          </div>
          <div style="background:${loan?"var(--coop-gold-lt)":"var(--coop-light)"};border-radius:6px;padding:.4rem;text-align:center">
            <div class="text-muted">Active Loan</div>
            <div class="font-bold" style="color:${loan?"var(--coop-gold)":"var(--coop-green)"}">
              ${loan?UI.fmt.moneyShort(loan["Outstanding (₦)"]||0):"None"}</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:.4rem;text-align:center">
            <div class="text-muted">Coop No</div>
            <div class="font-bold">${m["CoopNo"]||"—"}</div>
          </div>
        </div>
        ${loan?`<div style="margin-top:.5rem;font-size:.7rem;color:var(--coop-gold);font-weight:600">⚠️ Active loan — contribution will be prorated automatically</div>`:""}
      </div>`;
    if (ow) ow.style.display = loan ? "block" : "none";
    ctPreview();
  }, 450);
};

window.ctPreview = async function() {
  const el  = document.getElementById("ct-proration-preview"); if (!el) return;
  const amt = Number(document.getElementById("ct-amount")?.value)||0;
  const ov  = document.getElementById("ct-override")?.checked||false;
  const loan = window._ctLoan;
  if (!amt) { el.innerHTML=""; return; }
  const s = await API.settings.getAll();
  const savPct = s?.data?.savingsProrationPct||60;
  const lnPct  = s?.data?.loanRepayPct||40;
  if (!loan) {
    el.innerHTML = `<div style="background:var(--coop-light);border:1px solid rgba(26,122,74,.2);border-radius:var(--r-md);padding:.75rem;margin-bottom:.65rem;font-size:.82rem">
      <div class="font-bold mb-1">💡 Split Preview</div>
      <div class="flex-between"><span>→ Savings (100%)</span><span class="font-bold text-green">${UI.fmt.money(amt)}</span></div>
      <div class="text-muted text-xs mt-1">No active loan — full amount goes to Savings</div>
    </div>`;
  } else if (ov) {
    el.innerHTML = `<div style="background:var(--coop-gold-lt);border:1px solid rgba(245,158,11,.25);border-radius:var(--r-md);padding:.75rem;margin-bottom:.65rem;font-size:.82rem">
      <div class="font-bold mb-1">💡 Override Split Preview</div>
      <div class="flex-between"><span>→ Loan Repayment (100%)</span><span class="font-bold" style="color:var(--coop-gold)">${UI.fmt.money(amt)}</span></div>
    </div>`;
  } else {
    const sav = Math.round(amt*savPct/100), ln = amt-sav;
    el.innerHTML = `<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--r-md);padding:.75rem;margin-bottom:.65rem;font-size:.82rem">
      <div class="flex-between mb-2"><span class="font-bold">💡 Proration Split Preview</span><span class="badge b-gold">Active Loan</span></div>
      <div class="flex-between mb-1"><span>→ Savings (${savPct}%)</span><span class="font-bold text-green">${UI.fmt.money(sav)}</span></div>
      <div class="flex-between"><span>→ Loan Repayment (${lnPct}%)</span><span class="font-bold text-red">${UI.fmt.money(ln)}</span></div>
      <div class="divider" style="margin:.5rem 0"></div>
      <div class="flex-between"><span class="font-bold">Total</span><span class="font-bold">${UI.fmt.money(amt)}</span></div>
    </div>`;
  }
};

Modals.submitContrib = async function() {
  const mid = document.getElementById("ct-mid")?.value?.trim();
  const amt = Number(document.getElementById("ct-amount")?.value);
  const dt  = document.getElementById("ct-date")?.value;
  const ov  = document.getElementById("ct-override")?.checked||false;
  if (!mid||!amt) { UI.toast("Member ID and amount required","warning"); return; }
  if (!window._ctMember) { UI.toast("Confirm member is loaded first","warning"); return; }
  if (window._ctMember["Status"]!=="Active") { UI.toast("Member is not active","error"); return; }
  const btn = document.getElementById("ct-submit");
  btn.disabled=true; btn.textContent="Posting…";
  const res = await API.transactions.postContribution({
    memberId:mid, branchId:window._ctMember["BranchID"],
    amount:amt, date:dt, overrideToLoan:ov
  });
  btn.disabled=false; btn.textContent="✅ Post Contribution";
  if (res?.success) {
    UI.toast(res.message||"Posted ✅","success");
    UI.modal("mod-contrib").close();
    window._ctMember=null; window._ctLoan=null;
    if (["admin-transactions","admin-dashboard"].includes(App.cur())) Pages[App.cur()]();
  } else UI.toast(res?.message||"Failed","error");
};

// ── Add Member ────────────────────────────────────────────
Modals.addMember = async function() {
  const brRes = await API.branches.getAll();
  const bOpts = (brRes?.data||[]).map(b=>`<option value="${b["BranchID"]}">${b["Branch Name"]}</option>`).join("");
  buildModal("mod-add-mbr","➕ Onboard New Member",`
    <div class="form-row">
      <div class="form-group"><label class="form-label">First Name *</label><input class="form-control" id="am-fn" placeholder="Grace"></div>
      <div class="form-group"><label class="form-label">Last Name *</label><input class="form-control" id="am-ln" placeholder="Odunuga"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Phone *</label><input class="form-control" id="am-ph" placeholder="08012345678"></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="am-em" type="email" placeholder="grace@email.com"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Branch *</label><select class="form-control" id="am-br"><option value="">Select…</option>${bOpts}</select></div>
      <div class="form-group"><label class="form-label">Join Date *</label><input class="form-control" id="am-jd" type="date" value="${new Date().toISOString().split("T")[0]}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Date of Birth</label><input class="form-control" id="am-dob" type="date"></div>
      <div class="form-group"><label class="form-label">Gender</label><select class="form-control" id="am-gnd"><option value="">—</option><option value="M">Male</option><option value="F">Female</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Residential Address</label><input class="form-control" id="am-addr" placeholder="12 Coop Road, Lagos"></div>
    <div class="form-group"><label class="form-label">Occupation</label><input class="form-control" id="am-occ" placeholder="Teacher, Engineer…"></div>
    <div class="divider"></div>
    <div class="font-bold text-sm mb-2">Next of Kin</div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">NOK Name</label><input class="form-control" id="am-nkn"></div>
      <div class="form-group"><label class="form-label">NOK Phone</label><input class="form-control" id="am-nkp"></div>
    </div>
    <div class="form-group"><label class="form-label">Relationship</label><input class="form-control" id="am-nkr" placeholder="Spouse, Parent…"></div>
    <div class="divider"></div>
    <div class="font-bold text-sm mb-2">Identity Verification</div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">ID Type *</label><select class="form-control" id="am-idt"><option value="">Select…</option>${["NIN","BVN","Voter Card","Passport"].map(t=>`<option>${t}</option>`).join("")}</select></div>
      <div class="form-group"><label class="form-label">ID Number *</label><input class="form-control" id="am-idn" placeholder="12345678901"></div>
    </div>
    <div class="form-group"><label class="form-label">Notes</label><input class="form-control" id="am-notes" placeholder="Optional…"></div>`,
    `${cancel("mod-add-mbr")}<button class="btn btn-primary" id="am-submit" onclick="Modals.submitAddMember()">➕ Onboard</button>`,
    "modal-lg");
};

Modals.submitAddMember = async function() {
  const g = id => document.getElementById(id)?.value?.trim()||"";
  const d = { firstName:g("am-fn"),lastName:g("am-ln"),phone:g("am-ph"),email:g("am-em"),
    branchId:g("am-br"),joinDate:g("am-jd"),dob:g("am-dob"),gender:g("am-gnd"),
    address:g("am-addr"),occupation:g("am-occ"),nokName:g("am-nkn"),nokPhone:g("am-nkp"),
    nokRelationship:g("am-nkr"),idType:g("am-idt"),idNumber:g("am-idn"),notes:g("am-notes") };
  const req = ["firstName","lastName","phone","branchId","idType","idNumber"];
  for (const r of req) { if (!d[r]) { UI.toast("Required: "+r,"warning"); return; } }
  const btn=document.getElementById("am-submit"); btn.disabled=true; btn.textContent="Saving…";
  const res = await API.members.add(d);
  btn.disabled=false; btn.textContent="➕ Onboard";
  if (res?.success) {
    UI.toast(`Member added! ID: ${res.data.memberId} · Coop: ${res.data.coopNo} · Login: ${res.data.username}/${res.data.defaultPassword||"Welcome@1234"}`,"success",7000);
    UI.modal("mod-add-mbr").close();
    Pages["admin-members"]();
  } else UI.toast(res?.message||"Failed","error");
};

// ── View Member ───────────────────────────────────────────
Modals.viewMember = async function(mid) {
  buildModal("mod-view-mbr","👤 Member Details",
    `<div class="flex-center" style="height:150px"><div class="spinner"></div></div>`,
    `${cancel("mod-view-mbr")}
     <button class="btn btn-primary" onclick="Modals.postContribution('${mid}');UI.modal('mod-view-mbr').close()">💵 Post Contribution</button>`,
    "modal-lg");
  const res = await API.members.get(mid);
  if (!res?.success) { UI.toast("Failed","error"); return; }
  const m = res.data;
  const nm = `${m["First Name"]||""} ${m["Last Name"]||""}`.trim();
  document.querySelector("#mod-view-mbr .modal-body").innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem">
      ${Avatar.render(m["UserID"]||mid, nm, 60)}
      <div>
        <div style="font-family:var(--f-display);font-size:1.3rem">${nm}</div>
        <div class="text-muted text-sm">${m["MemberID"]} · Coop: ${m["CoopNo"]||"—"}</div>
        <div style="margin-top:.3rem">${UI.badge(m["Status"]||"Active")}</div>
      </div>
    </div>
    <div class="grid-2 gap-1 text-sm mb-2">
      ${[["Phone",m["Phone"]],["Email",m["Email"]||"—"],["Branch",m["BranchID"]],["Join Date",UI.fmt.date(m["Join Date"])],
         ["ID Type",m["ID Type"]||"—"],["ID Number",m["ID Number"]||"—"],["Occupation",m["Occupation"]||"—"],["Next of Kin",m["Next of Kin"]||"—"]]
        .map(([l,v])=>`<div><div class="text-muted text-xs">${l}</div><div class="font-bold">${v||"—"}</div></div>`).join("")}
    </div>
    <div class="divider"></div>
    <div class="grid-2 gap-1 text-sm">
      <div><div class="text-muted text-xs">Onboarding</div>${UI.badge(m["Onboarding Status"]||"Active")}</div>
      <div><div class="text-muted text-xs">Loan Status</div>${UI.badge(m["Loan Status"]||"None")}</div>
      <div><div class="text-muted text-xs">Total Savings</div><div class="font-bold text-green">${UI.fmt.money(m["Total Savings (₦)"]||0)}</div></div>
      <div><div class="text-muted text-xs">Max Loan</div><div class="font-bold">${UI.fmt.money(m["Max Loan (₦)"]||0)}</div></div>
    </div>`;
};

// ── Approve Member ────────────────────────────────────────
Modals.approveMember = async function(mid) {
  const card = await memberCard(mid);
  buildModal("mod-approve","✅ Approve Member",
    `${card}<p class="text-sm text-muted mt-2">This will activate the member and create their login credentials.</p>`,
    `${cancel("mod-approve")}<button class="btn btn-primary" onclick="Modals.confirmApprove('${mid}')">✅ Approve</button>`);
};
Modals.confirmApprove = async function(mid) {
  const res = await API.members.approve(mid);
  if (res?.success) { UI.toast("Member approved ✅","success"); UI.modal("mod-approve").close(); Pages["admin-members"](); }
  else UI.toast(res?.message||"Failed","error");
};

// ── Loan Review ───────────────────────────────────────────
Modals.reviewLoan = async function(loanId, action) {
  buildModal("mod-review-loan",
    `${action==="approve"?"✅ Approve":"❌ Reject"} Loan — ${loanId}`,
    `<div class="flex-center" style="height:150px"><div class="spinner"></div></div>`,
    `${cancel("mod-review-loan")}
     <button class="btn ${action==="approve"?"btn-primary":"btn-danger"}" id="loan-action-btn"
       onclick="Modals.confirmLoanAction('${loanId}','${action}')">
       ${action==="approve"?"✅ Approve Loan":"❌ Reject Loan"}</button>`);

  const [lRes, gRes] = await Promise.all([API.loans.getAll(), API.loans.getGuarantors(loanId)]);
  const loan = (lRes?.data||[]).find(l=>l["LoanID"]===loanId);
  if (!loan) return;
  const guars = gRes?.data||[];
  const card  = await memberCard(loan["MemberID"]);

  document.querySelector("#mod-review-loan .modal-body").innerHTML = `
    ${card}
    <div style="background:var(--bg);border-radius:var(--r-md);padding:.9rem;margin-bottom:.9rem">
      <div class="grid-2 gap-1 text-sm">
        ${[["Amount",UI.fmt.money(loan["Principal (₦)"])],["Interest",`${loan["Interest Rate (%)"]||0}% = ${UI.fmt.money(loan["Interest Amt (₦)"]||0)}`],
           ["Total Due",UI.fmt.money(loan["Total Due (₦)"])],["Purpose",loan["Purpose"]||"—"],["Duration",`${loan["Duration (Months)"]||0} months`]]
          .map(([l,v])=>`<div><div class="text-muted text-xs">${l}</div><div class="font-bold text-sm">${v}</div></div>`).join("")}
      </div>
    </div>
    <div class="font-bold text-sm mb-2">🤝 Guarantors</div>
    ${guars.length===0?`<p class="text-muted text-sm">No guarantors found.</p>`:
      guars.map(g=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:.55rem 0;border-bottom:1px solid var(--border)">
          <div>
            <div class="font-bold text-sm">${g["Guarantor Name"]||g["Guarantor MemberID"]}</div>
            <div class="text-muted text-xs">${g["Guarantor Phone"]||""}</div>
          </div>
          <div style="display:flex;align-items:center;gap:.4rem">
            ${UI.badge(g["Verification Status"])}
            ${g["Verification Status"]!=="Verified"
              ?`<button class="btn btn-sm btn-primary" onclick="verifyGuar('${g["GuarantorID"]}','${loanId}','${action}')">Verify</button>`:""}
          </div>
        </div>`).join("")}
    ${action==="reject"?`<div class="form-group mt-2"><label class="form-label">Reason for Rejection *</label><input class="form-control" id="reject-reason" placeholder="State reason clearly…"></div>`:""}`;
};

window.verifyGuar = async (gId, loanId, action) => {
  const res = await API.loans.verifyGuarantor(gId);
  if (res?.success) { UI.toast("Guarantor verified ✅","success"); Modals.reviewLoan(loanId, action); }
  else UI.toast(res?.message||"Failed","error");
};

Modals.confirmLoanAction = async function(loanId, action) {
  let res;
  if (action==="approve") res = await API.loans.approve(loanId);
  else {
    const r = document.getElementById("reject-reason")?.value?.trim();
    if (!r) { UI.toast("Provide a rejection reason","warning"); return; }
    res = await API.loans.reject(loanId, r);
  }
  if (res?.success) {
    UI.toast(res.message,"success");
    UI.modal("mod-review-loan").close();
    Pages["admin-loans"]();
  } else UI.toast(res?.message||"Failed","error");
};

// ── Post Repayment ────────────────────────────────────────
Modals.postRepayment = async function(loanId, memberId) {
  const card = await memberCard(memberId);
  buildModal("mod-repay","💳 Post Loan Repayment",`
    ${card}
    <div class="form-row">
      <div class="form-group"><label class="form-label">Amount (₦) *</label><input class="form-control" id="rp-amt" type="number" placeholder="0.00"></div>
      <div class="form-group"><label class="form-label">Date *</label><input class="form-control" id="rp-date" type="date" value="${new Date().toISOString().split("T")[0]}"></div>
    </div>`,
    `${cancel("mod-repay")}
     <button class="btn btn-primary" onclick="Modals.submitRepayment('${loanId}','${memberId}')">💳 Post</button>`);
};
Modals.submitRepayment = async function(loanId, memberId) {
  const amt = Number(document.getElementById("rp-amt")?.value);
  const dt  = document.getElementById("rp-date")?.value;
  if (!amt) { UI.toast("Enter amount","warning"); return; }
  const res = await API.loans.repay({ loanId, memberId, amount:amt, date:dt });
  if (res?.success) { UI.toast(res.message||"Posted ✅","success"); UI.modal("mod-repay").close(); Pages["admin-loans"](); }
  else UI.toast(res?.message||"Failed","error");
};

// ── Manual Transaction ────────────────────────────────────
Modals.postTransaction = function() {
  buildModal("mod-txn","📋 Post Manual Transaction",`
    <div class="form-group">
      <label class="form-label">Member ID *</label>
      <div class="input-wrap">
        <input class="form-control" id="txn-mid" placeholder="MEM001…"
          style="padding-right:2.5rem" oninput="ctLookup(this.value);document.getElementById('ct-preview')&&(document.getElementById('ct-preview').id='txn-preview')">
        <span class="input-icon-right" style="pointer-events:none">🔍</span>
      </div>
      <div id="ct-preview"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Category *</label>
        <select class="form-control" id="txn-cat">${["Shares","Savings","Loan","Deposit","Commodity"].map(c=>`<option>${c}</option>`).join("")}</select></div>
      <div class="form-group"><label class="form-label">Type *</label>
        <select class="form-control" id="txn-type"><option value="CR">CR — Credit (in)</option><option value="DR">DR — Debit (out)</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Amount (₦) *</label><input class="form-control" id="txn-amt" type="number" placeholder="0.00"></div>
      <div class="form-group"><label class="form-label">Date *</label><input class="form-control" id="txn-dt" type="date" value="${new Date().toISOString().split("T")[0]}"></div>
    </div>
    <div class="form-group"><label class="form-label">Remark</label><input class="form-control" id="txn-rem" placeholder="Optional…"></div>`,
    `${cancel("mod-txn")}<button class="btn btn-primary" onclick="Modals.submitTxn()">Post</button>`);
};
Modals.submitTxn = async function() {
  const mid = document.getElementById("txn-mid")?.value?.trim();
  const amt = Number(document.getElementById("txn-amt")?.value);
  if (!mid||!amt) { UI.toast("Member ID and amount required","warning"); return; }
  if (!window._ctMember) { UI.toast("Member not found","error"); return; }
  const res = await API.transactions.post({
    memberId:mid, branchId:window._ctMember["BranchID"],
    category:document.getElementById("txn-cat")?.value,
    type:document.getElementById("txn-type")?.value,
    amount:amt, date:document.getElementById("txn-dt")?.value,
    remark:document.getElementById("txn-rem")?.value?.trim()
  });
  if (res?.success) { UI.toast("Posted ✅","success"); UI.modal("mod-txn").close(); if(App.cur()==="admin-transactions")Pages["admin-transactions"](); }
  else UI.toast(res?.message||"Failed","error");
};

// ── Add Branch ────────────────────────────────────────────
Modals.addBranch = function() {
  buildModal("mod-branch","🏢 Add Branch",`
    <div class="form-group"><label class="form-label">Branch Name *</label><input class="form-control" id="br-name" placeholder="e.g. Ibadan Branch"></div>
    <div class="form-group"><label class="form-label">Address</label><input class="form-control" id="br-addr" placeholder="123 Main Street, City"></div>
    <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="br-ph" placeholder="08012345678"></div>`,
    `${cancel("mod-branch")}<button class="btn btn-primary" onclick="Modals.submitBranch()">Add Branch</button>`);
};
Modals.submitBranch = async function() {
  const nm = document.getElementById("br-name")?.value?.trim();
  if (!nm) { UI.toast("Name required","warning"); return; }
  const res = await API.branches.add({ branchName:nm, address:document.getElementById("br-addr")?.value?.trim(), phone:document.getElementById("br-ph")?.value?.trim() });
  if (res?.success) { UI.toast("Branch added ✅","success"); UI.modal("mod-branch").close(); Pages["admin-branches"](); }
  else UI.toast(res?.message||"Failed","error");
};

// ── Add Commodity ─────────────────────────────────────────
Modals.addCommodity = async function() {
  const brRes = await API.branches.getAll();
  const bOpts = (brRes?.data||[]).map(b=>`<option value="${b["BranchID"]}">${b["Branch Name"]}</option>`).join("");
  buildModal("mod-commod","📦 Add Commodity",`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Member ID *</label>
        <input class="form-control" id="cm-mid" placeholder="MEM001" oninput="ctLookup(this.value)">
        <div id="ct-preview"></div></div>
      <div class="form-group"><label class="form-label">Branch *</label>
        <select class="form-control" id="cm-br"><option value="">Select…</option>${bOpts}</select></div>
    </div>
    <div class="form-group"><label class="form-label">Item Description *</label><input class="form-control" id="cm-item" placeholder="Rice (50kg bag)"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Quantity *</label><input class="form-control" id="cm-qty" type="number" value="1" min="1" oninput="cmPreview()"></div>
      <div class="form-group"><label class="form-label">Unit Price (₦) *</label><input class="form-control" id="cm-price" type="number" placeholder="0.00" oninput="cmPreview()"></div>
    </div>
    <div class="form-group"><label class="form-label">Remark</label><input class="form-control" id="cm-rem" placeholder="Optional note"></div>
    <div id="cm-preview" class="warning-box" style="display:none;margin-bottom:1rem"></div>`,
    `${cancel("mod-commod")}<button class="btn btn-primary" onclick="Modals.submitCommodity()">Add Item</button>`);
};

Modals.submitCommodity = async function() {
  const mid = document.getElementById("cm-mid")?.value?.trim();
  const br = document.getElementById("cm-br")?.value;
  const item = document.getElementById("cm-item")?.value?.trim();
  const qty = parseInt(document.getElementById("cm-qty")?.value);
  const price = parseFloat(document.getElementById("cm-price")?.value);
  if (!mid || !item || !qty || !price || !br) { UI.toast("All * fields required","warning"); return; }
  const res = await API.commodities.add({memberId:mid, branchId:br, item, qty, price, remark:document.getElementById("cm-rem")?.value?.trim()});
  if (res?.success) { UI.toast("Commodity added ✅","success"); UI.modal("mod-commod").close(); if(App.cur()==="admin-commodities")Pages["admin-commodities"](); }
  else UI.toast(res?.message||"Failed","error");
};

// ── Login Settings Modal ──────────────────────────────────
Modals.loginSettings = function() {
  buildModal("login-settings-modal","⚙️ Backend Configuration",`
    <div class="form-group">
      <label class="form-label">Google Apps Script URL</label>
      <input class="form-control" id="login-backend-url" value="${API.getUrlValue()}"
        placeholder="https://script.google.com/macros/s/…/exec">
      <div class="form-hint">Paste your deployed Google Apps Script Web App URL</div>
    </div>
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--r-md);padding:1rem;margin-bottom:1rem;font-size:.85rem">
      <div class="flex-between mb-1"><span class="font-bold">Backend Status</span><span id="backend-status-badge" class="badge b-red">Checking…</span></div>
      <div id="backend-status-text" style="color:var(--text4);margin-top:.5rem">Testing connection…</div>
    </div>`,
    `<button class="btn btn-secondary" onclick="UI.modal('login-settings-modal').close()">Close</button><button class="btn btn-primary" onclick="Modals.saveLoginBackendUrl()">💾 Save & Test</button>`);
  
  // Test connection
  API.test().then(res => {
    const badge = document.getElementById("backend-status-badge");
    const text = document.getElementById("backend-status-text");
    if (res?.success) {
      badge.className = "badge b-green";
      badge.textContent = "✅ Connected";
      text.textContent = "Backend is reachable and responding correctly.";
    } else {
      badge.className = "badge b-red";
      badge.textContent = "❌ Disconnected";
      text.textContent = "Backend URL not set or unreachable. Please enter the URL and try again.";
    }
  }).catch(() => {
    const badge = document.getElementById("backend-status-badge");
    const text = document.getElementById("backend-status-text");
    badge.className = "badge b-red";
    badge.textContent = "❌ Error";
    text.textContent = "Could not reach backend. Check URL and try again.";
  });
};

Modals.saveLoginBackendUrl = function() {
  const url = document.getElementById("login-backend-url")?.value?.trim();
  if (!url) {
    UI.toast("Please paste the Apps Script URL","warning");
    return;
  }
  API.setUrl(url);
  UI.toast("Backend URL saved ✅","success");
  setTimeout(() => {
    UI.modal("login-settings-modal").close();
    // Test again
    API.test().then(res => {
      if (res?.success) {
        UI.toast("✅ Connected to backend!","success");
      } else {
        UI.toast("⚠️ URL saved but not responding. Please verify.","warning");
      }
    });
  }, 500);
};
    </div>
    <div id="cm-preview"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Amount Paid (₦)</label><input class="form-control" id="cm-paid" type="number" value="0"></div>
      <div class="form-group"><label class="form-label">Date Issued</label><input class="form-control" id="cm-date" type="date" value="${new Date().toISOString().split("T")[0]}"></div>
    </div>`,
    `${cancel("mod-commod")}<button class="btn btn-primary" onclick="Modals.submitCommodity()">Add</button>`);

  window.cmPreview = () => {
    const qty=Number(document.getElementById("cm-qty")?.value)||0;
    const price=Number(document.getElementById("cm-price")?.value)||0;
    const total=qty*price; const el=document.getElementById("cm-preview");
    if(el&&total>0) el.innerHTML=`<div style="background:var(--coop-gold-lt);border:1px solid rgba(245,158,11,.25);border-radius:var(--r-md);padding:.65rem;margin-bottom:.65rem;font-size:.82rem"><div class="flex-between"><span class="font-bold">Total Value</span><span class="font-bold" style="color:var(--coop-gold)">${UI.fmt.money(total)}</span></div></div>`;
  };
};
Modals.submitCommodity = async function() {
  const mid=document.getElementById("cm-mid")?.value?.trim(), br=document.getElementById("cm-br")?.value, item=document.getElementById("cm-item")?.value?.trim();
  if(!mid||!br||!item){UI.toast("Fill required fields","warning");return;}
  const res=await API.commodities.add({ memberId:mid,branchId:br,item,quantity:Number(document.getElementById("cm-qty")?.value),unitPrice:Number(document.getElementById("cm-price")?.value),amountPaid:Number(document.getElementById("cm-paid")?.value)||0,dateIssued:document.getElementById("cm-date")?.value });
  if(res?.success){UI.toast(`Added — Total: ${UI.fmt.money(res.data?.totalValue||0)} ✅`,"success");UI.modal("mod-commod").close();Pages["admin-commodities"]();}
  else UI.toast(res?.message||"Failed","error");
};

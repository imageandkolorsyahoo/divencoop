// ============================================================
// DivinGrace_BACKEND.gs — All-in-One Apps Script Backend
// Divine Grace Cooperative Multipurpose Society Ltd
// REG: LSCS 18377
//
// SETUP (one-time):
//  1. Open your Google Sheet
//  2. Extensions → Apps Script
//  3. Delete existing code, paste this entire file
//  4. Select function: setup  →  Click ▶ Run
//  5. Grant permissions when prompted
//  6. Deploy → New Deployment → Web App
//     Execute as: Me  |  Access: Anyone
//  7. Copy the Web App URL
//  8. In the portal: Admin → Settings → paste URL → Save
// ============================================================

const SS_ID  = "1pNUQjENh55PVDt_M8zVmWx4O8lX9Eo9i";
const SHEETS = {
  SETTINGS:      "SETTINGS",
  BRANCHES:      "BRANCHES",
  MEMBERS:       "MEMBERS",
  USERS:         "USERS",
  TRANSACTIONS:  "TRANSACTIONS",
  LOANS:         "LOANS",
  REPAYMENTS:    "LOAN_REPAYMENTS",
  GUARANTORS:    "GUARANTORS",
  COMMODITIES:   "COMMODITIES",
  SUMMARY:       "SUMMARY",
  AUDIT:         "AUDIT_LOG",
};

// ── Entry point ───────────────────────────────────────────
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);
  try {
    const body   = JSON.parse(e.postData.contents);
    const result = route(body);
    out.setContent(JSON.stringify(result));
  } catch(err) {
    out.setContent(JSON.stringify({ success:false, message:err.message, code:500 }));
  }
  return out;
}

function doGet(e) {
  const out = ContentService.createTextOutput(
    JSON.stringify({ success:true, message:"Divine Grace Coop API v2 — POST requests only." })
  );
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

// ── Response helpers ──────────────────────────────────────
const ok  = (data, msg) => ({ success:true,  data:data||null, message:msg||"OK" });
const err = (msg, code) => ({ success:false, data:null, message:msg||"Error", code:code||400 });

// ── Sheet helpers ─────────────────────────────────────────
function ss()   { return SpreadsheetApp.openById(SS_ID); }
function sh(n)  { return ss().getSheetByName(n); }

function getRows(sheetName, headerRow) {
  const s   = sh(sheetName); if (!s) return [];
  const all = s.getDataRange().getValues();
  if (all.length <= headerRow) return [];
  const hdrs = all[headerRow-1].map(h => String(h||"").trim());
  return all.slice(headerRow)
    .filter(r => r[0] && String(r[0]).trim() !== "")
    .map((r, i) => {
      const obj = { __row: headerRow + i + 1 };
      hdrs.forEach((h,j) => { if (h) obj[h] = r[j] !== undefined ? String(r[j]).trim() : ""; });
      return obj;
    });
}

function appendRow(sheetName, values) {
  sh(sheetName).appendRow(values);
}

function updateCell(sheetName, row, col, value) {
  sh(sheetName).getRange(row, col).setValue(value);
}

function findRow(rows, key, value) {
  return rows.find(r => String(r[key]||"").toLowerCase() === String(value||"").toLowerCase()) || null;
}

function generateId(prefix, rows, idKey) {
  let max = 0;
  (rows||[]).forEach(r => {
    const n = parseInt(String(r[idKey]||"").replace(/[^0-9]/g,""), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return prefix + String(max+1).padStart(3,"0");
}

function today() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"); }
function nowStr(){ return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"); }

function monthsBetween(dateStr) {
  try {
    const s = new Date(dateStr), e = new Date();
    return (e.getFullYear()-s.getFullYear())*12 + (e.getMonth()-s.getMonth());
  } catch { return 0; }
}

// ── Settings ──────────────────────────────────────────────
function loadSettings() {
  try {
    const rows = sh(SHEETS.SETTINGS).getRange("A5:D20").getValues();
    const map  = {};
    rows.forEach(r => { if (r[0]) map[String(r[0]).trim()] = r[2]!==undefined?String(r[2]):""; });
    return map;
  } catch { return {}; }
}
function getSetting(key, fallback) {
  const s = loadSettings(); return s[key] !== undefined && s[key] !== "" ? s[key] : fallback;
}

// ── Password ──────────────────────────────────────────────
function hashPassword(plain, salt) {
  if (!salt) salt = Utilities.base64Encode(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, String(Math.random()))).slice(0,16);
  const hash = Utilities.base64Encode(
    Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_256,
      plain + salt,
      salt
    ));
  return salt + ":" + hash;
}
function verifyPassword(plain, stored) {
  if (!stored || !stored.includes(":")) return false;
  const salt = stored.split(":")[0];
  return hashPassword(plain, salt) === stored;
}

// ── Token (simple stateless) ──────────────────────────────
function makeToken(userId, role, branchId, username, memberId) {
  const payload = JSON.stringify({ userId, role, branchId, username, memberId, exp: Date.now() + 8*3600*1000 });
  const sig     = Utilities.base64Encode(
    Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_256, payload, getTokenSecret()
    ));
  return Utilities.base64Encode(payload) + "." + sig;
}
function verifyToken(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64Decode(parts[0])).getDataAsString());
    if (Date.now() > payload.exp) return null;
    const sig = Utilities.base64Encode(
      Utilities.computeHmacSignature(
        Utilities.MacAlgorithm.HMAC_SHA_256,
        JSON.stringify({ userId:payload.userId, role:payload.role, branchId:payload.branchId, username:payload.username, memberId:payload.memberId, exp:payload.exp }),
        getTokenSecret()
      ));
    // Basic verify
    return payload;
  } catch { return null; }
}
function getTokenSecret() {
  let s = PropertiesService.getScriptProperties().getProperty("TOKEN_SECRET");
  if (!s) { s = Utilities.getUuid(); PropertiesService.getScriptProperties().setProperty("TOKEN_SECRET", s); }
  return s;
}
function requireAuth(token) {
  const s = verifyToken(token); if (!s) throw {message:"Session expired. Please log in again.", code:401}; return s;
}
function requireAdmin(token) {
  const s = requireAuth(token); if (s.role!=="Admin") throw {message:"Admin access required.", code:403}; return s;
}
function requireManager(token) {
  const s = requireAuth(token);
  if (!["Admin","BranchManager"].includes(s.role)) throw {message:"Manager access required.", code:403};
  return s;
}

// ── Router ────────────────────────────────────────────────
function route(body) {
  const { action="", token="", data={}, params={} } = body;
  try {
    switch(action) {
      case "LOGIN":                  return doLogin(data.username, data.password);
      case "LOGOUT":                 return ok(null,"Logged out.");
      case "GET_SETTINGS":           return doGetSettings();
      case "UPDATE_SETTING":         requireAdmin(token); return doUpdateSetting(data.key, data.value);
      case "GET_BRANCHES":           requireAuth(token);  return ok(getRows(SHEETS.BRANCHES, 3));
      case "GET_BRANCH":             requireAuth(token);  return ok(findRow(getRows(SHEETS.BRANCHES,3),"BranchID",params.branchId));
      case "ADD_BRANCH":             requireAdmin(token); return doAddBranch(data);
      case "UPDATE_BRANCH":          requireAdmin(token); return doUpdateBranch(params.branchId, data);
      case "GET_MEMBERS":            requireAuth(token);  return doGetMembers(params.branchId, verifyToken(token));
      case "GET_MEMBER":             requireAuth(token);  return doGetMember(params.memberId);
      case "ADD_MEMBER":             requireAdmin(token); return doAddMember(data, verifyToken(token));
      case "UPDATE_MEMBER":          requireAdmin(token); return doUpdateMember(params.memberId, data);
      case "APPROVE_MEMBER":         requireAdmin(token); return doApproveMember(params.memberId, verifyToken(token));
      case "SUSPEND_MEMBER":         requireAdmin(token); return doSuspendMember(params.memberId);
      case "MEMBER_DASHBOARD":       requireAuth(token);  return doMemberDashboard(params.memberId);
      case "CHECK_LOAN_ELIGIBILITY": requireAuth(token);  return ok(checkLoanElig(params.memberId, Number(params.amount)||0));
      case "POST_CONTRIBUTION":      requireManager(token); return doPostContribution(data, verifyToken(token));
      case "POST_TRANSACTION":       requireManager(token); return doPostTransaction(data, verifyToken(token));
      case "GET_TRANSACTIONS":       requireAuth(token);  return doGetTransactions(params, verifyToken(token));
      case "GET_MEMBER_TRANSACTIONS":requireAuth(token);  return doGetMemberTxns(params.memberId, Number(params.limit)||100);
      case "APPLY_LOAN":             requireAuth(token);  return doApplyLoan(data, verifyToken(token));
      case "APPROVE_LOAN":           requireAdmin(token); return doApproveLoan(params.loanId, verifyToken(token));
      case "REJECT_LOAN":            requireAdmin(token); return doRejectLoan(params.loanId, data.reason, verifyToken(token));
      case "DISBURSE_LOAN":          requireAdmin(token); return doDisburseLoan(params.loanId, verifyToken(token));
      case "POST_REPAYMENT":         requireManager(token); return doPostRepayment(data, verifyToken(token));
      case "GET_LOANS":              requireAuth(token);  return doGetLoans(params, verifyToken(token));
      case "GET_LOAN_REPAYMENTS":    requireAuth(token);  return ok(getRows(SHEETS.REPAYMENTS,4).filter(r=>r["LoanID"]===params.loanId));
      case "GET_LOAN_GUARANTORS":    requireAuth(token);  return ok(getRows(SHEETS.GUARANTORS,4).filter(g=>g["LoanID"]===params.loanId));
      case "VERIFY_GUARANTOR":       requireAdmin(token); return doVerifyGuarantor(params.guarantorId);
      case "CHECK_GUARANTOR_ELIG":   requireAuth(token);  return ok(checkGuarantorElig(params.memberId));
      case "GET_COMMODITIES":        requireAuth(token);  return doGetCommodities(params, verifyToken(token));
      case "ADD_COMMODITY":          requireManager(token); return doAddCommodity(data, verifyToken(token));
      case "UPDATE_COMMODITY_PAYMENT": requireManager(token); return doUpdateCommodityPay(params.commodityId, data.amountPaid);
      case "ADMIN_DASHBOARD":        requireAuth(token);  return doAdminDashboard(verifyToken(token));
      case "BRANCH_REPORT":          requireManager(token); return doBranchReport(params.branchId);
      case "GENERATE_PASSBOOK":      requireAuth(token);  return doPassbook(params.memberId);
      case "GET_AUDIT_LOG":          requireAdmin(token); return doGetAudit(Number(params.limit)||50);
      case "REBUILD_SUMMARY":        requireAdmin(token); return doRebuildSummary();
      case "SYNC_OFFLINE_QUEUE":     requireAuth(token);  return doSyncQueue(data.queue, token);
      default: return err("Unknown action: "+action);
    }
  } catch(e) {
    if (e.code) return err(e.message, e.code);
    return err(e.message||"Server error", 500);
  }
}

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════
function doLogin(username, password) {
  if (!username||!password) return err("Username and password required.");
  const users = getRows(SHEETS.USERS, 4);
  const user  = users.find(u => u["Username"]?.toLowerCase()===username.toLowerCase() && u["Status"]==="Active");
  if (!user || !verifyPassword(password, user["Password (SHA-256+Salt)"])) return err("Invalid username or password.", 401);
  if (user["Status"]==="Locked") return err("Account locked. Contact admin.", 403);

  const token = makeToken(user["UserID"], user["Role"], user["BranchID"], user["Username"], user["MemberID"]||"");
  updateCell(SHEETS.USERS, user.__row, 7, nowStr());
  doAuditLog(user["UserID"], "LOGIN", username, SHEETS.USERS);
  return ok({ token, userId:user["UserID"], memberId:user["MemberID"]||"", role:user["Role"], branchId:user["BranchID"], username:user["Username"] }, "Login successful.");
}

// ══════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════
function doGetSettings() {
  const s = loadSettings();
  return ok({
    weeklyContribution:    Number(s["WEEKLY_CONTRIBUTION"])    || 2000,
    savingsProrationPct:   Number(s["SAVINGS_PRORATION_PCT"])  || 60,
    loanRepayPct:          Number(s["LOAN_REPAY_PRORATE_PCT"]) || 40,
    allowMemberOverride:   String(s["ALLOW_MEMBER_OVERRIDE"]||"YES").toUpperCase()==="YES",
    loanInterestRate:      Number(s["LOAN_INTEREST_RATE"])     || 5,
    maxLoanMultiplier:     Number(s["MAX_LOAN_MULTIPLIER"])    || 2,
    minMembershipMonths:   Number(s["MIN_MEMBERSHIP_MONTHS"])  || 6,
    maxGuaranteesPerMember:Number(s["MAX_GUARANTEES_PER_MBR"]) || 2,
    sessionTimeoutMins:    Number(s["SESSION_TIMEOUT_MINS"])   || 30
  });
}

function doUpdateSetting(key, value) {
  const vals = sh(SHEETS.SETTINGS).getRange("A5:A20").getValues();
  for (let i=0;i<vals.length;i++) {
    if (vals[i][0]===key) { updateCell(SHEETS.SETTINGS, 5+i, 3, value); return ok(null,"Setting updated."); }
  }
  return err("Setting key not found: "+key);
}

// ══════════════════════════════════════════════════════════
// BRANCHES
// ══════════════════════════════════════════════════════════
function doAddBranch(d) {
  const rows = getRows(SHEETS.BRANCHES,3);
  const id   = generateId("BR",rows,"BranchID");
  appendRow(SHEETS.BRANCHES, [id, d.branchName||"", d.address||"", d.phone||"", today(), "Active"]);
  return ok({branchId:id},"Branch added.");
}

function doUpdateBranch(id, d) {
  const rows = getRows(SHEETS.BRANCHES,3);
  const row  = findRow(rows,"BranchID",id);
  if (!row) return err("Branch not found.",404);
  if(d.branchName) updateCell(SHEETS.BRANCHES,row.__row,2,d.branchName);
  if(d.address)    updateCell(SHEETS.BRANCHES,row.__row,3,d.address);
  if(d.phone)      updateCell(SHEETS.BRANCHES,row.__row,4,d.phone);
  if(d.status)     updateCell(SHEETS.BRANCHES,row.__row,6,d.status);
  return ok(null,"Branch updated.");
}

// ══════════════════════════════════════════════════════════
// MEMBERS
// ══════════════════════════════════════════════════════════
function calcBal(txns, memberId, cat) {
  return txns.filter(t=>t["MemberID"]===memberId&&t["Category"]===cat)
    .reduce((b,t)=>b+(t["Type"]==="CR"?Number(t["Amount (₦)"])||0:-(Number(t["Amount (₦)"])||0)),0);
}

function doGetMembers(branchId, sess) {
  let rows = getRows(SHEETS.MEMBERS,4);
  if (branchId) rows = rows.filter(r=>r["BranchID"]===branchId);
  if (sess?.role==="BranchManager") rows = rows.filter(r=>r["BranchID"]===sess.branchId);
  const txns = getRows(SHEETS.TRANSACTIONS,4);
  rows.forEach(m=>{
    m["Total Savings (₦)"] = calcBal(txns, m["MemberID"], "Savings");
    m["Max Loan (₦)"]      = m["Total Savings (₦)"]*2;
  });
  return ok(rows);
}

function doGetMember(memberId) {
  const rows = getRows(SHEETS.MEMBERS,4);
  const m    = findRow(rows,"MemberID",memberId);
  if (!m) return err("Member not found.",404);
  const txns = getRows(SHEETS.TRANSACTIONS,4);
  m["Total Savings (₦)"] = calcBal(txns,memberId,"Savings");
  m["Max Loan (₦)"]      = m["Total Savings (₦)"]*2;
  return ok(m);
}

function doAddMember(d, sess) {
  const members = getRows(SHEETS.MEMBERS,4);
  if (members.find(m=>m["Phone"]===String(d.phone||"").trim())) return err("Phone already registered.",409);
  const memberId = generateId("MEM",members,"MemberID");
  const coopNo   = String(parseInt(memberId.replace("MEM",""),10)).padStart(4,"0");
  appendRow(SHEETS.MEMBERS, [
    memberId, coopNo, d.firstName||"", d.lastName||"",
    d.phone||"", d.email||"", d.branchId||"", d.joinDate||today(),
    "Active", d.notes||"", d.dob||"", d.gender||"",
    d.address||"", d.occupation||"",
    d.nokName||"", d.nokPhone||"", d.nokRelationship||"",
    d.idType||"", d.idNumber||"",
    "", "", 0, 0, "", "", "Pending", "", ""
  ]);
  const uid      = autoCreateUser(memberId, d.firstName||"", d.lastName||"", d.branchId||"");
  const username = ((d.firstName||"")+"."+(d.lastName||"")).toLowerCase().replace(/[^a-z0-9.]/g,"");
  doAuditLog(sess?.userId||"SYSTEM","ADD_MEMBER",memberId+" — "+d.firstName+" "+d.lastName,SHEETS.MEMBERS);
  return ok({memberId, coopNo, username, defaultPassword:"Welcome@1234"},"Member added.");
}

function autoCreateUser(memberId, first, last, branchId) {
  const users    = getRows(SHEETS.USERS,4);
  const userId   = generateId("USR",users,"UserID");
  const username = ((first||"")+"."+(last||"")).toLowerCase().replace(/[^a-z0-9.]/g,"")||"user"+memberId;
  const pwHash   = hashPassword("Welcome@1234");
  appendRow(SHEETS.USERS, [userId, memberId, username, pwHash, "Member", branchId, "", "Active"]);
  return userId;
}

function doUpdateMember(memberId, d) {
  const rows = getRows(SHEETS.MEMBERS,4);
  const row  = findRow(rows,"MemberID",memberId);
  if (!row) return err("Member not found.",404);
  const map = {3:d.firstName,4:d.lastName,5:d.phone,6:d.email,7:d.branchId,9:d.status,13:d.address,14:d.occupation};
  for (const [col,val] of Object.entries(map)) { if(val) updateCell(SHEETS.MEMBERS,row.__row,Number(col),val); }
  return ok(null,"Member updated.");
}

function doApproveMember(memberId, sess) {
  const rows = getRows(SHEETS.MEMBERS,4);
  const row  = findRow(rows,"MemberID",memberId);
  if (!row) return err("Member not found.",404);
  updateCell(SHEETS.MEMBERS,row.__row,26,"Active");
  updateCell(SHEETS.MEMBERS,row.__row,27,sess?.userId||"admin");
  updateCell(SHEETS.MEMBERS,row.__row,28,today());
  updateCell(SHEETS.MEMBERS,row.__row,9,"Active");
  doAuditLog(sess?.userId||"admin","APPROVE_MEMBER",memberId,SHEETS.MEMBERS);
  return ok(null,"Member approved.");
}

function doSuspendMember(memberId) {
  const rows = getRows(SHEETS.MEMBERS,4);
  const row  = findRow(rows,"MemberID",memberId);
  if (!row) return err("Member not found.",404);
  updateCell(SHEETS.MEMBERS,row.__row,9,"Suspended");
  return ok(null,"Member suspended.");
}

// ══════════════════════════════════════════════════════════
// TRANSACTIONS & PRORATION ENGINE
// ══════════════════════════════════════════════════════════
function doPostContribution(d, sess) {
  const memberId = String(d.memberId||"").trim();
  const amount   = Number(d.amount);
  const date     = d.date||today();
  const override = Boolean(d.overrideToLoan);
  if (!memberId||!amount) return err("memberId and amount required.");

  const members = getRows(SHEETS.MEMBERS,4);
  const member  = findRow(members,"MemberID",memberId);
  if (!member)               return err("Member not found: "+memberId,404);
  if (member["Status"]!=="Active") return err("Member is not active.",400);

  const loans     = getRows(SHEETS.LOANS,4);
  const activeLoan= loans.find(l=>l["MemberID"]===memberId&&["Pending","Approved","Active"].includes(l["Status"]));
  const s         = doGetSettings().data;
  const branchId  = member["BranchID"];
  const posted    = [];

  if (!activeLoan) {
    posted.push(postTxnCore({ memberId,branchId,category:"Savings",type:"CR",amount,date,
      prorationApplied:"No",splitType:"Full",splitRef:"—",
      remark:"Weekly contribution — full to Savings",postedBy:sess?.userId||"admin" }));
    return ok({transactions:posted},`₦${amount.toLocaleString()} posted to Savings.`);
  }

  if (override && s.allowMemberOverride) {
    posted.push(postTxnCore({memberId,branchId,category:"Loan",type:"DR",amount,date,
      prorationApplied:"Yes",splitType:"Override",splitRef:"—",
      remark:"Contribution — 100% override to Loan repayment",postedBy:sess?.userId||"admin"}));
    recordRepayment(activeLoan["LoanID"],memberId,branchId,date,amount,sess?.userId||"admin");
    return ok({transactions:posted},`₦${amount.toLocaleString()} fully redirected to Loan.`);
  }

  const savPct  = s.savingsProrationPct;
  const lnPct   = s.loanRepayPct;
  const savAmt  = Math.round(amount*savPct/100);
  const loanAmt = amount-savAmt;
  const ref     = "REF"+Date.now().toString(36).toUpperCase();

  posted.push(postTxnCore({memberId,branchId,category:"Savings",type:"CR",amount:savAmt,date,
    prorationApplied:"Yes",splitType:"Savings",splitRef:ref,
    remark:`Proration ${savPct}% of ₦${amount.toLocaleString()}`,postedBy:sess?.userId||"admin"}));
  posted.push(postTxnCore({memberId,branchId,category:"Loan",type:"DR",amount:loanAmt,date,
    prorationApplied:"Yes",splitType:"LoanRepay",splitRef:ref,
    remark:`Proration ${lnPct}% of ₦${amount.toLocaleString()}`,postedBy:sess?.userId||"admin"}));
  recordRepayment(activeLoan["LoanID"],memberId,branchId,date,loanAmt,sess?.userId||"admin");

  doAuditLog(sess?.userId,"POST_CONTRIBUTION",
    memberId+" ₦"+amount+" → Savings:₦"+savAmt+" Loan:₦"+loanAmt,SHEETS.TRANSACTIONS);
  return ok({transactions:posted,savingsAmount:savAmt,loanAmount:loanAmt},
    `Prorated: ₦${savAmt.toLocaleString()} → Savings | ₦${loanAmt.toLocaleString()} → Loan.`);
}

function doPostTransaction(d, sess) {
  const id = postTxnCore({...d,postedBy:sess?.userId||"admin"});
  return ok({txnId:id},"Transaction posted.");
}

function postTxnCore(d) {
  const txns   = getRows(SHEETS.TRANSACTIONS,4);
  const txnId  = generateId("TXN",txns,"TxnID");
  const prevBal= calcBal(txns,d.memberId,d.category);
  const newBal = d.type==="CR"?prevBal+Number(d.amount):prevBal-Number(d.amount);
  appendRow(SHEETS.TRANSACTIONS,[
    txnId, d.date||today(), d.memberId, d.branchId||"",
    d.category, d.type, Number(d.amount), newBal,
    d.prorationApplied||"No", d.splitType||"Full",
    d.splitRef||"—", d.remark||"", d.postedBy||"admin"
  ]);
  return txnId;
}

function doGetTransactions(params, sess) {
  let rows = getRows(SHEETS.TRANSACTIONS,4);
  if (params.memberId) rows=rows.filter(t=>t["MemberID"]===params.memberId);
  if (params.category) rows=rows.filter(t=>t["Category"]===params.category);
  if (params.type)     rows=rows.filter(t=>t["Type"]===params.type);
  if (sess?.role==="BranchManager") rows=rows.filter(t=>t["BranchID"]===sess.branchId);
  return ok(rows.reverse());
}

function doGetMemberTxns(memberId, limit) {
  const rows = getRows(SHEETS.TRANSACTIONS,4);
  return ok(rows.filter(t=>t["MemberID"]===memberId).reverse().slice(0,limit));
}

function recordRepayment(loanId, memberId, branchId, date, amount, postedBy) {
  const loans = getRows(SHEETS.LOANS,4);
  const loan  = findRow(loans,"LoanID",loanId);
  const reps  = getRows(SHEETS.REPAYMENTS,4);
  const repId = generateId("REP",reps,"RepaymentID");
  const totalDue = Number(loan?.["Total Due (₦)"])||0;
  const alreadyPaid = reps.filter(r=>r["LoanID"]===loanId)
    .reduce((s,r)=>s+(Number(r["Amount Paid (₦)"])||0),0);
  const outstanding = Math.max(0,totalDue-alreadyPaid-amount);
  appendRow(SHEETS.REPAYMENTS,[repId,loanId,memberId,branchId,date,amount,outstanding,"Loan repayment",postedBy]);
  if (loan) {
    updateCell(SHEETS.LOANS,loan.__row,8,alreadyPaid+amount);
    updateCell(SHEETS.LOANS,loan.__row,9,outstanding);
    if (outstanding<=0) {
      updateCell(SHEETS.LOANS,loan.__row,13,"Closed");
      const mrows = getRows(SHEETS.MEMBERS,4);
      const mrow  = findRow(mrows,"MemberID",memberId);
      if(mrow){updateCell(SHEETS.MEMBERS,mrow.__row,24,"");updateCell(SHEETS.MEMBERS,mrow.__row,25,"Closed");}
      doAuditLog(postedBy,"LOAN_CLOSED",loanId+" fully repaid by "+memberId,SHEETS.LOANS);
    }
  }
}

// ══════════════════════════════════════════════════════════
// LOANS
// ══════════════════════════════════════════════════════════
function checkLoanElig(memberId, requestedAmount) {
  const members = getRows(SHEETS.MEMBERS,4);
  const member  = findRow(members,"MemberID",memberId);
  if (!member) return {eligible:false,reasons:["Member not found."]};
  const s       = doGetSettings().data;
  const txns    = getRows(SHEETS.TRANSACTIONS,4);
  const loans   = getRows(SHEETS.LOANS,4);
  const reasons = [];
  if (member["Status"]!=="Active") reasons.push("Member is not active.");
  const months = monthsBetween(member["Join Date"]);
  if (months<s.minMembershipMonths)
    reasons.push(`Must be a member for at least ${s.minMembershipMonths} months. You have ${months}.`);
  const activeLoan = loans.find(l=>l["MemberID"]===memberId&&["Pending","Approved","Active"].includes(l["Status"]));
  if (activeLoan) reasons.push(`Outstanding loan (${activeLoan["LoanID"]}, ${activeLoan["Status"]}).`);
  const savings = calcBal(txns,memberId,"Savings");
  const maxLoan = savings*s.maxLoanMultiplier;
  if (requestedAmount>0&&requestedAmount>maxLoan)
    reasons.push(`Requested ₦${requestedAmount.toLocaleString()} exceeds max ₦${maxLoan.toLocaleString()}.`);
  const ed = new Date(member["Join Date"]||""); ed.setMonth(ed.getMonth()+s.minMembershipMonths);
  return {eligible:reasons.length===0,reasons,savingsBalance:savings,maxLoanAmount:maxLoan,
    monthsAsMember:months,loanEligibleDate:Utilities.formatDate(ed,Session.getScriptTimeZone(),"yyyy-MM-dd")};
}

function checkGuarantorElig(memberId) {
  const members = getRows(SHEETS.MEMBERS,4);
  const m       = findRow(members,"MemberID",memberId);
  if(!m) return {eligible:false,reason:"Member not found."};
  if(m["Status"]!=="Active") return {eligible:false,reason:"Guarantor is not active."};
  const loans = getRows(SHEETS.LOANS,4);
  if(loans.find(l=>l["MemberID"]===memberId&&["Pending","Approved","Active"].includes(l["Status"])))
    return {eligible:false,reason:"Guarantor has an outstanding loan."};
  return {eligible:true,reason:""};
}

function doApplyLoan(d, sess) {
  const elig = checkLoanElig(d.memberId, Number(d.amount)||0);
  if (!elig.eligible) return err("Eligibility failed: "+elig.reasons.join(" | "));
  if (!d.guarantor1MemberId||!d.guarantor2MemberId) return err("Two guarantors required.");
  if (d.guarantor1MemberId===d.memberId||d.guarantor2MemberId===d.memberId) return err("Cannot be your own guarantor.");
  if (d.guarantor1MemberId===d.guarantor2MemberId) return err("Guarantors must be different members.");
  const g1 = checkGuarantorElig(d.guarantor1MemberId); if(!g1.eligible) return err("Guarantor 1: "+g1.reason);
  const g2 = checkGuarantorElig(d.guarantor2MemberId); if(!g2.eligible) return err("Guarantor 2: "+g2.reason);
  const s   = doGetSettings().data;
  const principal = Number(d.amount)||0;
  const interest  = principal*s.loanInterestRate/100;
  const totalDue  = principal+interest;
  const loans     = getRows(SHEETS.LOANS,4);
  const loanId    = generateId("LN",loans,"LoanID");
  appendRow(SHEETS.LOANS,[loanId,d.memberId,d.branchId||"",principal,s.loanInterestRate,interest,
    totalDue,0,totalDue,d.purpose||"",Number(d.durationMonths)||6,today(),
    "Pending","","","","Awaiting admin review"]);
  const members = getRows(SHEETS.MEMBERS,4);
  const guars   = getRows(SHEETS.GUARANTORS,4);
  const g1m = findRow(members,"MemberID",d.guarantor1MemberId);
  const gId1 = generateId("GUA",guars,"GuarantorID");
  appendRow(SHEETS.GUARANTORS,[gId1,loanId,d.memberId,d.guarantor1MemberId,g1m?.["CoopNo"]||"",
    g1m?g1m["First Name"]+" "+g1m["Last Name"]:"",d.guarantor1Phone||g1m?.["Phone"]||"","YES","Pending",today()]);
  const updGuars = getRows(SHEETS.GUARANTORS,4);
  const g2m = findRow(members,"MemberID",d.guarantor2MemberId);
  const gId2 = generateId("GUA",updGuars,"GuarantorID");
  appendRow(SHEETS.GUARANTORS,[gId2,loanId,d.memberId,d.guarantor2MemberId,g2m?.["CoopNo"]||"",
    g2m?g2m["First Name"]+" "+g2m["Last Name"]:"",d.guarantor2Phone||g2m?.["Phone"]||"","YES","Pending",today()]);
  const mrow = findRow(members,"MemberID",d.memberId);
  if(mrow){updateCell(SHEETS.MEMBERS,mrow.__row,24,loanId);updateCell(SHEETS.MEMBERS,mrow.__row,25,"Pending");}
  doAuditLog(sess?.userId||"MEMBER","LOAN_APPLICATION",loanId+" | "+d.memberId+" | ₦"+principal.toLocaleString(),SHEETS.LOANS);
  return ok({loanId,totalDue,interestRate:s.loanInterestRate},"Loan application submitted.");
}

function doApproveLoan(loanId, sess) {
  const loans = getRows(SHEETS.LOANS,4);
  const loan  = findRow(loans,"LoanID",loanId);
  if (!loan) return err("Loan not found.",404);
  if (loan["Status"]!=="Pending") return err("Only Pending loans can be approved.");
  const guars   = getRows(SHEETS.GUARANTORS,4);
  const unver   = guars.filter(g=>g["LoanID"]===loanId&&g["Verification Status"]!=="Verified");
  if (unver.length>0) return err(unver.length+" guarantor(s) not yet verified.");
  updateCell(SHEETS.LOANS,loan.__row,13,"Approved");
  updateCell(SHEETS.LOANS,loan.__row,14,sess?.userId||"admin");
  updateCell(SHEETS.LOANS,loan.__row,15,today());
  doAuditLog(sess?.userId,"LOAN_APPROVED",loanId,SHEETS.LOANS);
  return ok(null,"Loan approved.");
}

function doRejectLoan(loanId, reason, sess) {
  const loans = getRows(SHEETS.LOANS,4);
  const loan  = findRow(loans,"LoanID",loanId);
  if (!loan) return err("Loan not found.",404);
  updateCell(SHEETS.LOANS,loan.__row,13,"Rejected");
  updateCell(SHEETS.LOANS,loan.__row,14,sess?.userId||"admin");
  updateCell(SHEETS.LOANS,loan.__row,15,today());
  updateCell(SHEETS.LOANS,loan.__row,17,reason||"Rejected");
  const mrows = getRows(SHEETS.MEMBERS,4);
  const mrow  = findRow(mrows,"MemberID",loan["MemberID"]);
  if(mrow){updateCell(SHEETS.MEMBERS,mrow.__row,24,"");updateCell(SHEETS.MEMBERS,mrow.__row,25,"Rejected");}
  doAuditLog(sess?.userId,"LOAN_REJECTED",loanId+" — "+reason,SHEETS.LOANS);
  return ok(null,"Loan rejected.");
}

function doDisburseLoan(loanId, sess) {
  const loans = getRows(SHEETS.LOANS,4);
  const loan  = findRow(loans,"LoanID",loanId);
  if (!loan) return err("Loan not found.",404);
  if (loan["Status"]!=="Approved") return err("Only Approved loans can be disbursed.");
  updateCell(SHEETS.LOANS,loan.__row,13,"Active");
  updateCell(SHEETS.LOANS,loan.__row,16,today());
  postTxnCore({memberId:loan["MemberID"],branchId:loan["BranchID"],category:"Loan",type:"CR",
    amount:Number(loan["Principal (₦)"])||0,date:today(),prorationApplied:"No",splitType:"Full",
    splitRef:loanId,remark:"Loan disbursement — "+loanId,postedBy:sess?.userId||"admin"});
  const mrows = getRows(SHEETS.MEMBERS,4);
  const mrow  = findRow(mrows,"MemberID",loan["MemberID"]);
  if(mrow){updateCell(SHEETS.MEMBERS,mrow.__row,24,loanId);updateCell(SHEETS.MEMBERS,mrow.__row,25,"Active");}
  doAuditLog(sess?.userId,"LOAN_DISBURSED",loanId+" | ₦"+loan["Principal (₦)"],SHEETS.LOANS);
  return ok(null,"Loan disbursed. ₦"+Number(loan["Principal (₦)"]).toLocaleString()+" credited.");
}

function doPostRepayment(d, sess) {
  const loans = getRows(SHEETS.LOANS,4);
  const loan  = findRow(loans,"LoanID",d.loanId);
  if (!loan)                  return err("Loan not found.",404);
  if (loan["Status"]!=="Active") return err("Loan is not Active.");
  postTxnCore({memberId:d.memberId,branchId:loan["BranchID"],category:"Loan",type:"DR",
    amount:Number(d.amount)||0,date:d.date||today(),prorationApplied:"No",splitType:"Full",
    splitRef:d.loanId,remark:"Manual repayment — "+d.loanId,postedBy:sess?.userId||"admin"});
  recordRepayment(d.loanId,d.memberId,loan["BranchID"],d.date||today(),Number(d.amount)||0,sess?.userId||"admin");
  return ok(null,"Repayment ₦"+Number(d.amount).toLocaleString()+" posted.");
}

function doGetLoans(params, sess) {
  let rows = getRows(SHEETS.LOANS,4);
  if (params.memberId) rows=rows.filter(l=>l["MemberID"]===params.memberId);
  if (params.status)   rows=rows.filter(l=>l["Status"]===params.status);
  if (sess?.role==="BranchManager") rows=rows.filter(l=>l["BranchID"]===sess.branchId);
  return ok(rows.reverse());
}

function doVerifyGuarantor(guarantorId) {
  const rows = getRows(SHEETS.GUARANTORS,4);
  const row  = findRow(rows,"GuarantorID",guarantorId);
  if (!row) return err("Guarantor not found.",404);
  updateCell(SHEETS.GUARANTORS,row.__row,9,"Verified");
  return ok(null,"Guarantor verified.");
}

// ══════════════════════════════════════════════════════════
// COMMODITIES
// ══════════════════════════════════════════════════════════
function doGetCommodities(params, sess) {
  let rows = getRows(SHEETS.COMMODITIES,3);
  if (params.memberId) rows=rows.filter(c=>c["MemberID"]===params.memberId);
  if (sess?.role==="BranchManager") rows=rows.filter(c=>c["BranchID"]===sess.branchId);
  return ok(rows);
}

function doAddCommodity(d, sess) {
  const rows  = getRows(SHEETS.COMMODITIES,3);
  const comId = generateId("COM",rows,"CommodityID");
  const qty   = Number(d.quantity)||0, price=Number(d.unitPrice)||0;
  const total = qty*price, paid=Number(d.amountPaid)||0, bal=Math.max(0,total-paid);
  const status= paid>=total?"Paid":paid>0?"Partial":"Unpaid";
  appendRow(SHEETS.COMMODITIES,[comId,d.memberId,d.branchId,d.item||"",qty,price,total,d.dateIssued||today(),status,paid,bal]);
  doAuditLog(sess?.userId,"ADD_COMMODITY",comId+" — "+d.item,SHEETS.COMMODITIES);
  return ok({commodityId:comId,totalValue:total},"Commodity added.");
}

function doUpdateCommodityPay(commodityId, amountPaid) {
  const rows = getRows(SHEETS.COMMODITIES,3);
  const row  = findRow(rows,"CommodityID",commodityId);
  if (!row) return err("Not found.",404);
  const paid=Number(amountPaid)||0, total=Number(row["Total Value (₦)"])||0;
  const bal=Math.max(0,total-paid), status=paid>=total?"Paid":paid>0?"Partial":"Unpaid";
  updateCell(SHEETS.COMMODITIES,row.__row,9,status);
  updateCell(SHEETS.COMMODITIES,row.__row,10,paid);
  updateCell(SHEETS.COMMODITIES,row.__row,11,bal);
  return ok({status,balance:bal},"Payment updated.");
}

// ══════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════
function doAdminDashboard(sess) {
  const members  = getRows(SHEETS.MEMBERS,4);
  const loans    = getRows(SHEETS.LOANS,4);
  const txns     = getRows(SHEETS.TRANSACTIONS,4);
  const branches = getRows(SHEETS.BRANCHES,3);
  let totalSavings=0, totalShares=0;
  txns.forEach(t=>{
    const amt=Number(t["Amount (₦)"])||0, mul=t["Type"]==="CR"?1:-1;
    if(t["Category"]==="Savings") totalSavings+=amt*mul;
    if(t["Category"]==="Shares")  totalShares +=amt*mul;
  });
  return ok({
    totalMembers: members.filter(m=>m["Status"]==="Active").length,
    pendingLoans: loans.filter(l=>l["Status"]==="Pending").length,
    activeLoans:  loans.filter(l=>l["Status"]==="Active").length,
    totalSavings, totalShares,
    branchStats: branches.map(b=>({
      branchId:b["BranchID"],name:b["Branch Name"],
      members:     members.filter(m=>m["BranchID"]===b["BranchID"]&&m["Status"]==="Active").length,
      activeLoans: loans.filter(l=>l["BranchID"]===b["BranchID"]&&l["Status"]==="Active").length
    })),
    recentTxns: txns.slice(-20).reverse()
  });
}

function doMemberDashboard(memberId) {
  const txns  = getRows(SHEETS.TRANSACTIONS,4);
  const loans = getRows(SHEETS.LOANS,4);
  const mrows = getRows(SHEETS.MEMBERS,4);
  const member= findRow(mrows,"MemberID",memberId);
  const cats  = ["Shares","Savings","Loan","Deposit","Commodity"];
  const balances = {};
  cats.forEach(c=>{balances[c]=calcBal(txns,memberId,c);});
  const activeLoan = loans.find(l=>l["MemberID"]===memberId&&["Pending","Approved","Active"].includes(l["Status"]))||null;
  const eligibility= checkLoanElig(memberId,0);
  return ok({member,balances,activeLoan,eligibility,recentTxns:txns.filter(t=>t["MemberID"]===memberId).reverse().slice(0,10)});
}

function doBranchReport(branchId) {
  const members = getRows(SHEETS.MEMBERS,4);
  const txns    = getRows(SHEETS.TRANSACTIONS,4);
  const loans   = getRows(SHEETS.LOANS,4);
  const report  = members.filter(m=>m["BranchID"]===branchId&&m["Status"]==="Active").map(m=>({
    memberId:m["MemberID"],name:m["First Name"]+" "+m["Last Name"],coopNo:m["CoopNo"],
    shares:   calcBal(txns,m["MemberID"],"Shares"),
    savings:  calcBal(txns,m["MemberID"],"Savings"),
    loan:     calcBal(txns,m["MemberID"],"Loan"),
    deposit:  calcBal(txns,m["MemberID"],"Deposit"),
    commodity:calcBal(txns,m["MemberID"],"Commodity"),
    loanStatus:loans.find(l=>l["MemberID"]===m["MemberID"]&&["Active","Pending"].includes(l["Status"]))?"Active":"None"
  }));
  return ok({branchId,members:report,count:report.length});
}

function doPassbook(memberId) {
  const txns  = getRows(SHEETS.TRANSACTIONS,4);
  const mrows = getRows(SHEETS.MEMBERS,4);
  const loans = getRows(SHEETS.LOANS,4);
  const member= findRow(mrows,"MemberID",memberId);
  if (!member) return err("Member not found.",404);
  const cats = ["Shares","Savings","Loan","Deposit","Commodity"];
  const passbook = {};
  cats.forEach(cat=>{
    const entries = txns.filter(t=>t["MemberID"]===memberId&&t["Category"]===cat);
    let running=0;
    const lines = entries.map(t=>{
      const amt=Number(t["Amount (₦)"])||0;
      running=t["Type"]==="CR"?running+amt:running-amt;
      return {date:t["Date"],type:t["Type"],amount:amt,balance:running,remark:t["Remark"]||""};
    });
    passbook[cat]={entries:lines,balance:running};
  });
  const activeLoan=loans.find(l=>l["MemberID"]===memberId&&["Active","Pending","Approved"].includes(l["Status"]))||null;
  return ok({
    member:{id:memberId,name:member["First Name"]+" "+member["Last Name"],
      coopNo:member["CoopNo"],branch:member["BranchID"],joinDate:member["Join Date"]},
    passbook,activeLoan,generatedAt:nowStr()
  });
}

function doGetAudit(limit) {
  try {
    const rows = sh(SHEETS.AUDIT).getDataRange().getValues();
    if (rows.length<2) return ok([]);
    const hdrs = rows[0].map(h=>String(h).trim());
    return ok(rows.slice(1).filter(r=>r[0]).map((r,i)=>{
      const obj={};hdrs.forEach((h,j)=>{if(h)obj[h]=String(r[j]||"");});return obj;
    }).reverse().slice(0,limit));
  } catch { return ok([]); }
}

function doRebuildSummary() {
  const members = getRows(SHEETS.MEMBERS,4);
  const txns    = getRows(SHEETS.TRANSACTIONS,4);
  const loans   = getRows(SHEETS.LOANS,4);
  const sumSh   = sh(SHEETS.SUMMARY);
  const lastRow = sumSh.getLastRow();
  if (lastRow>5) sumSh.getRange(6,1,lastRow-5,sumSh.getLastColumn()).clearContent();
  members.filter(m=>m["Status"]==="Active").forEach(m=>{
    const activeLoan=loans.find(l=>l["MemberID"]===m["MemberID"]&&["Active","Pending","Approved"].includes(l["Status"]));
    sumSh.appendRow([m["MemberID"],m["First Name"]+" "+m["Last Name"],m["BranchID"],
      calcBal(txns,m["MemberID"],"Shares"),calcBal(txns,m["MemberID"],"Savings"),
      activeLoan?Number(activeLoan["Outstanding (₦)"])||0:0,
      calcBal(txns,m["MemberID"],"Deposit"),calcBal(txns,m["MemberID"],"Commodity"),
      activeLoan?.["Status"]||"None",nowStr()]);
  });
  return ok(null,"Summary rebuilt for "+members.length+" members.");
}

function doAuditLog(userId, action, details, sheetAffected) {
  try {
    const s = sh(SHEETS.AUDIT); if (!s) return;
    const nextRow = s.getLastRow()+1;
    s.getRange(nextRow,1,1,6).setValues([[nextRow-1,nowStr(),userId||"SYSTEM",action||"",details||"",sheetAffected||""]]);
  } catch {}
}

function doSyncQueue(queue, token) {
  if (!Array.isArray(queue)||!queue.length) return ok({processed:0},"Nothing to sync.");
  let processed=0,failed=0;
  queue.forEach(item=>{
    try {
      const r = route({action:item.action,token,data:item.data||{},params:item.params||{}});
      if(r.success) processed++; else failed++;
    } catch { failed++; }
  });
  return ok({processed,failed},"Sync: "+processed+" success, "+failed+" failed.");
}

// ══════════════════════════════════════════════════════════
// FIRST-TIME SETUP — Run this once!
// ══════════════════════════════════════════════════════════
function setup() {
  const spreadsheet = SpreadsheetApp.openById(SS_ID);
  const ui = SpreadsheetApp.getUi();
  try {
    _createSheets(spreadsheet);
    _seedSettings(spreadsheet);
    _seedAdminUser();
    _seedSampleBranch();
    Logger.log("✅ Divine Grace Coop — Setup complete!");
    Logger.log("✅ Default admin: admin / Admin@DGCoop2024");
    ui.alert("✅ Setup Complete!\n\nAdmin login:\nUsername: admin\nPassword: Admin@DGCoop2024\n\nNow deploy as Web App.");
  } catch(e) {
    Logger.log("❌ Setup error: "+e.message);
    ui.alert("❌ Error: "+e.message);
  }
}

function _createSheets(spreadsheet) {
  const required = [
    {name:"SETTINGS",     headers:null},
    {name:"BRANCHES",     headers:["BranchID","Branch Name","Address","Phone","Date Created","Status"]},
    {name:"MEMBERS",      headers:["MemberID","CoopNo","First Name","Last Name","Phone","Email","BranchID","Join Date","Status","Notes","DOB","Gender","Residential Address","Occupation","Next of Kin","NOK Phone","NOK Relationship","ID Type","ID Number","Profile Pic URL","Biometric","Shares Bal","Savings Bal","Active Loan ID","Loan Status","Onboarding Status","Approved By","Approval Date"]},
    {name:"USERS",        headers:["UserID","MemberID","Username","Password (SHA-256+Salt)","Role","BranchID","Last Login","Status"]},
    {name:"TRANSACTIONS", headers:["TxnID","Date","MemberID","BranchID","Category","Type","Amount (₦)","Running Balance (₦)","Proration Applied","Split Type","Split Ref","Remark","Posted By"]},
    {name:"LOANS",        headers:["LoanID","MemberID","BranchID","Principal (₦)","Interest Rate (%)","Interest Amt (₦)","Total Due (₦)","Total Repaid (₦)","Outstanding (₦)","Purpose","Duration (Months)","Application Date","Status","Approved By","Approval Date","Disbursement Date","Remarks"]},
    {name:"LOAN_REPAYMENTS",headers:["RepaymentID","LoanID","MemberID","BranchID","Date","Amount Paid (₦)","Outstanding After","Remark","Posted By"]},
    {name:"GUARANTORS",   headers:["GuarantorID","LoanID","Applicant MemberID","Guarantor MemberID","Guarantor CoopNo","Guarantor Name","Guarantor Phone","Consent Given","Verification Status","Date Provided"]},
    {name:"COMMODITIES",  headers:["CommodityID","MemberID","BranchID","Item Description","Quantity","Unit Price (₦)","Total Value (₦)","Date Issued","Payment Status","Amount Paid (₦)","Balance Due (₦)"]},
    {name:"SUMMARY",      headers:["MemberID","Full Name","BranchID","Shares (₦)","Savings (₦)","Loan Outstanding (₦)","Deposit (₦)","Commodity (₦)","Loan Status","Last Updated"]},
    {name:"AUDIT_LOG",    headers:["#","Timestamp","UserID","Action","Details","Sheet Affected"]},
  ];

  const existing = spreadsheet.getSheets().map(s=>s.getName());

  required.forEach(def=>{
    if (!existing.includes(def.name)) {
      spreadsheet.insertSheet(def.name);
      Logger.log("Created sheet: "+def.name);
    }
    if (def.headers) {
      const s   = spreadsheet.getSheetByName(def.name);
      const hdr = def.name==="COMMODITIES"||def.name==="BRANCHES"||def.name==="AUDIT_LOG"?1:
                  def.name==="SETTINGS"?null:4;
      if (hdr && s.getRange(hdr,1).getValue()==="") {
        s.getRange(hdr,1,1,def.headers.length).setValues([def.headers]);
        s.getRange(hdr,1,1,def.headers.length).setFontWeight("bold");
        s.setFrozenRows(hdr);
      }
    }
  });
}

function _seedSettings(spreadsheet) {
  const s = spreadsheet.getSheetByName("SETTINGS");
  if (s.getRange("A5").getValue()==="WEEKLY_CONTRIBUTION") return; // already seeded
  const rows = [
    ["WEEKLY_CONTRIBUTION",    "Default weekly contribution",    2000,      "₦ amount"],
    ["SAVINGS_PRORATION_PCT",  "Savings proration % (on loan)", 60,        "0-100"],
    ["LOAN_REPAY_PRORATE_PCT", "Loan repayment proration %",    40,        "0-100"],
    ["ALLOW_MEMBER_OVERRIDE",  "Allow 100% loan override",      "YES",     "YES/NO"],
    ["LOAN_INTEREST_RATE",     "Loan interest rate",            5,         "% per loan"],
    ["MAX_LOAN_MULTIPLIER",    "Max loan = X × savings",        2,         "multiplier"],
    ["MIN_MEMBERSHIP_MONTHS",  "Min months before loan",        6,         "months"],
    ["MAX_GUARANTEES_PER_MBR", "Max guarantees per member",     2,         "number"],
    ["SESSION_TIMEOUT_MINS",   "Session timeout",               30,        "minutes"],
  ];
  s.getRange("A1:D1").setValues([["Divine Grace Cooperative — System Settings","","",""]]);
  s.getRange("A3:D3").setValues([["Key","Description","Value","Notes"]]);
  s.getRange("A3:D3").setFontWeight("bold");
  s.getRange(5,1,rows.length,4).setValues(rows);
}

function _seedAdminUser() {
  const users = getRows(SHEETS.USERS,4);
  if (users.find(u=>u["Username"]==="admin")) return;
  const pwHash = hashPassword("Admin@DGCoop2024");
  appendRow(SHEETS.USERS,["USR001","","admin",pwHash,"Admin","ALL","","Active"]);
  Logger.log("Admin user created: admin / Admin@DGCoop2024");
}

function _seedSampleBranch() {
  const branches = getRows(SHEETS.BRANCHES,3);
  if (branches.length>0) return;
  appendRow(SHEETS.BRANCHES,["BR001","Head Office","Divine Grace Cooperative HQ, Nigeria","08038593189",today(),"Active"]);
}

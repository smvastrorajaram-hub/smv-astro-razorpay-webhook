const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_UID = String(process.env.ADMIN_UID || "TwjeEIFS3Zcf1SxboLZoujm91Ky2").trim();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: String(process.env.FIREBASE_PRIVATE_KEY || "")
        .replace(/^['"]|['"]$/g, "")
        .replace(/\\n/g, "\n")
        .trim()
    })
  });
}
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const RAZORPAY_KEY_ID = String(process.env.RAZORPAY_KEY_ID || "").trim();
const RAZORPAY_KEY_SECRET = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim();
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "").trim();
const RESEND_FROM = String(process.env.RESEND_FROM || "onboarding@resend.dev").trim();
const RESEND_TEST_RECIPIENT = String(process.env.RESEND_TEST_RECIPIENT || ADMIN_EMAIL || "").trim();
// SMTP is retained as an optional fallback for paid Render services. Render Free
// services block outbound SMTP ports 25/465/587, so Resend HTTP API is preferred.
const SMTP_HOST = String(process.env.SMTP_HOST || "").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = String(process.env.SMTP_USER || "").trim();
const SMTP_PASS = String(process.env.SMTP_PASS || "").trim();
const SMTP_FROM = String(process.env.SMTP_FROM || SMTP_USER || "").trim();
let smtpTransport = null;
try {
  const nodemailer = require("nodemailer");
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    smtpTransport = nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000
    });
  }
} catch (_) {}

async function sendEmail({to, subject, text, html, replyTo}) {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) throw new Error("No recipient email address is available.");
  if (RESEND_API_KEY) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: recipients,
          subject,
          text,
          html,
          ...(replyTo ? { reply_to: replyTo } : {})
        }),
        signal: controller.signal
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = body?.message || body?.name || `Resend API returned HTTP ${r.status}`;
        throw new Error(msg);
      }
      return body;
    } finally { clearTimeout(timer); }
  }
  if (smtpTransport) {
    return smtpTransport.sendMail({ from: SMTP_FROM, to: recipients, replyTo, subject, text, html });
  }
  throw new Error("Email provider is not configured. Set RESEND_API_KEY and RESEND_FROM in Render.");
}

async function getUserEmail(uid) {
  if (!uid) return "";
  try {
    const u = await admin.auth().getUser(uid);
    if (u?.email) return String(u.email).trim();
  } catch (_) {}
  try {
    const s = await db.collection("smv_users").doc(uid).get();
    return String(s.data()?.email || "").trim();
  } catch (_) { return ""; }
}

function uniqueRecipients(list) {
  return [...new Set((list || []).map(x => String(x || "").trim()).filter(Boolean))];
}

async function sendSystemEmail({ to = [], subject, text, replyTo }) {
  const recipients = uniqueRecipients(to);
  if (!recipients.length) return { skipped: true };
  try {
    return await sendEmail({ to: recipients, subject, text, replyTo });
  } catch (e) {
    console.error("System email failed:", subject, e?.message || e);
    return { failed: true, error: e?.message || String(e) };
  }
}

async function sendAdminTransactionEmail({ eventType, paymentId, orderId, amount, currency, questionId, customerEmail, status }) {
  if (!ADMIN_EMAIL) return;
  const subject = `SMV ASTRO Transaction — ${eventType}`;
  const text = [
    "SMV ASTRO Transaction Notification",
    "",
    `Event: ${eventType}`,
    `Status: ${status || eventType}`,
    `Amount: ${amount != null ? `${amount} ${currency || "INR"}` : "N/A"}`,
    `Razorpay Payment ID: ${paymentId || "N/A"}`,
    `Razorpay Order ID: ${orderId || "N/A"}`,
    `Question ID: ${questionId || "N/A"}`,
    `Customer Email: ${customerEmail || "N/A"}`,
    `Time: ${new Date().toISOString()}`
  ].join("\n");
  await sendSystemEmail({ to: [ADMIN_EMAIL], subject, text, replyTo: customerEmail || ADMIN_EMAIL });
}
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Render.");
}
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(x => x.trim()).filter(Boolean);
// Parse JSON request bodies for normal API routes. Keep Razorpay webhook raw so its
// HMAC signature can still be verified against the original request bytes.
app.use((req, res, next) => {
  if (req.path === "/razorpay/webhook") return next();
  return express.json({ limit: "15mb" })(req, res, next);
});

app.use((req, res, next) => {
  // The Blogger frontend uses Firebase ID-token Authorization headers, not
  // cookie credentials, so wildcard CORS is safe for this API and prevents
  // Blogger/custom-domain deployments from failing with a browser
  // "Failed to fetch" before the request reaches Express.
  const origin = req.headers.origin;
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

async function requireUser(req, res) {
  const header = String(req.get("Authorization") || "");
  if (!header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Login session is missing. Please login again." });
    return null;
  }
  try {
    return await admin.auth().verifyIdToken(header.slice(7));
  } catch (e) {
    console.error("Firebase token verification failed:", e?.message || e);
    res.status(401).json({ error: "Login session expired. Please login again." });
    return null;
  }
}

async function isAdminUser(user) {
  if (!user) return false;
  if (user.uid === ADMIN_UID) return true;
  if (user.admin === true || user.role === "admin") return true;
  try {
    const snap = await db.collection("smv_users").doc(user.uid).get();
    return snap.exists && String(snap.data()?.role || "").toLowerCase() === "admin";
  } catch (e) {
    console.error("Admin role lookup failed:", e?.message || e);
    return false;
  }
}

function signatureEqual(expected, actual) {
  const a = Buffer.from(String(expected || ""));
  const b = Buffer.from(String(actual || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}


// Registration profile endpoints: Firestore profile/counter writes are performed
// server-side with Firebase Admin SDK so customer/astrologer registration does
// not depend on client Firestore Rules for protected counter/profile writes.
function indiaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date).reduce((o, p) => { o[p.type] = p.value; return o; }, {});
  return `${parts.day}${parts.month}${parts.year}`;
}

async function nextCustomerId() {
  // Customer IDs are date-based in India (IST): SMV-CUS-DDMMYYYY-01, -02, ...
  const dateKey = indiaDateKey();
  const ref = db.collection("smv_counters").doc(`customer_${dateKey}`);
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const next = (snap.exists ? Number(snap.data()?.lastNumber || 0) : 0) + 1;
    tx.set(ref, { lastNumber: next, dateKey, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return `SMV-CUS-${dateKey}-${String(next).padStart(2, "0")}`;
  });
}

app.post("/lookup-customer-login", async (req, res) => {
  try {
    const customerId = String(req.body?.customerId || "").trim().toUpperCase();
    if (!/^SMV-CUS-\d{8}-\d{2,}$/.test(customerId)) {
      return res.status(400).json({ error: "Enter a valid Customer ID, for example SMV-CUS-20082026-01." });
    }
    const snap = await db.collection("smv_users").where("publicId", "==", customerId).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "Customer ID was not found. Please check your Customer ID." });
    const data = snap.docs[0].data() || {};
    if (String(data.role || "").toLowerCase() !== "customer") return res.status(403).json({ error: "This ID is not a customer login ID." });
    const uid = String(data.uid || snap.docs[0].id);
    const user = await admin.auth().getUser(uid);
    if (!user.email) return res.status(400).json({ error: "This Customer account has no login email configured." });
    return res.json({ ok: true, email: user.email, customerId });
  } catch (e) {
    console.error("Customer ID lookup error:", e);
    return res.status(500).json({ error: "Customer ID login lookup failed. Please try again." });
  }
});

async function nextPublicId(prefix, dateKey) {
  const isCustomer = prefix === "CS";
  const kind = isCustomer ? "customer" : "astrologer";
  const ref = db.collection("smv_counters").doc(`${kind}_${dateKey}`);
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const next = (snap.exists ? Number(snap.data()?.lastNumber || 0) : 0) + 1;
    tx.set(ref, { lastNumber: next, dateKey, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const idPrefix = isCustomer ? "SMV-CUS" : "SMV-AST";
    return `${idPrefix}-${dateKey}-${String(next).padStart(2, "0")}`;
  });
}

app.post("/lookup-id-login", async (req, res) => {
  try {
    const publicId = String(req.body?.publicId || "").trim().toUpperCase();
    if (!/^SMV-(CUS|AST)-\d{8}-\d{2,}$/.test(publicId)) {
      return res.status(400).json({ error: "Enter a valid Customer or Astrologer ID." });
    }
    const snap = await db.collection("smv_users").where("publicId", "==", publicId).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "This ID was not found. Please check the ID and try again." });
    const data = snap.docs[0].data() || {};
    const expectedRole = publicId.startsWith("SMV-AST-") ? "astrologer" : "customer";
    if (String(data.role || "").toLowerCase() !== expectedRole) return res.status(403).json({ error: "This ID is not valid for this login type." });
    const uid = String(data.uid || snap.docs[0].id);
    const user = await admin.auth().getUser(uid);
    if (!user.email) return res.status(400).json({ error: "This account has no login email configured." });
    return res.json({ ok: true, email: user.email, publicId, role: expectedRole });
  } catch (e) {
    console.error("ID login lookup error:", e);
    return res.status(500).json({ error: "ID login lookup failed. Please try again." });
  }
});

app.post("/register-customer-profile", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    if (!name || name.length > 120) return res.status(400).json({ error: "A valid customer name is required." });
    if (phone.length > 30) return res.status(400).json({ error: "Invalid mobile number." });
    const ref = db.collection("smv_users").doc(user.uid);
    const existing = await ref.get();
    if (existing.exists && String(existing.data()?.role || "").toLowerCase() === "customer" && existing.data()?.publicId) {
      return res.json({ ok: true, alreadyRegistered: true, publicId: existing.data().publicId });
    }
    const publicId = await nextCustomerId();
    await ref.set({
      uid: user.uid, name, phone, email: user.email || "", role: "customer",
      status: "active", publicId, customerId: publicId, emailVerificationRequired: true,
      createdAt: existing.exists ? (existing.data()?.createdAt || FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    return res.json({ ok: true, publicId });
  } catch (e) {
    console.error("Customer registration profile error:", e);
    return res.status(500).json({ error: "Customer profile setup failed on the server. Please try again." });
  }
});

app.post("/register-astrologer-profile", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const b = req.body || {};
    const name=String(b.name||"").trim(), mobile=String(b.mobile||"").trim(), specialization=String(b.specialization||"").trim();
    const experience=Number(b.experience||0), bio=String(b.bio||"").trim();
    const bankName=String(b.bankName||"").trim(), accountName=String(b.accountName||"").trim(), accountNumber=String(b.accountNumber||"").trim(), ifsc=String(b.ifsc||"").trim(), upi=String(b.upi||"").trim(), photoData=String(b.photoData||"");
    if(!name||!mobile||!specialization||!bio||!bankName||!accountName||!accountNumber||!ifsc||!photoData) return res.status(400).json({error:"Please complete all required astrologer registration details."});
    if(!Number.isFinite(experience)||experience<0) return res.status(400).json({error:"Invalid experience."});
    const userRef=db.collection("smv_users").doc(user.uid), astroRef=db.collection("smv_astrologers").doc(user.uid), payoutRef=db.collection("smv_payouts").doc(user.uid);
    const existing=await userRef.get();
    if(existing.exists && String(existing.data()?.role||"").toLowerCase()==="astrologer" && existing.data()?.publicId) return res.json({ok:true,alreadyRegistered:true,publicId:existing.data().publicId});
    const dateKey=indiaDateKey(), publicId=await nextPublicId("AT",dateKey);
    const batch=db.batch();
    batch.set(userRef,{uid:user.uid,name,phone:mobile,mobile,email:user.email||"",publicId,role:"astrologer",status:"pending",emailVerificationRequired:true,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()},{merge:true});
    batch.set(astroRef,{uid:user.uid,name,publicId,specialization,expertise:specialization,experience,about:bio,bio,photoData,status:"pending",role:"astrologer",createdAt:FieldValue.serverTimestamp()},{merge:true});
    batch.set(payoutRef,{uid:user.uid,bankName,accountName,accountNumber,ifsc,upi,updatedAt:FieldValue.serverTimestamp(),status:"pending_admin_review"},{merge:true});
    batch.set(db.collection("smv_notifications").doc(user.uid+"_"+Date.now()),{userId:user.uid,type:"registration",title:"Registration submitted",message:"Your astrologer application is pending Admin approval.",createdAt:FieldValue.serverTimestamp(),read:false});
    await batch.commit();
    return res.json({ok:true,publicId});
  } catch(e){ console.error("Astrologer registration profile error:",e); return res.status(500).json({error:"Astrologer profile setup failed on the server. Please try again."}); }
});

app.get("/", (req, res) => res.status(200).json({
  service: "SMV ASTRO Razorpay Backend",
  version: "2026-08-17-v67.1-razorpay-authorised-capture-fix",
  status: "online",
  razorpay: "enabled",
  firebase: "enabled"
}));

app.get("/test-razorpay", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!(await isAdminUser(user))) return res.status(403).json({ error: "Admin access required." });
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return res.status(500).json({ ok: false, error: "Razorpay credentials are missing in Render." });
    const mode = RAZORPAY_KEY_ID.startsWith("rzp_test_") ? "test" : (RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "live" : "unknown");
    await razorpay.orders.all({ count: 1 });
    return res.json({ ok: true, mode, keyPrefix: RAZORPAY_KEY_ID.slice(0, 9), message: `Razorpay ${mode} credentials accepted by Render.` });
  } catch (e) {
    console.error("Razorpay connection test failed:", e);
    return res.status(502).json({ error: e?.error?.description || e?.description || e?.message || "Razorpay connection failed." });
  }
});


function escapeHtmlEmail(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
}


app.post("/contact-query", express.json({ limit: "20kb" }), async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const place = String(req.body?.place || "").trim();
    const mobile = String(req.body?.mobile || "").trim();
    const query = String(req.body?.query || "").trim();

    if (!name || !email || !place || !mobile || !query) {
      return res.status(400).json({ error: "Please fill all required fields." });
    }
    if (name.length > 100 || email.length > 160 || place.length > 120 || mobile.length > 20 || query.length > 3000) {
      return res.status(400).json({ error: "One or more fields are too long." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!ADMIN_EMAIL || (!RESEND_API_KEY && !smtpTransport)) {
      console.error("Contact email configuration is missing. Set ADMIN_EMAIL and RESEND_API_KEY/RESEND_FROM in Render.");
      return res.status(503).json({ error: "Email service is not configured. Add RESEND_API_KEY and RESEND_FROM in Render." });
    }

    const ref = db.collection("contactQueries").doc();
    const createdAt = FieldValue.serverTimestamp();
    await ref.set({
      name, email, place, mobile, query,
      status: "new",
      createdAt,
      source: "website-contact-form"
    });

    const subject = `New SVM ASTRO Customer Query — ${name}`;
    const text = [
      "New SVM ASTRO Customer Query",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Place: ${place}`,
      `Mobile: ${mobile}`,
      "",
      "Query:",
      query,
      "",
      `Query ID: ${ref.id}`
    ].join("\n");

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2 style="color:#7e1818">New SVM ASTRO Customer Query</h2>
        <p><b>Name:</b> ${escapeHtmlEmail(name)}</p>
        <p><b>Email:</b> ${escapeHtmlEmail(email)}</p>
        <p><b>Place:</b> ${escapeHtmlEmail(place)}</p>
        <p><b>Mobile:</b> ${escapeHtmlEmail(mobile)}</p>
        <p><b>Query:</b></p>
        <div style="white-space:pre-wrap;border:1px solid #ddd;padding:12px;border-radius:8px">${escapeHtmlEmail(query)}</div>
        <p><small>Query ID: ${escapeHtmlEmail(ref.id)}</small></p>
      </div>`;

    const contactRecipient = RESEND_API_KEY ? (RESEND_TEST_RECIPIENT || ADMIN_EMAIL) : ADMIN_EMAIL;
    await sendEmail({ to: contactRecipient, replyTo: email, subject, text, html: htmlBody });

    return res.status(200).json({ ok: true, queryId: ref.id });
  } catch (e) {
    console.error("Contact query failed:", e);
    return res.status(502).json({ error: e?.message || "Unable to send your query right now. Please try again later." });
  }
});







/**
 * Server-side astrologer answer submission.
 *
 * The answer is written by the trusted backend first. Email notification is
 * then attempted from the server (never from the browser), and the result of
 * each recipient is persisted in the question document.
 */
app.post("/submit-answer", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const questionId = String(req.body?.questionId || "").trim();
  const answer = String(req.body?.answer || "").trim();

  try {
    if (!questionId || !answer) {
      return res.status(400).json({ error: "Question ID and answer are required." });
    }

    const questionRef = db.collection("smv_questions").doc(questionId);
    const snap = await questionRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Question not found." });

    const q = snap.data() || {};
    if (String(q.astrologerId || "") !== String(user.uid)) {
      return res.status(403).json({ error: "This question is not assigned to you." });
    }

    if (!["admin_approved", "revision_required"].includes(String(q.status || ""))) {
      return res.status(409).json({ error: "This question is not ready for answer submission." });
    }

    const minWords = Number(q.answerMinWords || 150);
    const wordCount = answer.split(/\s+/).filter(Boolean).length;
    if (wordCount < minWords) {
      return res.status(400).json({ error: `Please write at least ${minWords} words.` });
    }

    const commissionPercent = Number(q.commissionPercent || q.commissionRate || 20);
    const commissionAmount =
      Math.round(Number(q.amount || 0) * commissionPercent) / 100;

    // Save the answer before attempting email. This makes the submission
    // independent of browser notification calls and email-provider latency.
    await questionRef.update({
      answer,
      answerWordCount: wordCount,
      answerSubmittedAt: FieldValue.serverTimestamp(),
      astrologerAnswerStatus: "submitted",
      status: "processing",
      astrologerCommissionAmount: commissionAmount,
      commissionPercent,
      commissionRate: commissionPercent,
      commissionStatus: "pending_admin_approval",
      answerEmailStatus: {
        state: "pending",
        updatedAt: FieldValue.serverTimestamp()
      }
    });

    const customerEmail = String(
      q.customerEmail || await getUserEmail(q.customerId) || ""
    ).trim();
    const customerName = String(q.customerName || q.birthName || "Customer");
    const astrologerEmail = String(await getUserEmail(q.astrologerId) || "").trim();
    const astrologerName = String(q.astrologerName || "Astrologer");

    const subject = "SMV ASTRO — Astrologer answer submitted";
    const text = [
      `Dear ${customerName},`,
      "",
      `${astrologerName} has submitted an answer to your astrology question. It is now waiting for Admin review.`,
      "",
      `Question: ${q.question || ""}`,
      `Question ID: ${questionId}`,
      "",
      "Regards,",
      "SMV ASTRO"
    ].join("\n");

    const recipients = uniqueRecipients([customerEmail, ADMIN_EMAIL]);
    const emailResults = {};
    const emailStatusPatch = {
      state: "completed",
      updatedAt: FieldValue.serverTimestamp()
    };

    if (!recipients.length) {
      const error = "No customer or admin email address is configured.";
      console.error(`ANSWER EMAIL FAILED | Question ID: ${questionId} | Reason: ${error}`);
      emailStatusPatch.state = "failed";
      emailStatusPatch.error = error;
      emailStatusPatch.recipients = {};
    } else {
      for (const recipient of recipients) {
        const recipientKey = recipient.toLowerCase();
        const result = await sendSystemEmail({
          to: [recipient],
          replyTo: ADMIN_EMAIL || astrologerEmail || customerEmail,
          subject,
          text
        });

        if (result?.failed) {
          emailResults[recipientKey] = {
            status: "failed",
            error: String(result.error || "Unknown email error")
          };
          console.error(
            `ANSWER EMAIL FAILED | Question ID: ${questionId} | Recipient Email: ${recipient} | Reason: ${result.error || "Unknown email error"}`
          );
        } else {
          emailResults[recipientKey] = {
            status: "sent",
            messageId: result?.id || null
          };
          console.log(
            `ANSWER EMAIL SENT | Question ID: ${questionId} | Recipient Email: ${recipient}`
          );
        }
      }

      const failed = Object.values(emailResults).some(x => x.status === "failed");
      emailStatusPatch.state = failed
        ? (Object.values(emailResults).every(x => x.status === "failed") ? "failed" : "partial")
        : "sent";
      emailStatusPatch.recipients = emailResults;
    }

    await questionRef.set({ answerEmailStatus: emailStatusPatch }, { merge: true });

    const failedCount = Object.values(emailResults).filter(x => x.status === "failed").length;
    return res.json({
      ok: true,
      answerSaved: true,
      emailState: emailStatusPatch.state,
      emailFailedCount: failedCount,
      recipients: recipients.length
    });
  } catch (e) {
    console.error(
      `Answer submission failed | Question ID: ${questionId || "N/A"} | Reason:`,
      e?.message || e
    );
    return res.status(500).json({
      error: e?.message || "Unable to submit answer."
    });
  }
});

app.post("/question-notify", express.json({limit:"20kb"}), async(req,res)=>{
  const user=await requireUser(req,res); if(!user)return;
  try{
    if(!ADMIN_EMAIL || (!RESEND_API_KEY && !smtpTransport)) return res.status(503).json({error:"Email service is not configured in Render. Set ADMIN_EMAIL, RESEND_API_KEY and RESEND_FROM."});
    const questionId=String(req.body?.questionId||"").trim();
    const event=String(req.body?.event||"").trim();
    const reason=String(req.body?.reason||"").trim();
    const allowed=["payment_verified","question_approved","question_rejected","answer_submitted","answer_approved","answer_rejected"];
    if(!questionId||!allowed.includes(event)) return res.status(400).json({error:"Invalid question notification request."});
    const qSnap=await db.collection("smv_questions").doc(questionId).get();
    if(!qSnap.exists) return res.status(404).json({error:"Question not found."});
    const q=qSnap.data()||{};
    const isAdmin=await isAdminUser(user);
    const isCustomer=q.customerId===user.uid;
    const isAstrologer=q.astrologerId===user.uid;
    if(event==="payment_verified" && !isCustomer) return res.status(403).json({error:"Only the question owner can send this notification."});
    if(["question_approved","question_rejected","answer_approved","answer_rejected"].includes(event) && !isAdmin) return res.status(403).json({error:"Admin access required for this notification."});
    if(event==="answer_submitted" && !isAstrologer) return res.status(403).json({error:"Only the assigned astrologer can send this notification."});

    async function userEmail(uid){
      if(!uid)return "";
      try{const u=await admin.auth().getUser(uid);return String(u.email||"").trim();}catch(e){}
      try{const s=await db.collection("smv_users").doc(uid).get();return String(s.data()?.email||"").trim();}catch(e){return "";}
    }
    const customerEmail=String(q.customerEmail||await userEmail(q.customerId)||"").trim();
    const astrologerEmail=await userEmail(q.astrologerId);
    const customerName=String(q.customerName||q.birthName||"Customer");
    const astrologerName=String(q.astrologerName||"Astrologer");
    let subject="", text="", to=[];
    if(event==="payment_verified"){
      if(customerEmail)to=[customerEmail]; subject="SMV ASTRO — Question payment received"; text=`Dear ${customerName},\n\nYour payment for your astrology question has been successfully verified. Your question is now waiting for Admin approval.\n\nQuestion: ${q.question||""}\nQuestion ID: ${questionId}\n\nRegards,\nSMV ASTRO`;
    } else if(event==="question_approved"){
      if(customerEmail)to=[customerEmail]; subject="SMV ASTRO — Your question has been approved"; text=`Dear ${customerName},\n\nYour paid astrology question has been approved by Admin and is now available to an approved astrologer.\n\nQuestion: ${q.question||""}\nQuestion ID: ${questionId}\n\nRegards,\nSMV ASTRO`;
    } else if(event==="question_rejected"){
      if(customerEmail)to=[customerEmail]; subject="SMV ASTRO — Question update"; text=`Dear ${customerName},\n\nYour astrology question was not approved by Admin.\n\nReason: ${reason||"Please contact SMV ASTRO."}\nQuestion ID: ${questionId}\n\nRegards,\nSMV ASTRO`;
    } else if(event==="answer_submitted"){
      if(customerEmail)to=[customerEmail]; if(ADMIN_EMAIL&&!to.includes(ADMIN_EMAIL))to.push(ADMIN_EMAIL); subject="SMV ASTRO — Astrologer answer submitted"; text=`Dear ${customerName},\n\n${astrologerName} has submitted an answer to your astrology question. It is now waiting for Admin review.\n\nQuestion: ${q.question||""}\nQuestion ID: ${questionId}\n\nRegards,\nSMV ASTRO`;
    } else if(event==="answer_approved"){
      if(customerEmail)to.push(customerEmail); if(astrologerEmail&&!to.includes(astrologerEmail))to.push(astrologerEmail); subject="SMV ASTRO — Astrology answer approved"; text=`Your astrology answer has been approved by SMV ASTRO Admin.\n\nQuestion: ${q.question||""}\nQuestion ID: ${questionId}\n\nThe customer can now view the approved answer.`;
    } else if(event==="answer_rejected"){
      if(astrologerEmail)to=[astrologerEmail]; subject="SMV ASTRO — Answer revision required"; text=`Dear ${astrologerName},\n\nYour submitted answer requires revision.\n\nReason: ${reason||"Please review and resubmit the answer."}\nQuestion ID: ${questionId}\n\nRegards,\nSMV ASTRO`;
    }
    // Every question/answer event keeps a master copy for the Admin.
    if (ADMIN_EMAIL && !to.includes(ADMIN_EMAIL)) to.push(ADMIN_EMAIL);
    to = uniqueRecipients(to);
    if(!to.length) return res.status(400).json({error:"No recipient email address is available for this update."});
    await sendSystemEmail({to,replyTo:ADMIN_EMAIL,subject,text});
    return res.json({ok:true,recipients:to.length,event});
  }catch(e){console.error("Question notification failed:",e);return res.status(500).json({error:"Unable to send question update email right now."});}
});


async function nextQuestionId() {
  const dateKey = indiaDateKey();
  const ref = db.collection("smv_counters").doc(`question_${dateKey}`);
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const next = (snap.exists ? Number(snap.data()?.lastNumber || 0) : 0) + 1;
    tx.set(ref, { lastNumber: next, dateKey, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return `SMV-QST-${dateKey}-${String(next).padStart(2, "0")}`;
  });
}

function nextPaymentIdInTransaction(dateKey, snap) {
  const next = (snap.exists ? Number(snap.data()?.lastNumber || 0) : 0) + 1;
  return {
    id: `SMV-PAY-${dateKey}-${String(next).padStart(2, "0")}`,
    next
  };
}


async function nextPaymentId() {
  const dateKey = indiaDateKey();
  const ref = db.collection("smv_counters").doc(`payment_${dateKey}`);
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const next = (snap.exists ? Number(snap.data()?.lastNumber || 0) : 0) + 1;
    tx.set(ref, { lastNumber: next, dateKey, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return `SMV-PAY-${dateKey}-${String(next).padStart(2, "2")}`;
  });
}

async function nextBookingId() {
  const dateKey = indiaDateKey();
  const ref = db.collection("smv_counters").doc(`booking_${dateKey}`);
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const next = (snap.exists ? Number(snap.data()?.lastNumber || 0) : 0) + 1;
    tx.set(ref, { lastNumber: next, dateKey, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return `SMV-BKG-${dateKey}-${String(next).padStart(2, "0")}`;
  });
}

app.post("/appointment-booking", express.json({ limit: "20kb" }), async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const name=String(req.body?.name||"").trim(), email=String(req.body?.email||user.email||"").trim(), mobile=String(req.body?.mobile||"").trim();
    const type=String(req.body?.type||"").trim(), preferredDate=String(req.body?.preferredDate||"").trim(), preferredTime=String(req.body?.preferredTime||"").trim(), notes=String(req.body?.notes||"").trim();
    if(!name||!email||!mobile||!type||!preferredDate||!preferredTime) return res.status(400).json({error:"Please fill all required appointment fields."});
    if(!["Chat Consultation","Call Consultation"].includes(type)) return res.status(400).json({error:"Please choose Chat or Call consultation."});
    if(name.length>100||email.length>160||mobile.length>20||notes.length>2000) return res.status(400).json({error:"One or more fields are too long."});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:"Please enter a valid email address."});

    const bookingId = await nextBookingId();
    const ref=db.collection("smv_appointments").doc();
    const data={bookingId,customerUid:user.uid,customerEmail:user.email||email,name,email,mobile,type,preferredDate,preferredTime,notes,status:"new",paymentStatus:"not_required",bookingStatus:"requested",createdAt:FieldValue.serverTimestamp(),source:"website-appointment-form",updatedAt:FieldValue.serverTimestamp()};
    await ref.set(data);

    // Email notification is best-effort. Booking creation must not fail just because
    // the optional notification provider is unavailable.
    if(ADMIN_EMAIL && (RESEND_API_KEY || smtpTransport)){
      try {
        await sendEmail({to:ADMIN_EMAIL,replyTo:email,subject:`SMV ASTRO ${type} Booking — ${bookingId}`,text:["New SMV ASTRO Booking Request","",`Booking ID: ${bookingId}`,`Customer UID: ${user.uid}`,`Name: ${name}`,`Email: ${email}`,`Mobile: ${mobile}`,`Type: ${type}`,`Preferred: ${preferredDate} ${preferredTime}`,`Notes: ${notes||"None"}`].join("\n")});
      } catch(emailErr) { console.warn("Booking notification email failed; booking remains created:", emailErr?.message||emailErr); }
    }
    return res.json({ok:true,bookingId,appointmentId:ref.id,status:"new",bookingStatus:"requested"});
  } catch(e){console.error("Appointment booking failed:",e);return res.status(502).json({error:e?.message||"Unable to create booking right now."});}
});

app.get("/public/astrologers", async (req,res)=>{
  try {
    const snap=await db.collection("smv_astrologers").limit(200).get();
    const astrologers=snap.docs.map(d=>{const x=d.data()||{};return {id:d.id,name:x.name||"Astrologer",expertise:x.expertise||x.specialization||"Astrology",specialization:x.specialization||x.expertise||"Astrology",experience:x.experience||0,bio:x.bio||x.about||"",about:x.about||x.bio||"",photoData:x.photoData||x.photoURL||x.photoUrl||"",rating:x.rating||x.averageRating||"New",publicId:x.publicId||"",status:x.status||""};}).filter(a=>String(a.status||"").toLowerCase()==="approved");
    return res.json({success:true,astrologers});
  } catch(e) {
    console.error("Public astrologers load failed:",e);
    return res.status(500).json({error:e?.message||"Unable to load approved astrologers."});
  }
});

app.get("/public/astrologers/:astrologerId/reviews", async(req,res)=>{
  try{
    const astrologerId=String(req.params?.astrologerId||"").trim();
    if(!astrologerId) return res.status(400).json({error:"Astrologer ID is required."});
    const astroSnap=await db.collection("smv_astrologers").doc(astrologerId).get();
    if(!astroSnap.exists || String(astroSnap.data()?.status||"").toLowerCase()!=="approved") return res.status(404).json({error:"Approved astrologer not found."});
    const snap=await db.collection("smv_reviews").limit(200).get();
    const reviews=snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.astrologerId===astrologerId && (r.approved===true || String(r.status||"").toLowerCase()==="approved"));
    return res.json({success:true,astrologerId,reviews});
  }catch(e){console.error("Public astrologer reviews load failed:",e);return res.status(500).json({error:e?.message||"Unable to load astrologer reviews."});}
});

app.get("/admin/appointments", async(req,res)=>{
  const user=await requireUser(req,res); if(!user)return; if(!(await isAdminUser(user)))return res.status(403).json({error:"Admin access required."});
  try{
    // Avoid orderBy so an index can never block the Admin Dashboard.
    const snap=await db.collection("smv_appointments").limit(200).get();
    const appointments=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>{
      const at=a.createdAt?.toMillis?a.createdAt.toMillis():(a.createdAt?.seconds||0)*1000;
      const bt=b.createdAt?.toMillis?b.createdAt.toMillis():(b.createdAt?.seconds||0)*1000;
      return bt-at;
    }).slice(0,50);
    return res.json({appointments});
  }catch(e){return res.status(500).json({error:e?.message||"Unable to load appointments."});}
});

app.post("/admin/appointment-status", express.json({limit:"5kb"}), async(req,res)=>{
  const user=await requireUser(req,res); if(!user)return; if(!(await isAdminUser(user)))return res.status(403).json({error:"Admin access required."});
  try{const id=String(req.body?.id||"").trim(),status=String(req.body?.status||"").trim();if(!id||!["new","confirmed","completed","cancelled"].includes(status))return res.status(400).json({error:"Invalid appointment update."});await db.collection("smv_appointments").doc(id).update({status,updatedAt:FieldValue.serverTimestamp(),updatedBy:user.uid});return res.json({ok:true});}catch(e){return res.status(500).json({error:e?.message||"Unable to update appointment."});}
});

app.post("/admin/reallocate-question", express.json({limit:"10kb"}), async (req,res)=>{
  const user=await requireUser(req,res); if(!user)return;
  if(!(await isAdminUser(user))) return res.status(403).json({error:"Admin access denied."});
  try{
    const questionId=String(req.body?.questionId||"").trim();
    const astrologerId=String(req.body?.astrologerId||"").trim();
    const pct=Number(req.body?.commissionPercent);
    if(!questionId||!astrologerId) return res.status(400).json({error:"Question ID and astrologer are required."});
    if(!Number.isFinite(pct)||pct<0||pct>100) return res.status(400).json({error:"Commission percentage must be between 0 and 100."});
    const qRef=db.collection("smv_questions").doc(questionId);
    const aRef=db.collection("smv_astrologers").doc(astrologerId);
    const [qSnap,aSnap]=await Promise.all([qRef.get(),aRef.get()]);
    if(!qSnap.exists) return res.status(404).json({error:"Question not found."});
    if(!aSnap.exists) return res.status(404).json({error:"Astrologer not found."});
    const q=qSnap.data()||{}, a=aSnap.data()||{};
    if(String(a.status||"").toLowerCase()!=="approved") return res.status(409).json({error:"Selected astrologer is not approved."});
    if(["answered","question_rejected"].includes(String(q.status||""))) return res.status(409).json({error:"This question is already closed."});
    const amount=Number(q.amount||q.paymentAmount||0);
    const astroCommission=Math.round(amount*pct)/100;
    const adminCommission=Math.round((amount-astroCommission)*100)/100;
    await qRef.update({
      astrologerId, astrologerName:a.name||"Astrologer", commissionPercent:pct, commissionRate:pct,
      astrologerCommissionAmount:astroCommission, adminCommissionAmount:adminCommission,
      allocationStatus:"assigned_to_astrologer", commissionStatus:"allocated_pending_answer",
      astrologerAnswerStatus:"pending", reallocatedAt:FieldValue.serverTimestamp(),
      reallocatedBy:user.uid, updatedAt:FieldValue.serverTimestamp()
    });
    await db.collection("smv_notifications").add({userId:astrologerId,type:"question_assigned",title:"Question Re-allocated",message:"Admin has assigned a paid question to you.",questionId,commissionAmount:astroCommission,createdAt:FieldValue.serverTimestamp(),read:false});
    return res.json({success:true,questionId,astrologerId,commissionPercent:pct,astrologerCommissionAmount:astroCommission,adminCommissionAmount:adminCommission});
  }catch(e){console.error("Admin reallocate question error:",e);return res.status(500).json({error:e?.message||"Unable to re-allocate question."});}
});

app.post("/admin/edit-question", express.json({limit:"20kb"}), async (req,res)=>{
  const user=await requireUser(req,res); if(!user)return;
  if(!(await isAdminUser(user))) return res.status(403).json({error:"Admin access denied."});
  try{
    const questionId=String(req.body?.questionId||"").trim();
    const question=String(req.body?.question||"").trim();
    if(!questionId||!question) return res.status(400).json({error:"Question ID and question text are required."});
    if(question.length>10000) return res.status(400).json({error:"Question is too long."});
    const ref=db.collection("smv_questions").doc(questionId);
    const snap=await ref.get(); if(!snap.exists) return res.status(404).json({error:"Question not found."});
    const q=snap.data()||{};
    if(["answered","question_rejected"].includes(q.status)) return res.status(409).json({error:"This question can no longer be edited."});
    await ref.update({question,adminQuestionEditedAt:FieldValue.serverTimestamp(),adminQuestionEditedBy:user.uid});
    return res.json({success:true,questionId});
  }catch(e){console.error("Admin edit question error:",e);return res.status(500).json({error:e?.message||"Unable to edit question."});}
});

app.post("/admin/takeover-answer", express.json({limit:"30kb"}), async (req,res)=>{
  const user=await requireUser(req,res); if(!user)return;
  if(!(await isAdminUser(user))) return res.status(403).json({error:"Admin access denied."});
  try{
    const questionId=String(req.body?.questionId||"").trim();
    const answer=String(req.body?.answer||"").trim();
    if(!questionId||!answer) return res.status(400).json({error:"Question ID and Admin answer are required."});
    const ref=db.collection("smv_questions").doc(questionId);
    const snap=await ref.get(); if(!snap.exists) return res.status(404).json({error:"Question not found."});
    const q=snap.data()||{};
    if(!q.customerId) return res.status(409).json({error:"Customer information is missing."});
    if(["answered","question_rejected"].includes(q.status)) return res.status(409).json({error:"This question is already closed."});
    const wordCount=answer.split(/\s+/).filter(Boolean).length;
    const minWords=Math.max(1,Number(q.answerMinWords||1));
    if(wordCount<minWords) return res.status(400).json({error:`Admin answer must contain at least ${minWords} words.`});
    await ref.update({
      question: q.question || "",
      answer,
      answerWordCount:wordCount,
      answerAuthorType:"admin",
      adminAnswered:true,
      adminAnswerBy:user.uid,
      adminAnswerAt:FieldValue.serverTimestamp(),
      status:"answered",
      astrologerAnswerStatus:"not_required",
      commissionStatus:"admin_retained",
      astrologerCommissionAmount:0,
      commissionAmount:0,
      commissionCreditedAt:FieldValue.delete(),
      astrologerPaymentId:FieldValue.delete(),
      adminTakeover:true,
      answeredAt:FieldValue.serverTimestamp(),
      updatedAt:FieldValue.serverTimestamp()
    });
    await db.collection("smv_notifications").add({userId:q.customerId,type:"answer_approved",title:"Your astrology answer is ready",message:"SMV ASTRO Admin answered your question directly.",questionId,createdAt:FieldValue.serverTimestamp(),read:false});
    return res.json({success:true,questionId,answerAuthorType:"admin",adminRetained:true});
  }catch(e){console.error("Admin takeover answer error:",e);return res.status(500).json({error:e?.message||"Unable to save Admin answer."});}
});

app.get("/admin-data", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!(await isAdminUser(user))) return res.status(403).json({ error: "Admin access denied." });

  const readCollection = async (name) => {
    try {
      const snap = await db.collection(name).get();
      return { ok: true, items: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
    } catch (e) {
      console.error(`Admin collection ${name} failed:`, e?.message || e);
      return { ok: false, items: [], error: e?.message || `Unable to read ${name}.` };
    }
  };

  try {
    // Read each collection independently. One damaged/missing collection must
    // never prevent the Admin Dashboard itself from opening.
    const [users, astrologers, questions] = await Promise.all([
      readCollection("smv_users"),
      readCollection("smv_astrologers"),
      readCollection("smv_questions")
    ]);

    const customers = users.items.filter(x => String(x.role || "").toLowerCase() === "customer");
    return res.json({
      success: true,
      customers,
      users: users.items,
      astrologers: astrologers.items,
      questions: questions.items,
      errors: { users: users.error || null, astrologers: astrologers.error || null, questions: questions.error || null }
    });
  } catch (e) {
    console.error("Admin data load failed:", e);
    return res.status(500).json({ error: e?.message || "Unable to load Admin data." });
  }
});

app.post("/create-order", express.json(), async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    let questionId = String(req.body?.questionId || "").trim();
    let qRef;
    let q;
    if (!questionId) questionId = await nextQuestionId();

    // Create/read the question on the trusted server. The browser no longer calls
    // Firestore to create the question document, which eliminates the empty
    // documentPath error seen before Razorpay opened.
    if (questionId) {
      if (questionId.includes("/") || questionId === "." || questionId === "..") {
        return res.status(400).json({ error: "A valid questionId is required." });
      }
      qRef = db.collection("smv_questions").doc(questionId);
      const qSnap = await qRef.get();
      if (!qSnap.exists) {
        const settingSnap = await db.collection("smv_settings").doc("question").get();
        const configuredPrice = Number(settingSnap.data()?.price || 5);
        const birth = req.body?.birthDetails || {};
        const customerName = String(req.body?.customerName || birth.name || "").trim();
        const questionText = String(req.body?.question || "").trim();
        if (!customerName || !questionText || !birth.birthDate || !birth.birthTime || !String(birth.birthPlace || "").trim()) {
          return res.status(400).json({ error: "Complete customer birth details and question are required." });
        }
        q = {
          customerId: user.uid, customerName, birthName: customerName, question: questionText,
          amount: configuredPrice, status: "awaiting_payment", paymentStatus: "pending",
          allocationStatus: "awaiting_admin",
          birthDetails: {
            name: customerName, birthDate: String(birth.birthDate), birthTime: String(birth.birthTime),
            birthPlace: String(birth.birthPlace).trim(), birthGender: String(birth.birthGender || ""),
            timezone: "Asia/Kolkata", utcOffsetMinutes: 330
          },
          birthDate: String(birth.birthDate), birthTime: String(birth.birthTime),
          birthPlace: String(birth.birthPlace).trim(), birthGender: String(birth.birthGender || ""),
          birthTimezone: "Asia/Kolkata", birthUtcOffsetMinutes: 330,
          createdAt: FieldValue.serverTimestamp()
        };
        await qRef.set(q);
      } else {
        q = qSnap.data();
        if (q.customerId !== user.uid) return res.status(403).json({ error: "You do not own this question." });
        // Preserve India wall-clock birth time. Never reinterpret a user-entered
        // HH:mm value as UTC and shift it by 5:30 hours.
        if (!q.birthTimezone || !q.birthUtcOffsetMinutes || !q.birthDetails?.timezone) {
          await qRef.set({
            birthTimezone: q.birthTimezone || "Asia/Kolkata",
            birthUtcOffsetMinutes: Number(q.birthUtcOffsetMinutes ?? 330),
            birthDetails: {
              ...(q.birthDetails || {}),
              timezone: q.birthDetails?.timezone || "Asia/Kolkata",
              utcOffsetMinutes: Number(q.birthDetails?.utcOffsetMinutes ?? 330)
            }
          }, { merge: true });
          q = {
            ...q,
            birthTimezone: q.birthTimezone || "Asia/Kolkata",
            birthUtcOffsetMinutes: Number(q.birthUtcOffsetMinutes ?? 330),
            birthDetails: {
              ...(q.birthDetails || {}),
              timezone: q.birthDetails?.timezone || "Asia/Kolkata",
              utcOffsetMinutes: Number(q.birthDetails?.utcOffsetMinutes ?? 330)
            }
          };
        }
      }
    } else {
      qRef = db.collection("smv_questions").doc();
      questionId = qRef.id;
      if (!questionId) return res.status(500).json({ error: "Unable to create a valid question ID." });

      const settingSnap = await db.collection("smv_settings").doc("question").get();
      const configuredPrice = Number(settingSnap.data()?.price || 5);
      if (!Number.isFinite(configuredPrice) || configuredPrice < 1) {
        return res.status(409).json({ error: "Question price is not configured correctly by Admin." });
      }

      const birth = req.body?.birthDetails || {};
      const customerName = String(req.body?.customerName || birth.name || "").trim();
      const questionText = String(req.body?.question || "").trim();
      if (!customerName || !questionText || !birth.birthDate || !birth.birthTime || !String(birth.birthPlace || "").trim()) {
        return res.status(400).json({ error: "Complete customer birth details and question are required." });
      }

      q = {
        customerId: user.uid,
        customerName,
        birthName: customerName,
        question: questionText,
        amount: configuredPrice,
        status: "awaiting_payment",
        paymentStatus: "pending",
        allocationStatus: "awaiting_admin",
        birthDetails: {
          name: customerName,
          birthDate: String(birth.birthDate),
          birthTime: String(birth.birthTime),
          birthPlace: String(birth.birthPlace).trim(),
          birthGender: String(birth.birthGender || "")
        },
        birthDate: String(birth.birthDate),
        birthTime: String(birth.birthTime),
        birthPlace: String(birth.birthPlace).trim(),
        birthGender: String(birth.birthGender || ""),
        birthTimezone: "Asia/Kolkata",
        birthUtcOffsetMinutes: 330,
        createdAt: FieldValue.serverTimestamp()
      };
      await qRef.set(q);
    }

    if (!q || q.customerId !== user.uid) return res.status(403).json({ error: "You do not own this question." });
    console.log("[create-order] questionId=", questionId, "customer=", user.uid);

    if (!["awaiting_payment", "payment_failed"].includes(q.status)) {
      if (q.paymentStatus === "paid" && q.razorpayOrderId) {
        return res.status(200).json({
          success: true, alreadyPaid: true, questionId,
          orderId: q.razorpayOrderId, keyId: RAZORPAY_KEY_ID,
          amount: Math.round(Number(q.amount || 0) * 100), currency: "INR"
        });
      }
      return res.status(409).json({ error: "This question is not available for payment." });
    }

    const amount = Number(q.amount || 0);
    const questionSetting = await db.collection("smv_settings").doc("question").get();
    const configuredPrice = Number(questionSetting.data()?.price || amount || 5);
    if (!Number.isFinite(amount) || amount < 1 || !Number.isFinite(configuredPrice) || configuredPrice < 1 || Math.round(amount * 100) !== Math.round(configuredPrice * 100)) {
      return res.status(409).json({ error: "Question price is invalid or has changed. Please start the question again." });
    }

    if (q.razorpayOrderId && ["order_created", "verification_failed", "failed"].includes(q.paymentStatus)) {
      try {
        const existing = await razorpay.orders.fetch(q.razorpayOrderId);
        if (existing.status === "paid") return res.status(409).json({ error: "This payment has already been completed. Please refresh your dashboard." });
        if (Number(existing.amount) === Math.round(amount * 100) && existing.currency === "INR") {
          return res.json({ success: true, questionId, orderId: existing.id, keyId: RAZORPAY_KEY_ID, amount: existing.amount, currency: existing.currency, reused: true });
        }
      } catch (e) { console.warn("Could not reuse old order:", e?.message || e); }
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), currency: "INR",
      receipt: `SMV_${questionId.slice(0, 25)}_${Date.now()}`,
      notes: { questionId, customerId: user.uid, astrologerId: String(q.astrologerId || "") }
    });
    if (!order || !order.id || typeof order.id !== "string") {
      console.error("Razorpay returned an order without a valid order ID", order);
      return res.status(502).json({ error: "Razorpay order was created without a valid order ID." });
    }

    const answerSettings = await db.collection("smv_settings").doc("answer").get();
    const minimumWords = Math.max(1, Math.min(10000, Math.floor(Number(answerSettings.data()?.minimumWords || 150))));
    await qRef.set({ razorpayOrderId: order.id, paymentCurrency: "INR", paymentStatus: "order_created", answerMinWords: minimumWords, paymentUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await db.collection("razorpay_orders").doc(order.id).set({
      razorpayOrderId: order.id, questionId, amount: order.amount, currency: order.currency,
      firebaseUid: user.uid, customerEmail: user.email || null, astrologerId: String(q.astrologerId || ""),
      serviceName: req.body?.serviceName || "Public Astrology Question", status: "created", createdAt: FieldValue.serverTimestamp()
    });
    return res.json({ success: true, questionId, orderId: order.id, keyId: RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency });
  } catch (e) {
    console.error("Create order error:", e);
    return res.status(500).json({ error: e?.error?.description || e?.description || e?.message || "Unable to create Razorpay order" });
  }
});

async function markQuestionPaid(questionId, orderId, paymentId, signature, source) {
  const qRef = db.collection("smv_questions").doc(questionId);
  const result = await db.runTransaction(async tx => {
    const snap = await tx.get(qRef);
    if (!snap.exists) throw new Error("Question not found.");
    const q = snap.data();
    if (q.razorpayOrderId !== orderId) throw new Error("Order mismatch.");
    if (q.paymentStatus === "paid" && q.razorpayPaymentId === paymentId) return { already: true, customerId: q.customerId, customerPaymentId: q.customerPaymentId || null };
    const amount = Number(q.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid question amount.");
    const paymentDateKey = indiaDateKey();
    const paymentCounterRef = db.collection("smv_counters").doc(`payment_${paymentDateKey}`);
    const paymentCounterSnap = await tx.get(paymentCounterRef);
    const paymentInfo = nextPaymentIdInTransaction(paymentDateKey, paymentCounterSnap);
    tx.set(paymentCounterRef, { lastNumber: paymentInfo.next, dateKey: paymentDateKey, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const customerPaymentId = paymentInfo.id;
    const paymentRecordedAt = new Date().toISOString();
    tx.set(db.collection("smv_payments").doc(customerPaymentId), {
      paymentId: customerPaymentId, type: "customer_payment", customerId: q.customerId, astrologerId: null, questionId, bookingId: q.bookingId || null,
      razorpayOrderId: orderId, razorpayPaymentId: paymentId, amount, status: "paid", paymentStatus: "paid", source, createdAt: FieldValue.serverTimestamp(), paymentRecordedAt, updatedAt: FieldValue.serverTimestamp()
    });
    tx.update(qRef, {
      status: "pending_admin_approval", paymentStatus: "paid", allocationStatus: "awaiting_admin", razorpayPaymentId: paymentId, razorpaySignature: signature,
      paidAt: q.paidAt || FieldValue.serverTimestamp(), paymentUpdatedAt: FieldValue.serverTimestamp(), paymentConfirmedBy: source, customerPaymentId, paymentRecordedAt,
      astrologerPaymentId: FieldValue.delete(), commissionStatus: "awaiting_admin_allocation"
    });
    return { already: false, customerId: q.customerId, customerPaymentId, paymentRecordedAt };
  });
  if (!result.already) {
    await db.collection("smv_notifications").add({ userId: result.customerId, type: "payment", title: "Payment successful", message: "Your payment was verified. Your question is now waiting for Admin approval.", questionId, createdAt: FieldValue.serverTimestamp(), read: false });
    const qSnap = await qRef.get();
    const q = qSnap.exists ? (qSnap.data() || {}) : {};
    const customerEmail = String(q.customerEmail || await getUserEmail(result.customerId) || "").trim();
    const amount = Number(q.amount || 0);
    await sendSystemEmail({
      to: [customerEmail, ADMIN_EMAIL],
      subject: "SMV ASTRO — Payment Successful",
      replyTo: ADMIN_EMAIL,
      text: `Payment successful for SMV ASTRO.\n\nQuestion ID: ${questionId}\nCustomer Payment ID: ${result.customerPaymentId || "N/A"}\nAmount: ₹${amount.toFixed(2)}\nRazorpay Payment ID: ${paymentId}\nRazorpay Order ID: ${orderId}\n\nYour question is now waiting for Admin approval.`
    });
    await sendAdminTransactionEmail({ eventType: "PAYMENT SUCCESS", paymentId, orderId, amount, currency: "INR", questionId, customerEmail, status: "paid" });
  }
  return result;
}


app.post("/admin/credit-commission", async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!(await isAdminUser(user))) return res.status(403).json({ error: "Admin access denied." });
  try {
    const questionId = String(req.body?.questionId || "").trim(); if (!questionId) return res.status(400).json({ error: "Question ID is required." });
    const qRef = db.collection("smv_questions").doc(questionId);
    const qSnap = await qRef.get(); if (!qSnap.exists) return res.status(404).json({ error: "Question not found." });
    const q = qSnap.data() || {};
    if (!q.astrologerId) return res.status(400).json({ error: "Astrologer is not assigned." });
    const amount = Number(q.astrologerCommissionAmount || q.commissionAmount || 0);
    if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ error: "Invalid astrologer commission amount." });
    if (q.astrologerPaymentId && q.commissionStatus === "credited") return res.json({ success: true, astrologerPaymentId: q.astrologerPaymentId, commissionAmount: amount, already: true });
    const paymentId = await nextPaymentId();
    const astrologerPaymentId = paymentId.replace(/^SMV-PAY-/, "SMV-PAT-");
    await db.collection("smv_payments").doc(astrologerPaymentId).set({ paymentId: astrologerPaymentId, type:"astrologer_earning", customerId:q.customerId||null, astrologerId:q.astrologerId, questionId, bookingId:q.bookingId||null, grossAmount:Number(q.amount||0), commissionPercent:Number(q.commissionPercent||q.commissionRate||0), commissionAmount:amount, earningAmount:amount, status:"credited", paymentStatus:"pending_withdrawal", source:"admin_answer_approval", createdAt:FieldValue.serverTimestamp(), updatedAt:FieldValue.serverTimestamp() });
    await qRef.update({ astrologerPaymentId:astrologerPaymentId, commissionStatus:"credited", commissionCreditedAt:FieldValue.serverTimestamp(), commissionAmount:amount });
    return res.json({ success:true, astrologerPaymentId:astrologerPaymentId, commissionAmount:amount });
  } catch(e) { console.error("Commission credit error:",e); return res.status(500).json({ error:e?.message||"Unable to credit commission." }); }
});

app.post("/verify-payment", express.json(), async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const questionId = String(req.body?.questionId || "").trim();
    const orderId = String(req.body?.razorpay_order_id || "").trim();
    const paymentId = String(req.body?.razorpay_payment_id || "").trim();
    const signature = String(req.body?.razorpay_signature || "").trim();
    if (!questionId || !orderId || !paymentId || !signature) return res.status(400).json({ error: "Payment verification data is incomplete." });
    const qSnap = await db.collection("smv_questions").doc(questionId).get();
    if (!qSnap.exists) return res.status(404).json({ error: "Question not found." });
    const q = qSnap.data();
    if (q.customerId !== user.uid) return res.status(403).json({ error: "You do not own this question." });
    if (q.razorpayOrderId !== orderId) return res.status(409).json({ error: "Payment order mismatch." });
    const expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    if (!signatureEqual(expected, signature)) {
      const mode = RAZORPAY_KEY_ID.startsWith("rzp_test_") ? "test" : (RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "live" : "unknown");
      console.error("Payment verification signature mismatch", { questionId, orderId, paymentId, mode });
      return res.status(401).json({ error: "Invalid payment signature. Check that Render RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET belong to the same Razorpay mode (both Test or both Live)." });
    }
    let payment = await razorpay.payments.fetch(paymentId);
    if (payment.order_id !== orderId) return res.status(409).json({ error: "Payment order mismatch." });
    const expectedAmount = Math.round(Number(q.amount || 0) * 100);
    if (Number(payment.amount) !== expectedAmount) return res.status(409).json({ error: "Payment amount mismatch." });

    // Razorpay can return an authorised payment before automatic capture.
    // Capture it server-side, then fetch again and continue verification.
    const paymentStatus = String(payment.status || "").toLowerCase();
    if (paymentStatus === "authorized") {
      try {
        await razorpay.payments.capture(paymentId, expectedAmount, String(payment.currency || "INR"));
      } catch (captureError) {
        console.error("Razorpay capture error:", captureError);
        // It may have been captured concurrently; re-fetch before failing.
      }
      payment = await razorpay.payments.fetch(paymentId);
    }
    if (String(payment.status).toLowerCase() !== "captured") {
      return res.status(409).json({
        error: "Payment is authorised but could not be captured yet.",
        paymentStatus: payment.status || null,
        paymentId,
        orderId
      });
    }
    const result = await markQuestionPaid(questionId, orderId, paymentId, signature, "render_checkout_verification");
    await db.collection("razorpay_orders").doc(orderId).set({ razorpayPaymentId: paymentId, status: "verified", questionId, verifiedAt: FieldValue.serverTimestamp() }, { merge: true });
    return res.json({ verified: true, questionId, alreadyProcessed: result.already, customerPaymentId: result.customerPaymentId || null, paymentRecordedAt: result.paymentRecordedAt || new Date().toISOString(), message: "Payment verified and consultation updated successfully." });
  } catch (e) {
    console.error("Payment verification error:", e);
    return res.status(500).json({ error: e?.error?.description || e?.description || e?.message || "Payment verification failed" });
  }
});

app.post("/razorpay/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.get("X-Razorpay-Signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!signature || !secret) return res.status(400).send("Invalid webhook configuration");
    const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
    if (!signatureEqual(expected, signature)) return res.status(401).send("Invalid signature");
    const event = JSON.parse(req.body.toString("utf8"));
    const eventType = event.event || "unknown";
    const paymentEntity = event?.payload?.payment?.entity || null;
    const orderEntity = event?.payload?.order?.entity || null;
    const paymentId = paymentEntity?.id || null;
    const orderId = orderEntity?.id || paymentEntity?.order_id || null;
    const eventKey = `${eventType}_${paymentId || orderId || crypto.createHash("sha256").update(req.body).digest("hex")}`.replace(/\//g, "_");
    if (!eventKey) return res.status(400).send("Invalid webhook event key");
    const eventRef = db.collection("razorpay_webhook_events").doc(eventKey);
    if ((await eventRef.get()).exists) return res.status(200).send("OK");
    await eventRef.set({ event: eventType, razorpayPaymentId: paymentId, razorpayOrderId: orderId, receivedAt: FieldValue.serverTimestamp(), processed: false });
    if (orderId) {
      const orderRef = db.collection("razorpay_orders").doc(orderId);
      const orderSnap = await orderRef.get();
      const stored = orderSnap.exists ? orderSnap.data() : {};
      const newStatus = ["payment.captured", "order.paid"].includes(eventType) ? "paid" : eventType === "payment.failed" ? "failed" : null;
      if (newStatus) await orderRef.set({ status: newStatus, razorpayPaymentId: paymentId, lastWebhookEvent: eventType, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      if (newStatus === "paid" && stored.questionId && paymentId) {
        try {
          const qSnap = await db.collection("smv_questions").doc(stored.questionId).get();
          if (qSnap.exists && qSnap.data().paymentStatus !== "paid") await markQuestionPaid(stored.questionId, orderId, paymentId, "", "razorpay_webhook");
        } catch (e) { console.error("Webhook question update failed:", e); }
      }
      if (newStatus === "failed" && stored.questionId) {
        await db.collection("smv_questions").doc(stored.questionId).set({ status: "payment_failed", paymentStatus: "failed", paymentUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
        const qSnap = await db.collection("smv_questions").doc(stored.questionId).get();
        const q = qSnap.exists ? (qSnap.data() || {}) : {};
        const customerEmail = String(q.customerEmail || stored.customerEmail || await getUserEmail(q.customerId || stored.firebaseUid) || "").trim();
        const amount = paymentEntity?.amount != null ? Number(paymentEntity.amount) / 100 : Number(q.amount || stored.amount || 0);
        await sendSystemEmail({
          to: [customerEmail, ADMIN_EMAIL],
          subject: "SMV ASTRO — Payment Failed",
          replyTo: ADMIN_EMAIL,
          text: `A SMV ASTRO payment was not completed.\n\nQuestion ID: ${stored.questionId}\nAmount: ₹${Number(amount || 0).toFixed(2)}\nRazorpay Payment ID: ${paymentId || "N/A"}\nRazorpay Order ID: ${orderId || "N/A"}\nStatus: Failed`
        });
        await sendAdminTransactionEmail({ eventType: "PAYMENT FAILED", paymentId, orderId, amount, currency: "INR", questionId: stored.questionId, customerEmail, status: "failed" });
      }
    }
    // Refund and other Razorpay transaction events are always copied to Admin.
    if (eventType.startsWith("refund.")) {
      const refundEntity = event?.payload?.refund?.entity || {};
      const amount = refundEntity.amount != null ? Number(refundEntity.amount) / 100 : null;
      await sendAdminTransactionEmail({
        eventType: eventType.toUpperCase(),
        paymentId: refundEntity.payment_id || paymentId,
        orderId,
        amount,
        currency: refundEntity.currency || "INR",
        questionId: stored?.questionId || null,
        customerEmail: stored?.customerEmail || null,
        status: refundEntity.status || eventType
      });
    } else if (!["payment.captured","order.paid","payment.failed"].includes(eventType)) {
      await sendAdminTransactionEmail({
        eventType: eventType.toUpperCase(),
        paymentId,
        orderId,
        amount: paymentEntity?.amount != null ? Number(paymentEntity.amount) / 100 : null,
        currency: paymentEntity?.currency || orderEntity?.currency || "INR",
        questionId: null,
        customerEmail: null,
        status: eventType
      });
    }
    await eventRef.set({ processed: true, processedAt: FieldValue.serverTimestamp() }, { merge: true });
    return res.status(200).send("OK");
  } catch (e) {
    console.error("Webhook processing error:", e);
    return res.status(500).send("Webhook processing failed");
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`SMV ASTRO Razorpay backend running on port ${PORT}`));

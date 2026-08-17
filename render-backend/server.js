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
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Render.");
}
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(x => x.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin || "*");
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Vary", "Origin");
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




app.get("/email-status", async (req,res)=>{
  const resendConfigured=!!RESEND_API_KEY;
  const smtpConfigured=!!smtpTransport;
  const configured=!!(ADMIN_EMAIL && (resendConfigured || smtpConfigured));
  res.json({
    ok:configured,
    provider:resendConfigured?"resend":"smtp",
    adminEmailConfigured:!!ADMIN_EMAIL,
    resendApiKeyConfigured:resendConfigured,
    resendFromConfigured:!!RESEND_FROM,
    smtpConfigured,
    message:configured?"Email service is configured.":"Set ADMIN_EMAIL, RESEND_API_KEY and RESEND_FROM in Render Environment.",
    version:"2026-08-17-v67.1-razorpay-authorised-capture-fix"
  });
});

app.post("/admin/test-email", express.json({limit:"5kb"}), async(req,res)=>{
  const user=await requireUser(req,res); if(!user)return;
  if(!(await isAdminUser(user)))return res.status(403).json({error:"Admin access required."});
  try{
    if(!ADMIN_EMAIL || !RESEND_API_KEY) return res.status(503).json({error:"RESEND_API_KEY and ADMIN_EMAIL are required."});
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: "SMV ASTRO — Email system test",
      text: "This is a test email from the SMV ASTRO Render backend. If you received this message, Resend email delivery is working.",
      html: "<p>This is a test email from the <b>SMV ASTRO</b> Render backend.</p><p>If you received this message, Resend email delivery is working.</p>"
    });
    return res.json({ok:true,message:"Test email sent successfully.",to:ADMIN_EMAIL});
  }catch(e){
    console.error("Admin email test failed:",e);
    return res.status(502).json({ok:false,error:e?.message||"Resend email test failed."});
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
    if(!to.length) return res.status(400).json({error:"No recipient email address is available for this update."});
    await sendEmail({to,replyTo:ADMIN_EMAIL,subject,text});
    return res.json({ok:true,recipients:to.length,event});
  }catch(e){console.error("Question notification failed:",e);return res.status(500).json({error:"Unable to send question update email right now."});}
});

app.post("/appointment-booking", express.json({ limit: "20kb" }), async (req, res) => {
  try {
    const name=String(req.body?.name||"").trim(), email=String(req.body?.email||"").trim(), mobile=String(req.body?.mobile||"").trim();
    const type=String(req.body?.type||"").trim(), preferredDate=String(req.body?.preferredDate||"").trim(), preferredTime=String(req.body?.preferredTime||"").trim(), notes=String(req.body?.notes||"").trim();
    if(!name||!email||!mobile||!type||!preferredDate||!preferredTime) return res.status(400).json({error:"Please fill all required appointment fields."});
    if(!["Chat Consultation","Call Consultation"].includes(type)) return res.status(400).json({error:"Please choose Chat or Call consultation."});
    if(name.length>100||email.length>160||mobile.length>20||notes.length>2000) return res.status(400).json({error:"One or more fields are too long."});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:"Please enter a valid email address."});
    const ref=db.collection("appointments").doc();
    await ref.set({name,email,mobile,type,preferredDate,preferredTime,notes,status:"new",createdAt:FieldValue.serverTimestamp(),source:"website-appointment-form"});
    if(!ADMIN_EMAIL||(!RESEND_API_KEY && !smtpTransport)) return res.status(503).json({error:"Appointment email service is not configured yet. Add RESEND_API_KEY and RESEND_FROM in Render."});
    await sendEmail({to:ADMIN_EMAIL,replyTo:email,subject:`New SVM ASTRO ${type} Request — ${name}`,text:["New SVM ASTRO Appointment Request","",`Name: ${name}`,`Email: ${email}`,`Mobile: ${mobile}`,`Type: ${type}`,`Preferred: ${preferredDate} ${preferredTime}`,`Notes: ${notes||"None"}`,`Appointment ID: ${ref.id}`].join("\n")});
    return res.json({ok:true,appointmentId:ref.id});
  } catch(e){console.error("Appointment booking failed:",e);return res.status(502).json({error:e?.message||"Unable to submit appointment request."});}
});

app.get("/public-announcements", async (req,res)=>{
  try{
    // Deliberately avoid where/orderBy so this endpoint never requires a
    // Firestore composite index. Filter and sort in memory instead.
    const snap=await db.collection("smv_announcements").limit(100).get();
    const announcements=snap.docs.map(d=>({id:d.id,...d.data()}))
      .filter(x=>x.active===true)
      .sort((a,b)=>{
        const at=a.createdAt?.toMillis?a.createdAt.toMillis():(a.createdAt?.seconds||0)*1000;
        const bt=b.createdAt?.toMillis?b.createdAt.toMillis():(b.createdAt?.seconds||0)*1000;
        return bt-at;
      }).slice(0,5);
    return res.json({announcements});
  } catch(e){console.error("Announcements read failed:",e?.message||e);return res.json({announcements:[]});}
});

app.post("/admin/announcement", express.json({limit:"10kb"}), async(req,res)=>{
  const user=await requireUser(req,res); if(!user)return; if(!(await isAdminUser(user)))return res.status(403).json({error:"Admin access required."});
  try{const title=String(req.body?.title||"").trim(),message=String(req.body?.message||"").trim();if(!title||!message)return res.status(400).json({error:"Title and message are required."});const ref=db.collection("smv_announcements").doc();await ref.set({title,message,active:true,createdAt:FieldValue.serverTimestamp(),createdBy:user.uid});return res.json({ok:true,id:ref.id});}
  catch(e){return res.status(500).json({error:e?.message||"Unable to publish announcement."});}
});

app.delete("/admin/announcement/:id", async(req,res)=>{
  const user=await requireUser(req,res); if(!user)return; if(!(await isAdminUser(user)))return res.status(403).json({error:"Admin access required."});
  try{await db.collection("smv_announcements").doc(req.params.id).delete();return res.json({ok:true});}catch(e){return res.status(500).json({error:e?.message||"Unable to delete announcement."});}
});

app.get("/admin/appointments", async(req,res)=>{
  const user=await requireUser(req,res); if(!user)return; if(!(await isAdminUser(user)))return res.status(403).json({error:"Admin access required."});
  try{
    // Avoid orderBy so an index can never block the Admin Dashboard.
    const snap=await db.collection("appointments").limit(200).get();
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
  try{const id=String(req.body?.id||"").trim(),status=String(req.body?.status||"").trim();if(!id||!["new","confirmed","completed","cancelled"].includes(status))return res.status(400).json({error:"Invalid appointment update."});await db.collection("appointments").doc(id).update({status,updatedAt:FieldValue.serverTimestamp(),updatedBy:user.uid});return res.json({ok:true});}catch(e){return res.status(500).json({error:e?.message||"Unable to update appointment."});}
});

app.post("/create-order", express.json(), async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    let questionId = String(req.body?.questionId || "").trim();
    let qRef;
    let q;

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
    if (q.paymentStatus === "paid" && q.razorpayPaymentId === paymentId) return { already: true, customerId: q.customerId, astrologerId: q.astrologerId };
    const amount = Number(q.amount || 0);
    const commissionSnap = await db.collection("smv_settings").doc("commission").get();
    const commission = commissionSnap.exists ? commissionSnap.data() : { astroPercent: 20, adminPercent: 80 };
    const astroPercent = Number(commission.astroPercent ?? 20);
    const adminPercent = Number(commission.adminPercent ?? 80);
    if (astroPercent < 0 || adminPercent < 0 || Math.abs(astroPercent + adminPercent - 100) > 0.001) throw new Error("Commission settings are invalid.");
    const astroCommission = Math.round(amount * astroPercent) / 100;
    const adminCommission = Math.round(amount * adminPercent) / 100;
    tx.update(qRef, {
      status: "pending_admin_approval", paymentStatus: "paid", allocationStatus: "awaiting_admin", razorpayPaymentId: paymentId, razorpaySignature: signature,
      paidAt: q.paidAt || FieldValue.serverTimestamp(), paymentUpdatedAt: FieldValue.serverTimestamp(),
      paymentConfirmedBy: source, commissionPercent: astroPercent,
      astrologerCommissionAmount: astroCommission, adminCommissionAmount: adminCommission
    });
    return { already: false, customerId: q.customerId, astrologerId: q.astrologerId, astroCommission, adminCommission };
  });
  if (!result.already) {
    await db.collection("smv_notifications").add({ userId: result.customerId, type: "payment", title: "Payment successful", message: "Your payment was verified. Your question is now waiting for Admin approval.", questionId, createdAt: FieldValue.serverTimestamp(), read: false });
  }
  return result;
}

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
    return res.json({ verified: true, questionId, alreadyProcessed: result.already, message: "Payment verified and consultation updated successfully." });
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
      if (newStatus === "failed" && stored.questionId) await db.collection("smv_questions").doc(stored.questionId).set({ status: "payment_failed", paymentStatus: "failed", paymentUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    await eventRef.set({ processed: true, processedAt: FieldValue.serverTimestamp() }, { merge: true });
    return res.status(200).send("OK");
  } catch (e) {
    console.error("Webhook processing error:", e);
    return res.status(500).send("Webhook processing failed");
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`SMV ASTRO Razorpay backend running on port ${PORT}`));
